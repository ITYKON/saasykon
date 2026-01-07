
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // On veut récupérer les noms de services les plus fréquents
    // Comme Prisma ne supporte pas encore count distinct sur groupBy facilement avec tri,
    // on va faire une requête brute ou une agrégation simplifiée.
    
    // Approche via groupBy (si supporté correctement par la DB pour le tri)
    // Sinon on récupère les services actifs et on compte en JS (moins performant si bcp de données, mais ok pour MVP)
    
    // Pour l'instant, faisons simple : on prend tous les noms de services distincts
    // Ou mieux, on utilise groupBy
    const topServices = await prisma.services.groupBy({
      by: ['name'],
      _count: {
        name: true
      },
      orderBy: {
        _count: {
          name: 'desc'
        }
      },
      where: {
        is_active: true
      },
      take: 10
    });

    const popularServices = topServices.map(s => s.name);

    const finalServices = popularServices;

    return NextResponse.json(finalServices);
  } catch (error) {
    console.error("Erreur récupération services populaires:", error);
    // Fallback static en cas d'erreur
    return NextResponse.json([
      "Coupe femme", "Coupe homme", "Brushing", "Coloration", "Massage", "Manucure", "Pédicure", "Épilation", "Barbe", "Soin visage"
    ]);
  }
}
