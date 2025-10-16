import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const status = (body?.status || "").toString();
  const notes = body?.notes ? String(body.notes) : undefined;
  const allowed = new Set(["pending", "contacted", "invited", "validated"]);
  if (!allowed.has(status as any)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    const lead = await prisma.business_leads.update({ where: { id }, data: { status } });
    await prisma.event_logs.create({ data: { event_name: "lead.status_changed", payload: { lead_id: id, status, notes } } });
    return NextResponse.json({ ok: true, id: lead.id, status });
  } catch (e: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
