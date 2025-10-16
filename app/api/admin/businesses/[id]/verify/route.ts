import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrPermission("BUSINESS_VERIFY");
  if (auth instanceof NextResponse) return auth;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const status = (body?.status || "").toString();
  const notes: string | undefined = body?.notes || undefined;

  if (!["verified", "rejected"].includes(status)) {
    return NextResponse.json({ error: "status must be 'verified' or 'rejected'" }, { status: 400 });
  }

  const businessId = params.id;
  const current = await prisma.businesses.findUnique({ where: { id: businessId } });
  if (!current) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Upsert verification row (single active record per business)
  const prev = await prisma.business_verifications.findFirst({ where: { business_id: businessId }, orderBy: { created_at: "desc" } });
  const verification = prev
    ? await prisma.business_verifications.update({
        where: { id: prev.id },
        data: { status: status as any, reviewed_by: auth.userId, reviewed_at: new Date(), notes },
      })
    : await prisma.business_verifications.create({
        data: { business_id: businessId, status: status as any, reviewed_by: auth.userId, reviewed_at: new Date(), notes },
      });

  // Update business.status
  const newBusinessStatus = status === "verified" ? ("verified" as any) : ("pending_verification" as any);
  await prisma.businesses.update({ where: { id: businessId }, data: { status: newBusinessStatus } });

  await prisma.event_logs.create({
    data: {
      user_id: auth.userId,
      business_id: businessId,
      event_name: status === "verified" ? "verification.approved" : "verification.rejected",
      payload: { verification_id: verification.id, notes },
    },
  });

  return NextResponse.json({ ok: true, verification_id: verification.id, business_id: businessId, status });
}
