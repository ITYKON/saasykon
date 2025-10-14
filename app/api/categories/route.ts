import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Récupérer toutes les catégories uniques utilisées par les businesses actifs
    const categories = await prisma.businesses.findMany({
      where: {
        archived_at: null,
        deleted_at: null,
        category_code: { not: null }
      },
      select: {
        category_code: true
      },
      distinct: ['category_code']
    });

    // Mapper les codes de catégories vers des noms lisibles
    const categoryMap: Record<string, string> = {
      'coiffeur': 'Coiffeur',
      'barbier': 'Barbier',
      'manucure': 'Manucure & Pédicure',
      'institut': 'Institut de beauté',
      'massage': 'Massage & Bien-être',
      'esthetique': 'Esthétique',
      'spa': 'Spa',
      'tatouage': 'Tatouage & Piercing',
    };

    const formattedCategories = categories
      .filter(c => c.category_code)
      .map(c => ({
        code: c.category_code!,
        name: categoryMap[c.category_code!] || c.category_code!
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error("[GET /api/categories] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des catégories" },
      { status: 500 }
    );
  }
}
