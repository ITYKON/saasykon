import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  // Vérifier si l'utilisateur est ADMIN, PRO ou EMPLOYEE avec les bonnes permissions
  let allowed = 
    ctx.roles.includes("ADMIN") || 
    ctx.roles.includes("EMPLOYEE") ||
    ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  
  // Si l'utilisateur est un employé, vérifier les permissions spécifiques
  if (ctx.roles.includes("EMPLOYEE") && !allowed) {
    try {
      const acc = await prisma.employee_accounts.findUnique({ 
        where: { user_id: ctx.userId } 
      }).catch(() => null);
      
      if (acc) {
        // Vérifier si l'employé a les permissions nécessaires
        const perms = await prisma.employee_permissions.findMany({
          where: { 
            employee_id: acc.employee_id, 
            business_id: businessId,
            pro_permissions: {
              code: { in: ["employees", "employees_manage"] }
            }
          },
          include: { 
            pro_permissions: { 
              select: { code: true } 
            } 
          },
        });
        
        allowed = perms.length > 0;
      }
    } catch (error) {
      console.error("Error checking employee permissions:", error);
    }
  }
  
  if (!allowed) {
    return NextResponse.json({ 
      error: "Forbidden",
      details: "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource."
    }, { status: 403 });
  }

  const q = (url.searchParams.get("q") || "").trim();
  const include = (url.searchParams.get("include") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
  const sort = (url.searchParams.get("sort") || "name").toLowerCase(); // name|created|updated

  const where: any = { business_id: businessId };
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" as any } },
      { email: { contains: q, mode: "insensitive" as any } },
      { phone: { contains: q, mode: "insensitive" as any } },
    ];
  }

  const orderBy =
    sort === "created"
      ? { created_at: "desc" as const }
      : sort === "updated"
      ? { updated_at: "desc" as const }
      : { full_name: "asc" as const };

  const selectBase: any = { id: true, full_name: true, email: true, phone: true, is_active: true, profession_label: true };
  const withRoles = include.includes("roles");
  const withServices = include.includes("services");
  const withHours = include.includes("hours");

  if (withRoles) selectBase.employee_roles = { select: { role: true } };
  if (withServices) selectBase.employee_services = { select: { services: { select: { id: true, name: true } } } };
  if (withHours) selectBase.working_hours = { select: { id: true, weekday: true, start_time: true, end_time: true, breaks: true } };

  const [total, employees] = await Promise.all([
    prisma.employees.count({ where }),
    prisma.employees.findMany({ where, orderBy, skip: offset, take: limit, select: selectBase }),
  ]);

  return NextResponse.json({ items: employees, total });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  let allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) {
    try {
      const acc = await prisma.employee_accounts.findUnique({ where: { user_id: ctx.userId } }).catch(() => null);
      if (acc) {
        const perms = await prisma.employee_permissions.findMany({
          where: { employee_id: acc.employee_id, business_id: businessId },
          include: { pro_permissions: { select: { code: true } } },
        } as any);
        const codes = new Set<string>(perms.map((p: any) => p.pro_permissions?.code).filter(Boolean));
        allowed = codes.has("employees_manage");
      }
    } catch {}
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { full_name, email, phone, color, is_active, profession_label } = body || {};
  if (!full_name || typeof full_name !== "string") {
    return NextResponse.json({ error: "full_name required" }, { status: 400 });
  }

  const created = await prisma.employees.create({
    data: {
      business_id: businessId,
      full_name,
      email: email || null,
      phone: phone || null,
      color: color || null,
      profession_label: profession_label || null,
      ...(typeof is_active === "boolean" ? { is_active } : {}),
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}

