export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Récupération des paramètres de requête
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const locationQuery = (searchParams.get("location") || "").trim(); // Ajout paramètre location
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10));
    const skip = (page - 1) * pageSize;
    
    // Si pas de query ni de location, on peut renvoyer une erreur ou des résultats par défaut
    // Ici on permet si au moins l'un des deux est présent
    if (!query && !locationQuery) {
       return NextResponse.json(
        { 
          error: "Veuillez spécifier une recherche ou une localisation",
          code: "MISSING_PARAMS"
        },
        { status: 400 }
      );
    }
    
    // Construction de la requête de base
    const where: any = {
      archived_at: null,
      deleted_at: null,
    };
    
    // --- 1. Filtre par TEXTE (Nom d'entreprise OU Nom de service) ---
    if (query) {
      const searchTerms = query.split(/\s+/).filter(term => term.length > 2);
      const useStartsWith = query.length < 4;
      
      const textConditions = [
        // Recherche sur le nom de l'entreprise
        { public_name: { equals: query, mode: 'insensitive' as const } },
        { legal_name: { equals: query, mode: 'insensitive' as const } },
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
        // Recherche sur les services (Intelligent Search)
        {
          services: {
            some: {
              name: { contains: query, mode: 'insensitive' as const },
              // deleted_at: null, // FIX: deleted_at n'existe peut-être pas sur services
              is_active: true
            }
          }
        }
      ];
      
      where.OR = textConditions;
    }

    // --- 2. Filtre par LOCALISATION (Ville) ---
    if (locationQuery) {
      where.business_locations = {
        some: {
          OR: [
             { cities: { name: { contains: locationQuery, mode: 'insensitive' as const } } },
             { address_line1: { contains: locationQuery, mode: 'insensitive' as const } },
             { postal_code: { contains: locationQuery, mode: 'insensitive' as const } },
          ]
        }
      };
    }

    // Configuration du tri
    const orderBy = [
      { ratings_aggregates: { rating_avg: 'desc' as const } },
      { created_at: 'desc' as const }
    ];
    
    // Exécution de la requête Prisma
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
          // AJOUT: Inclure les services pour l'affichage
          services: {
            where: { is_active: true },
            take: 5, // On prend les 5 premiers pour l'aperçu
            select: { 
              id: true, 
              name: true, 
              service_variants: {
                where: { is_active: true },
                take: 1,
                select: {
                  price_cents: true,
                  duration_minutes: true
                }
              }
            }
          },
          employees: {
            where: { is_active: true },
            select: { id: true, full_name: true }
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
    const formattedResults = businesses.map((business: any) => { // FIX: cast as any because of complex include inference
      const primaryLocation = business.business_locations.find((loc: any) => loc.is_primary) || business.business_locations[0];
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
        // Mapping des services
        services: business.services.map((s: any) => {
          const variant = s.service_variants?.[0];
          return {
            id: s.id,
            name: s.name,
            price_cents: variant?.price_cents,
            duration_minutes: variant?.duration_minutes
          };
        }),
        isPremium: business.subscriptions.some((sub: any) => sub.plans.code === 'premium'),
        isNew: new Date(business.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Moins de 30 jours
        isTop: Number(business.ratings_aggregates?.rating_avg || 0) >= 4.5,
        slug: business.slug,
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
