import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrPermission("LEADS_VIEW");
  if (auth instanceof NextResponse) return auth;

  const lead = await prisma.business_leads.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Pull timeline events related to this lead (by payload.lead_id) and also invite events for the same email
  const events = await prisma.event_logs.findMany({
    where: {
      OR: [
        { payload: { path: ["lead_id"], equals: lead.id } as any },
        { payload: { path: ["email"], equals: lead.email } as any },
      ],
    },
    orderBy: { occurred_at: "desc" },
    take: 200,
  }).catch(() => []);

  // Convert possible BigInt fields to strings for JSON serialization
  const safe = (data: unknown) =>
    JSON.parse(
      JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
    );

  return NextResponse.json({ lead: safe(lead), history: safe(events) });
}
