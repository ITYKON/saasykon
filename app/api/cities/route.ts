import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Récupérer toutes les villes d'Algérie (code pays DZ)
    const cities = await prisma.cities.findMany({
      where: {
        country_code: "DZ",
        wilaya_number: { not: null } // On ne prend que les wilayas
      },
      orderBy: { wilaya_number: 'asc' },
      select: {
        id: true,
        name: true,
        wilaya_number: true
      }
    });

    return NextResponse.json({ success: true, data: cities });
  } catch (error) {
    console.error("Erreur lors de la récupération des villes:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
