import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function pad(n: number) { return String(n).padStart(2, "0"); }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

// Build a Date at given local day with time expressed from a Time value stored as Date (UTC parts)
function applyTimeLocal(baseDay: Date, time: Date) {
  const h = time.getUTCHours();
  const m = time.getUTCMinutes();
  const d = new Date(baseDay);
  d.setHours(0,0,0,0);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = params.id;
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const employeeId = searchParams.get("employeeId");
    const daysParam = Math.max(1, Math.min(31, Number(searchParams.get("days") || 7)));
    const startStr = searchParams.get('start');

    if (!businessId) return NextResponse.json({ error: "Missing business id" }, { status: 400 });
    if (!serviceId) return NextResponse.json({ error: "Missing serviceId" }, { status: 400 });

    // Resolve service duration (take shortest active variant if any)
    const service = await prisma.services.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        business_id: true,
        service_variants: { where: { is_active: true }, orderBy: { duration_minutes: "asc" }, select: { duration_minutes: true } },
      },
    });
    if (!service || service.business_id !== businessId) {
      return NextResponse.json({ error: "Service not found for this business" }, { status: 404 });
    }
    const duration = service.service_variants?.[0]?.duration_minutes ?? 30;

    // Load working hours (employee-specific takes precedence if provided)
    let wh = await prisma.working_hours.findMany({
      where: {
        business_id: businessId,
        employee_id: employeeId ? employeeId : null,
      },
      select: { weekday: true, start_time: true, end_time: true },
    });
    // Fallback to business hours if no employee-specific hours
    if (employeeId && wh.length === 0) {
      wh = await prisma.working_hours.findMany({
        where: { business_id: businessId, employee_id: null },
        select: { weekday: true, start_time: true, end_time: true },
      });
    }

    const now = new Date();
    const leadMs = 2 * 60 * 60 * 1000; // 2h lead time
    const slotStep = 30; // minutes

    const result: Array<{ date: string; slots: Array<{ time: string }> }> = [];

    // Determine start day (local midnight)
    const startDay = (() => {
      if (startStr) {
        const [y,m,d] = startStr.split('-').map(n => Number(n));
        const dt = new Date();
        if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
          dt.setFullYear(y, (m-1), d);
          dt.setHours(0,0,0,0);
          return dt;
        }
      }
      const dt = new Date();
      dt.setHours(0,0,0,0);
      return dt;
    })();

    for (let i = 0; i < daysParam; i++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      const weekday = day.getDay(); // 0..6 (0=Sunday)
      const entries = wh.filter(x => x.weekday === weekday);
      const daySlots: Array<{ time: string }> = [];

      for (const e of entries) {
        const start = applyTimeLocal(day, e.start_time as any as Date);
        const end = applyTimeLocal(day, e.end_time as any as Date);
        // iterate by step ensuring slot + duration fits before end
        for (let t = new Date(start); t.getTime() + duration*60000 <= end.getTime(); t = new Date(t.getTime() + slotStep*60000)) {
          // respect lead time
          if (t.getTime() < now.getTime() + leadMs) continue;
          const timeStr = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
          daySlots.push({ time: timeStr });
        }
      }

      result.push({ date: ymd(day), slots: daySlots });
    }

    return NextResponse.json({ days: result });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
