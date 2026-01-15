import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export const availabilitySchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  employee_id: z.string().uuid().nullable().optional(),
});

function getBusinessId(req: NextRequest, ctx: any) {
  const url = new URL(req.url);
  const cookieStore = cookies();
  return (
    url.searchParams.get("business_id") ||
    cookieStore.get("business_id")?.value ||
    ctx?.assignments?.[0]?.business_id ||
    null
  );
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = getBusinessId(req, ctx);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  try {
    const body = await req.json();
    const result = availabilitySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.format() }, { status: 400 });
    }

    const { starts_at, ends_at, employee_id } = result.data;
    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);

    // Vérifier les réservations existantes qui se chevauchent
    const whereClause: any = {
      business_id: businessId,
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        { starts_at: { lt: endDate }, ends_at: { gt: startDate } },
        { starts_at: { lt: endDate }, ends_at: { gt: startDate } },
        { starts_at: { lte: startDate }, ends_at: { gte: endDate } },
        { starts_at: { gte: startDate }, ends_at: { lte: endDate } }
      ]
    };

    if (employee_id) {
      whereClause.employee_id = employee_id;
    }

    const conflict = await prisma.reservations.findFirst({
      where: whereClause,
      select: { 
        id: true, 
        status: true, 
        starts_at: true, 
        ends_at: true,
        clients: { select: { first_name: true, last_name: true } },
        employees: { select: { full_name: true } }
      },
    });

    if (conflict) {
      const clientName = conflict.clients 
        ? `${conflict.clients.first_name || ''} ${conflict.clients.last_name || ''}`.trim() 
        : 'Client inconnu';
      
      const employeeName = conflict.employees?.full_name || 'Employé non spécifié';
      
      return NextResponse.json({
        available: false,
        message: `Le créneau est déjà réservé par ${clientName} (${employeeName})`,
        conflict: {
          id: conflict.id,
          status: conflict.status,
          starts_at: conflict.starts_at,
          ends_at: conflict.ends_at,
          client_name: clientName,
          employee_name: employeeName
        }
      });
    }

    return NextResponse.json({ 
      available: true,
      message: "Le créneau est disponible"
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de disponibilité:", error);
    return NextResponse.json({ available: false, error: "Une erreur est survenue" }, { status: 500 });
  }
}
