import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const rateLimitKey = `invite-verify:${getRateLimitKey(req)}`;
  const rl = rateLimit(rateLimitKey, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(req.url);
  const qToken = url.searchParams.get("token");
  let body: any = {};
  try { body = await req.json(); } catch {}
  const token = (body?.token || qToken || "").toString();
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invite = await prisma.invite_tokens.findUnique({ where: { token_hash: tokenHash } }).catch(() => null);

  const now = new Date();
  const ok = !!invite && !invite.used && invite.expires_at > now;

  await prisma.event_logs.create({
    data: {
      event_name: "invite.verify_attempt",
      payload: { ok, rateLimitKey, ua: req.headers.get("user-agent") || "", invite_id: invite?.id, email: invite?.email },
    },
  }).catch(() => {});

  if (!ok) return NextResponse.json({ valid: false, reason: invite ? (invite.used ? "used" : "expired") : "invalid" }, { status: 400 });

  // Mask email for display
  const email = invite!.email;
  const [name, domain] = email.split("@");
  const masked = `${name[0]}***@${domain}`;

  return NextResponse.json({ valid: true, email: masked, expires_at: invite!.expires_at });
}
