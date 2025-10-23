import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, inviteEmailTemplate } from "@/lib/email";
import { randomBytes, createHash } from "crypto";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function bool(v: string | null, def = undefined as boolean | undefined) {
  if (v === null) return def;
  if (v === "true") return true;
  if (v === "false") return false;
  return def;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const cookieStore = cookies();
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed =
    ctx.roles.includes("ADMIN") ||
    ctx.permissions.includes("pro_portal_access") ||
    ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = (url.searchParams.get("q") || "").trim();
  const status = url.searchParams.get("status"); // active|inactive|any
  const role = (url.searchParams.get("role") || "").trim(); // filter by employee_roles.role
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  const whereEmp: any = { business_id: businessId, ...(status === "active" ? { is_active: true } : status === "inactive" ? { is_active: false } : {}) };
  if (q) {
    whereEmp.OR = [
      { full_name: { contains: q, mode: "insensitive" as any } },
      { email: { contains: q, mode: "insensitive" as any } },
      { phone: { contains: q, mode: "insensitive" as any } },
      { employee_roles: { some: { role: { contains: q, mode: "insensitive" as any } } } },
    ];
  }
  if (role) whereEmp.employee_roles = { some: { role } };

  const employees = await prisma.employees.findMany({
    where: whereEmp,
    orderBy: { full_name: "asc" },
    skip: offset,
    take: limit,
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      is_active: true,
      profession_label: true,
      employee_roles: { select: { role: true } },
      employee_accounts: { select: { user_id: true } },
    },
  });

  const userIds = employees.flatMap((e) => e.employee_accounts.map((a) => a.user_id));
  const users = userIds.length ? await prisma.users.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } }) : [];
  const usersById = new Map(users.map((u) => [u.id, u] as const));

  // Load employee pro-permissions for listed employees in this business
  const employeeIds = employees.map((e) => e.id);
  const empPerms = employeeIds.length
    ? await prisma.employee_permissions.findMany({
        where: { employee_id: { in: employeeIds }, business_id: businessId },
        select: { employee_id: true, pro_permissions: { select: { code: true } } },
      } as any)
    : [];
  const permsByEmployee = new Map<string, string[]>();
  for (const ep of empPerms as any[]) {
    const list = permsByEmployee.get(ep.employee_id) || [];
    const code = ep.pro_permissions?.code;
    if (code) list.push(code);
    permsByEmployee.set(ep.employee_id, Array.from(new Set(list)));
  }

  const lastLogins = userIds.length
    ? await prisma.login_attempts.findMany({
        where: { user_id: { in: userIds }, success: true },
        orderBy: { attempted_at: "desc" },
        select: { user_id: true, attempted_at: true },
      })
    : [];
  const lastLoginByUser = new Map<string, Date>();
  for (const a of lastLogins) if (!lastLoginByUser.has(a.user_id!)) lastLoginByUser.set(a.user_id!, a.attempted_at);

  // Stats
  const total = await prisma.employees.count({ where: { business_id: businessId } });
  const active = await prisma.employees.count({ where: { business_id: businessId, is_active: true } });
  const rolesAgg = await prisma.employee_roles.groupBy({ by: ["role"], _count: { role: true }, where: { employees: { business_id: businessId } } as any });

  const items = employees.map((e) => {
    const userId = e.employee_accounts[0]?.user_id || null;
    const u = userId ? usersById.get(userId) : null;
    const perms = permsByEmployee.get(e.id) || [];
    const last = userId ? lastLoginByUser.get(userId) : undefined;
    const dbRole = e.employee_roles[0]?.role || null;
    return {
      id: e.id,
      name: e.full_name,
      email: e.email || u?.email || null,
      phone: e.phone || null,
      status: e.is_active ? "Actif" : "Inactif",
      profession: e.profession_label || dbRole,
      permissions: perms,
      last_login_at: last || null,
    };
  });

  return NextResponse.json({
    items,
    total,
    active,
    roles_breakdown: rolesAgg.map((r) => ({ role: r.role, count: (r as any)._count.role }))
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const cookieStore = cookies();
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed =
    ctx.roles.includes("ADMIN") ||
    ctx.permissions.includes("pro_portal_access") ||
    ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { employee_id, user_email, role_codes, employee_role, permission_codes } = body || {};
  if (!employee_id || typeof employee_id !== "string") return NextResponse.json({ error: "employee_id required" }, { status: 400 });

  const emp = await prisma.employees.findUnique({ where: { id: employee_id }, select: { id: true, business_id: true } });
  if (!emp || emp.business_id !== businessId) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  let user = user_email ? await prisma.users.findUnique({ where: { email: user_email } }) : null;
  let newUserCreated = false;
  if (!user && user_email) {
    user = await prisma.users.create({ data: { email: user_email } });
    newUserCreated = true;
  }
  if (!user) {
    return NextResponse.json({ error: "user_email required" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // Link account
    await tx.employee_accounts.upsert({
      where: { user_id: user.id },
      update: { employee_id: employee_id },
      create: { user_id: user.id, employee_id: employee_id },
    } as any);

    // Set employee role with the exact label provided (no STAFF/MANAGER mapping)
    if (typeof employee_role === "string" && employee_role.trim()) {
      const norm = employee_role.trim().toLowerCase();
      const labelMap: Record<string, string> = {
        admin_institut: "Admin Institut",
        manager: "Manager",
        gestionnaire: "Gestionnaire",
        receptionniste: "Réceptionniste",
        praticien: "Praticien",
        agent_commercial: "Agent commercial",
      };
      const exactRole = labelMap[norm] || employee_role.trim();
      await tx.employee_roles.deleteMany({ where: { employee_id } });
      await tx.employee_roles.create({ data: { employee_id, role: exactRole } });
      // Keep profession_label aligned for UI display
      await tx.employees.update({ where: { id: employee_id }, data: { profession_label: exactRole } });
    }

    // Persist direct pro permissions for the employee (scoped to business)
    if (Array.isArray(permission_codes)) {
      await tx.employee_permissions.deleteMany({ where: { employee_id, business_id: businessId } });
      const perms = await tx.pro_permissions.findMany({ where: { code: { in: permission_codes } }, select: { id: true } });
      if (perms.length) {
        await tx.employee_permissions.createMany({ data: perms.map((p) => ({ employee_id, permission_id: p.id, business_id: businessId })) });
      }
    }
  });

  // Send invite email with magic link if we created a new user just now
  if (newUserCreated && user?.email) {
    try {
      const rawToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
      await prisma.invite_tokens.create({
        data: {
          user_id: user.id,
          email: user.email,
          token_hash: tokenHash,
          expires_at: expiresAt,
          used: false,
          created_by: ctx.userId,
        },
      } as any);

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const tpl = inviteEmailTemplate({ firstName: null, appUrl, token: rawToken, validityHours: 24 });
      await sendEmail({ to: user.email, subject: "Activez votre compte employé", html: tpl.html, text: tpl.text, category: "employee_invite" });
    } catch (e) {
      // Non-bloquant: on log mais on ne casse pas la création
      await prisma.event_logs.create({ data: { event_name: "employee.invite_email_error", payload: { error: (e as any)?.message, user_id: user?.id, email: user?.email } } }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
