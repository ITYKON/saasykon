import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function toDate(value: string) { const d = new Date(value); if (isNaN(d.getTime())) throw new Error("Invalid date"); return d; }

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const {
    business_id,
    client_id,
    employee_id,
    starts_at,
    items,
    notes,
    location_id,
  } = body || {};

  const bizId = business_id || ctx.assignments[0]?.business_id;
  if (!bizId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === bizId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items required" }, { status: 400 });
  const start = typeof starts_at === 'string' ? toDate(starts_at) : new Date(starts_at);

  // Compute end time from items durations
  const durations: number[] = items.map((i: any) => Number(i.duration_minutes || 0));
  const totalMinutes = durations.reduce((s, x) => s + (isFinite(x) ? x : 0), 0);
  const ends = new Date(start.getTime() + totalMinutes * 60000);

  // Create reservation + items in a transaction
  const created = await prisma.$transaction(async (tx) => {
    let finalClientId = client_id;

    // Handle new client creation if provided
    if (!finalClientId && body.new_client) {
      const { first_name, last_name, phone, email } = body.new_client;
      if (first_name || last_name) {
        let userIdForClient = null;

        // If email provided, find or create user to link
        if (email) {
            const existingUser = await tx.users.findUnique({ where: { email } });
            if (existingUser) {
                userIdForClient = existingUser.id;
            } else {
                // Create shadow user for this email
                // We don't set a password, they can claim it later?
                const newUser = await tx.users.create({
                    data: {
                        email,
                        first_name: first_name || "",
                        last_name: last_name || "",
                        phone: phone || null,
                        is_email_verified: false, // Pending verification
                    }
                });
                userIdForClient = newUser.id;
            }
        }

        const newClient = await tx.clients.create({
          data: {
            user_id: userIdForClient,
            first_name: first_name || "",
            last_name: last_name || "",
            phone: phone || null,
            status: "NOUVEAU",
          }
        });
        finalClientId = newClient.id;

        // Optionally link to business favorites
        await tx.client_favorites.create({
          data: {
            business_id: bizId,
            client_id: newClient.id
          }
        });
      }
    }

    const reservation = await tx.reservations.create({
      data: {
        business_id: bizId,
        client_id: finalClientId || null,
        employee_id: employee_id || null,
        location_id: location_id || null,
        booker_user_id: ctx.userId,
        starts_at: start,
        ends_at: ends,
        status: 'PENDING' as any,
        notes: notes || null,
      },
    });

    // For each item, we require service_id, price_cents, duration_minutes
    for (const it of items) {
      await tx.reservation_items.create({
        data: {
          reservation_id: reservation.id,
          service_id: it.service_id,
          variant_id: it.variant_id || null,
          employee_id: it.employee_id || employee_id || null,
          price_cents: Number(it.price_cents || 0),
          currency: it.currency || 'EUR',
          duration_minutes: Number(it.duration_minutes || 0),
        },
      });
    }

    return reservation;
  });

  return NextResponse.json({ reservation_id: created.id });
}
