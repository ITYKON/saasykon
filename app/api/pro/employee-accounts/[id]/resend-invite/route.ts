import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { sendEmail, inviteEmailTemplate } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

  const employeeId = params.id;
  if (!employeeId) return NextResponse.json({ error: "employee_id required" }, { status: 400 });

  const employee = await prisma.employees.findFirst({ where: { id: employeeId, business_id: businessId }, include: { employee_accounts: true } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  // Determine email/user
  const userId = employee.employee_accounts[0]?.user_id;
  let user = userId ? await prisma.users.findUnique({ where: { id: userId } }) : null;
  if (!user) {
    // fallback: create user if employee has email but no user
    if (!employee.email) return NextResponse.json({ error: "Employee has no email" }, { status: 400 });
    user = await prisma.users.upsert({
      where: { email: employee.email },
      update: {},
      create: { email: employee.email },
    });
    // ensure link
    await prisma.employee_accounts.upsert({
      where: { user_id: user.id },
      update: { employee_id: employeeId },
      create: { user_id: user.id, employee_id: employeeId },
    } as any);
  }

  // Create a fresh invite token
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
  await sendEmail({ to: user.email, subject: "Votre accès employé - lien d'invitation", html: tpl.html, text: tpl.text, category: "employee_invite_resend" });

  await prisma.event_logs.create({
    data: { user_id: user.id, business_id: businessId, event_name: "employee.invite_resent", payload: { employee_id: employeeId, email: user.email } },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
