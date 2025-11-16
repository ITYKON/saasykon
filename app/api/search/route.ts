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
    
    // Construction de la requête de base
    const where: any = {
      archived_at: null,
      deleted_at: null,
    };
    
    // Recherche par nom d'institut uniquement (public_name ou legal_name)
    if (query) {
      const searchTerms = query.split(/\s+/).filter(term => term.length > 2);
      const useStartsWith = query.length < 4;
      
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
        ),
        // Si plusieurs termes de recherche, ajouter une recherche par mots-clés
        ...(searchTerms.length > 1 
          ? [
              { public_name: { search: searchTerms.join(' & '), mode: 'insensitive' as const } },
              { legal_name: { search: searchTerms.join(' & '), mode: 'insensitive' as const } }
            ]
          : []
        )
      ];
      
      where.OR = nameConditions;
    } else {
      // Aucun terme de recherche fourni
      return NextResponse.json(
        { 
          error: "Veuillez spécifier un nom d'institut pour effectuer une recherche",
          code: "MISSING_SEARCH_QUERY"
        },
        { status: 400 }
      );
    }
    
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
          services: {
            where: { is_active: true },
            include: {
              service_variants: {
                where: { is_active: true },
                take: 1
              }
            },
            take: 5
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
            where: { status: 'ACTIVE' },
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
      const rating_avg = business.ratings_aggregates?.rating_avg 
        ? Number(business.ratings_aggregates.rating_avg) 
        : 0;
      const rating_count = business.ratings_aggregates?.rating_count ?? 0;
      const subscription = business.subscriptions?.[0];

      return {
        id: business.id,
        name: business.public_name,
        description: business.description,
        category: business.category_code,
        logo_url: business.logo_url,
        cover_url: business.cover_url,
        rating: rating_avg,
        reviewCount: rating_count,
        location: primaryLocation ? {
          address: primaryLocation.address_line1,
          city: primaryLocation.cities?.name,
          postalCode: primaryLocation.postal_code,
          latitude: primaryLocation.latitude,
          longitude: primaryLocation.longitude,
        } : null,
        media: business.business_media.map(m => ({
          url: m.url,
          type: m.type,
          position: m.position
        })),
        services: business.services.map(s => {
          const variant = s.service_variants?.[0];
          return {
            id: s.id,
            name: s.name,
            price_cents: variant?.price_cents || variant?.price_min_cents || null,
            duration_minutes: variant?.duration_minutes || null
          };
        }),
        employeesCount: business.employees.length,
        isPremium: subscription?.plans?.code === "premium",
        isNew: (new Date().getTime() - new Date(business.created_at).getTime()) < 1000 * 60 * 60 * 24 * 30,
        isTop: rating_avg >= 4.5,
      };
    });

      // Construction de la réponse
      const responseData = {
        businesses: formattedResults,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
      
      console.log(`Recherche terminée: ${formattedResults.length} résultats sur ${total}`);
      
      return NextResponse.json(responseData);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des résultats de recherche",
        details: error instanceof Error ? error.message : String(error),
        code: "SEARCH_EXECUTION_ERROR"
      },
      { status: 500 }
    );
  }
}
