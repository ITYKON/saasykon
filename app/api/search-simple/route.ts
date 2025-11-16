import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Récupération des paramètres de requête
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10));
    
    // Configuration de la pagination
    const skip = (page - 1) * pageSize;
    
    // Vérification du terme de recherche
    if (!query) {
      return NextResponse.json(
        { 
          error: "Veuillez spécifier un nom d'institut pour effectuer une recherche",
          code: "MISSING_SEARCH_QUERY"
        },
        { status: 400 }
      );
    }
    
    // Construction de la requête de base
    const where: any = {
      archived_at: null,
      deleted_at: null,
    };
    
    // Préparation des termes de recherche
    const searchTerms = query.split(/\s+/).filter(term => term.length > 2);
    const useStartsWith = query.length < 4;
    
    // Conditions de recherche par nom
    const nameConditions = [
      // Recherche exacte
      { public_name: { equals: query, mode: 'insensitive' as const } },
      { legal_name: { equals: query, mode: 'insensitive' as const } },
      // Recherche par préfixe ou contient selon la longueur
      ...(useStartsWith 
        ? [
            { public_name: { startsWith: query, mode: 'insensitive' as const } },
            { legal_name: { startsWith: query, mode: 'insensitive' as const } },
          ]
        : [
            { public_name: { contains: query, mode: 'insensitive' as const } },
            { legal_name: { contains: query, mode: 'insensitive' as const } },
          ]
      )
    ];
    
    // Si plusieurs termes de recherche, ajouter une recherche par mots-clés
    if (searchTerms.length > 1) {
      nameConditions.push(
        { public_name: { contains: searchTerms.join(' '), mode: 'insensitive' as const } },
        { legal_name: { contains: searchTerms.join(' '), mode: 'insensitive' as const } }
      );
    }
    
    where.OR = nameConditions;
    
    // Configuration du tri
    const orderBy = [
      { ratings_aggregates: { rating_avg: 'desc' as const } },
      { created_at: 'desc' as const }
    ];
    
    console.log('Requête Prisma:', JSON.stringify({ where, orderBy, skip, take: pageSize }, null, 2));
    
    // Exécution de la requête principale
    console.log('Exécution de la requête Prisma...');
    
    const [businesses, total] = await Promise.all([
      prisma.businesses.findMany({
        where,
        include: {
          business_locations: {
            include: {
              cities: true,
              countries: true
            }
          },
          business_media: {
            orderBy: { position: 'asc' as const },
            take: 1
          },
          employees: {
            where: { is_active: true },
            select: {
              id: true,
              full_name: true
            }
          },
          ratings_aggregates: true,
          subscriptions: {
            where: { status: 'ACTIVE' as const },
            include: { plans: true },
            take: 1
          }
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.businesses.count({ where })
    ]);
    
    // Formatage des résultats pour le frontend
    const formattedResults = businesses.map(business => {
      const primaryLocation = business.business_locations.find(loc => loc.is_primary) || business.business_locations[0];
      const primaryImage = business.business_media[0]?.url || null;
      
      return {
        id: business.id,
        name: business.public_name || business.legal_name || 'Sans nom',
        description: business.description,
        category: business.category_code,
        image: primaryImage,
        rating: business.ratings_aggregates?.rating_avg || 0,
        reviewCount: business.ratings_aggregates?.rating_count || 0,
        claim_status: business.claim_status,
        address: primaryLocation ? `${primaryLocation.address_line1} ${primaryLocation.address_line2 || ''}`.trim() : '',
        city: primaryLocation?.cities?.name || '',
        postalCode: primaryLocation?.postal_code || '',
        employeesCount: business.employees.length,
        isPremium: business.subscriptions.some(sub => sub.plans.code === 'premium'),
        isNew: new Date(business.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Moins de 30 jours
        isTop: Number(business.ratings_aggregates?.rating_avg || 0) >= 4.5
      };
    });
    
    // Réponse finale
    return NextResponse.json({
      businesses: formattedResults,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
    
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors de la recherche",
        details: error instanceof Error ? error.message : String(error),
        code: "SEARCH_ERROR"
      },
      { status: 500 }
    );
  }
}
