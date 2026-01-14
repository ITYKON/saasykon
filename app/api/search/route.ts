export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

interface BusinessLocation {
  is_primary: boolean;
  address_line1: string;
  postal_code: string | null;
  cities: { name: string } | null;
  latitude: number | null;
  longitude: number | null;
}

interface BusinessMedia {
  url: string;
  type: string | null;
  position: number | null;
}

interface ServiceVariant {
  price_cents?: number;
  price_min_cents?: number;
  duration_minutes: number | null;
}

interface Service {
  id: string;
  name: string;
  service_variants: ServiceVariant[];
}

interface Subscription {
  plans: {
    code: string;
  };
}

interface Business {
  id: string;
  public_name: string;
  description: string | null;
  category_code: string | null;
  logo_url: string | null;
  cover_url: string | null;
  created_at: Date;
  business_locations: BusinessLocation[];
  business_media: BusinessMedia[];
  services: Service[];
  employees: { id: string; full_name: string }[];
  ratings_aggregates?: {
    rating_avg?: number | null;
    rating_count?: number | null;
  };
  subscriptions: Subscription[];
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Rate limiting: 30 requests per minute per IP
    const clientIp = getClientIp(req);
    const rateLimitKey = `search:${clientIp}`;
    const rateLimitResult = rateLimit(rateLimitKey, 30, 60 * 1000); // 1 minute
    
    if (!rateLimitResult.ok) {
      const retryAfterSeconds = Math.ceil(rateLimitResult.retryAfterMs! / 1000);
      return NextResponse.json(
        { error: "Trop de requêtes de recherche. Veuillez réessayer plus tard." },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString()
          }
        }
      );
    }
    
    // Récupération des paramètres de requête
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const location = searchParams.get("location");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10));

    // Configuration de la pagination
    const skip = (page - 1) * pageSize;

    // Construction de la requête de base
    const where: any = {
      archived_at: null,
      deleted_at: null,
    };

    let orderBy: any[] = [
      { ratings_aggregates: { rating_avg: 'desc' as const } },
      { created_at: 'desc' as const }
    ];

    // Configuration des relations à inclure
    const include: any = {
      business_locations: {
        include: {
          cities: true,
          countries: true
        }
      },
      business_media: {
        orderBy: { position: 'asc' as const },
        take: 5
      },
      services: {
        where: { is_active: true },
        include: {
          service_variants: {
            where: { is_active: true },
            take: 1
          }
        },
        take: 10
      },
      employees: {
        where: { is_active: true },
        select: {
          id: true,
          full_name: true
        },
        take: 5
      },
      ratings_aggregates: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plans: true },
        take: 1
      }
    };

    // Gestion de la recherche par localisation
    if (location) {
      where.business_locations = {
        some: { 
          OR: [
            { cities: { name: { contains: location, mode: 'insensitive' } } },
            { address_line1: { contains: location, mode: 'insensitive' } },
            { address_line2: { contains: location, mode: 'insensitive' } },
            { postal_code: { contains: location } }
          ]
        }
      };
    }

    // Gestion de la recherche par nom
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
      
      // Tri par pertinence pour la recherche par nom
      orderBy = [
        // Les correspondances exactes en premier
        { public_name: 'asc' as const },
        // Puis les autres critères de tri
        ...orderBy
      ];
    } else if (!location) {
      // Aucun terme de recherche fourni et pas de localisation
      return NextResponse.json(
        { 
          error: "Veuillez spécifier un terme de recherche ou une localisation",
          code: "MISSING_SEARCH_CRITERIA"
        },
        { status: 400 }
      );
    }
    
    // Exécution de la requête principale
    
    const [businesses, total] = await Promise.all([
      prisma.businesses.findMany({
        where,
        include,
        orderBy,
        skip,
        take: pageSize,
      }) as unknown as Business[],
      prisma.businesses.count({ where })
    ]);
    
    // Formatage des résultats pour le frontend
    const formattedResults = businesses.map((business) => {
      const primaryLocation = business.business_locations.find((loc: BusinessLocation) => loc.is_primary) || business.business_locations[0];
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
        primary_location: primaryLocation,
        primary_image: primaryImage,
        location: primaryLocation ? {
          address: primaryLocation.address_line1,
          city: primaryLocation.cities?.name,
          postalCode: primaryLocation.postal_code,
          latitude: primaryLocation.latitude,
          longitude: primaryLocation.longitude,
        } : null,
        media: business.business_media.map((m: BusinessMedia) => ({
          url: m.url,
          type: m.type,
          position: m.position
        })),
        services: business.services.map((s: Service) => {
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
