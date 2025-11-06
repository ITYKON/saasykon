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

    // Load working hours and qualified employees
    const businessWh = await prisma.working_hours.findMany({
      where: { business_id: businessId, employee_id: null },
      select: { weekday: true, start_time: true, end_time: true },
    });

    let candidateEmployeeIds: string[] = []
    if (employeeId) {
      candidateEmployeeIds = [employeeId]
    } else {
      try {
        const emps = await prisma.employees.findMany({
          where: {
            business_id: businessId,
            is_active: true,
            employee_services: { some: { service_id: serviceId! } },
          },
          select: { id: true },
        })
        candidateEmployeeIds = emps.map(e => String(e.id))
      } catch {}
    }

    // Working hours per employee
    const empWh = candidateEmployeeIds.length
      ? await prisma.working_hours.findMany({
          where: { business_id: businessId, employee_id: { in: candidateEmployeeIds } },
          select: { employee_id: true, weekday: true, start_time: true, end_time: true },
        })
      : []

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
      const daySlotsSet = new Set<string>();

      // Vérifie si un employé est disponible pour un créneau donné
      async function isEmployeeFree(eid: string, startDt: Date, endDt: Date) {
        // Vérifie les réservations existantes qui se chevauchent
        const conflict = await prisma.reservations.findFirst({
          where: {
            employee_id: eid,
            status: { in: ["PENDING", "CONFIRMED"] as any },
            // Vérifie les chevauchements
            OR: [
              // La réservation commence pendant le créneau demandé
              { 
                starts_at: { lt: endDt },
                ends_at: { gt: startDt }
              },
              // La réservation contient le créneau demandé
              {
                starts_at: { lte: startDt },
                ends_at: { gte: endDt }
              }
            ]
          },
          select: { id: true, status: true }
        });
        
        // Si un conflit est trouvé, le créneau n'est pas disponible
        return !conflict;
      }

      // Build candidate slots
      if (candidateEmployeeIds.length === 0) {
        // No specific employee constraint: use business hours baseline, but still require at least one qualified employee free
        const entries = businessWh.filter(x => x.weekday === weekday);
        for (const e of entries) {
          const startW = applyTimeLocal(day, e.start_time as any as Date);
          const endW = applyTimeLocal(day, e.end_time as any as Date);
          for (let t = new Date(startW); t.getTime() + duration*60000 <= endW.getTime(); t = new Date(t.getTime() + slotStep*60000)) {
            if (t.getTime() < now.getTime() + leadMs) continue;
            const slotEnd = new Date(t.getTime() + duration*60000)
            // check any employee with working hours covering this time window
            let anyFree = false
            for (const eid of candidateEmployeeIds) {
              const hours = empWh.filter(w => w.employee_id === eid && w.weekday === weekday)
              const ranges = hours.length ? hours : businessWh.filter(x => x.weekday === weekday)
              // within any range
              const covered = ranges.some(r => {
                const rs = applyTimeLocal(day, r.start_time as any as Date)
                const re = applyTimeLocal(day, r.end_time as any as Date)
                return t.getTime() >= rs.getTime() && slotEnd.getTime() <= re.getTime()
              })
              if (!covered) continue
              if (await isEmployeeFree(eid, t, slotEnd)) { anyFree = true; break }
            }
            if (anyFree) daySlotsSet.add(`${pad(t.getHours())}:${pad(t.getMinutes())}`)
          }
        }
      } else {
        // Specific employees (either provided or qualified list): union of free slots across employees
        for (const eid of candidateEmployeeIds) {
          const ranges = (empWh.filter(w => w.employee_id === eid && w.weekday === weekday).length
            ? empWh.filter(w => w.employee_id === eid && w.weekday === weekday)
            : businessWh.filter(x => x.weekday === weekday))
          for (const r of ranges) {
            const rs = applyTimeLocal(day, r.start_time as any as Date)
            const re = applyTimeLocal(day, r.end_time as any as Date)
            for (let t = new Date(rs); t.getTime() + duration*60000 <= re.getTime(); t = new Date(t.getTime() + slotStep*60000)) {
              if (t.getTime() < now.getTime() + leadMs) continue;
              const slotEnd = new Date(t.getTime() + duration*60000)
              if (await isEmployeeFree(eid, t, slotEnd)) {
                daySlotsSet.add(`${pad(t.getHours())}:${pad(t.getMinutes())}`)
              }
            }
          }
        }
      }

      const daySlots = Array.from(daySlotsSet).sort().map(time => ({ time }))
      result.push({ date: ymd(day), slots: daySlots })
    }

    return NextResponse.json({ days: result });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
