import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { createHash } from "crypto";
import { createSessionData, setAuthCookies, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const rateLimitKey = `invite-complete:${getRateLimitKey(req)}`;
  const rl = rateLimit(rateLimitKey, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = (body?.token || "").toString();
  const password = (body?.password || "").toString();
  if (!token || !password) return NextResponse.json({ error: "Token and password are required" }, { status: 400 });

  if (password.length < 8) return NextResponse.json({ error: "Password too short" }, { status: 400 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invite = await prisma.invite_tokens.findUnique({ where: { token_hash: tokenHash } }).catch(() => null);
  const now = new Date();
  const ok = !!invite && !invite.used && invite.expires_at > now;

  await prisma.event_logs.create({
    data: {
      event_name: "invite.complete_attempt",
      payload: { ok, rateLimitKey, ua: req.headers.get("user-agent") || "", invite_id: invite?.id, email: invite?.email },
    },
  }).catch(() => {});

  if (!ok) return NextResponse.json({ error: invite ? (invite.used ? "Token already used" : "Token expired") : "Invalid token" }, { status: 400 });

  // Update user password
  const newHash = await hashPassword(password);
  await prisma.users.update({ where: { id: invite!.user_id }, data: { password_hash: newHash, updated_at: new Date() } });

  // Mark token used
  await prisma.invite_tokens.update({ where: { token_hash: tokenHash }, data: { used: true } });

  // Ensure invited user has PRO role on their business(es)
  try {
    const proRole = await prisma.roles.findUnique({ where: { code: "PRO" } });
    if (proRole) {
      const businesses = await prisma.businesses.findMany({ where: { owner_user_id: invite!.user_id }, select: { id: true } });
      for (const b of businesses) {
        await prisma.user_roles.upsert({
          where: { user_id_role_id_business_id: { user_id: invite!.user_id, role_id: proRole.id, business_id: b.id } as any },
          update: {},
          create: { user_id: invite!.user_id, role_id: proRole.id, business_id: b.id },
        } as any);
      }
    }
  } catch {}

  // Create session cookie response
  const sessionData = await createSessionData(invite!.user_id);
  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, sessionData);

  // If this user is linked to an employee account, set the business_id cookie to that employee's business
  try {
    const acc = await prisma.employee_accounts.findUnique({ where: { user_id: invite!.user_id } });
    const empId = acc?.employee_id;
    if (empId) {
      const emp = await prisma.employees.findUnique({ where: { id: empId }, select: { business_id: true } });
      const businessId = emp?.business_id;
      if (businessId) {
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
        res.cookies.set("business_id", businessId, {
          httpOnly: false,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          expires: expiresAt,
          path: "/",
        });
      }
    }
  } catch {}

  await prisma.event_logs.create({
    data: {
      user_id: invite!.user_id,
      event_name: "invite.completed",
      payload: { rateLimitKey, ua: req.headers.get("user-agent") || "", invite_id: invite!.id },
    },
  }).catch(() => {});

  return res; // JSON { ok: true } with cookies set
}
