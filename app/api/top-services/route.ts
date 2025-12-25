import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Récupérer les noms de services les plus fréquents
    // On groupe par nom et on compte
    const topServices = await prisma.services.groupBy({
      by: ['name'],
      where: {
        is_active: true,
        // Optionnel: filtrer les services archivés ou supprimés si nécessaire
      },
      _count: {
        name: true
      },
      orderBy: {
        _count: {
          name: 'desc'
        }
      },
      take: 20
    });

    // Formater la réponse pour ne renvoyer que les noms
    const services = topServices.map(s => s.name);

    return NextResponse.json({ services });
  } catch (error) {
    console.error("[GET /api/top-services] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des services" },
      { status: 500 }
    );
  }
}
