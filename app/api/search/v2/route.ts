export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Business = {
  id: string;
  public_name: string | null;
  legal_name: string;
  description: string | null;
  category_code: string | null;
  created_at: Date;
  business_locations: Array<{
    id: string;
    address_line1: string;
    address_line2: string | null;
    postal_code: string;
    city_id: number;
    is_primary: boolean;
    cities: {
      id: number;
      name: string;
      department: string;
    } | null;
    countries: {
      name: string;
      code: string;
    } | null;
  }>;
  business_media: Array<{
    id: string;
    url: string;
    position: number;
  }>;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    is_active: boolean;
    service_variants: Array<{
      id: string;
      price: number;
      duration: number;
      is_active: boolean;
    }>;
  }>;
  employees: Array<{
    id: string;
    full_name: string;
    is_active: boolean;
  }>;
  ratings_aggregates?: {
    rating_avg: number | null;
    rating_count: number;
  };
  subscriptions: Array<{
    id: string;
    status: string;
    plans: {
      code: string;
      name: string;
    };
  }>;
};

interface SearchResponse {
  businesses: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    image: string | null;
    rating: number;
    reviewCount: number;
    address: string;
    city: string;
    postalCode: string;
    services: Array<{
      id: string;
      name: string;
      price: number;
      duration: number;
    }>;
    employeesCount: number;
    isPremium: boolean;
    isNew: boolean;
    isTop: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Fonction pour effectuer une recherche élargie
async function performBroaderSearch(
  query: string, 
  baseWhere: any
): Promise<{ businesses: Business[]; total: number }> {
  if (!query || query.length < 3) {
    return { businesses: [], total: 0 };
  }


  
  const broaderWhere = {
    ...baseWhere,
    OR: [
      { public_name: { contains: query.substring(0, 3), mode: 'insensitive' as const } },
      { legal_name: { contains: query.substring(0, 3), mode: 'insensitive' as const } },
    ],
  };
  
  const [businesses, total] = await Promise.all([
    prisma.businesses.findMany({
      where: broaderWhere,
      include: {
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
          }
        },
        ratings_aggregates: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plans: true },
          take: 1
        }
      },
      take: 10,
    }),
    prisma.businesses.count({ where: broaderWhere }),
  ]);
  
  return { businesses: businesses as unknown as Business[], total };
}

// Fonction utilitaire pour formater les résultats de recherche
function formatBusinessForResponse(business: Business) {
  const rating_avg = business.ratings_aggregates?.rating_avg 
    ? Number(business.ratings_aggregates.rating_avg) 
    : 0;
  const rating_count = business.ratings_aggregates?.rating_count ?? 0;
  
  const primaryLocation = business.business_locations.find(loc => loc.is_primary) 
    || business.business_locations[0];
  
  const subscription = business.subscriptions[0];
  const mainImage = business.business_media[0]?.url || null;
  
  return {
    id: business.id,
    name: business.public_name || business.legal_name || "",
    description: business.description,
    category: business.category_code,
    image: mainImage,
    rating: rating_avg,
    reviewCount: rating_count,
    address: primaryLocation ? 
      [primaryLocation.address_line1, primaryLocation.address_line2]
        .filter(Boolean).join(", ") : "",
    city: primaryLocation?.cities?.name || "",
    postalCode: primaryLocation?.postal_code || "",
    services: business.services.map(s => ({
      id: s.id,
      name: s.name,
      price: s.price,
      duration: s.duration
    })),
    employeesCount: business.employees.length,
    isPremium: subscription?.plans?.code === "premium",
    isNew: (new Date().getTime() - new Date(business.created_at).getTime()) < 1000 * 60 * 60 * 24 * 30,
    isTop: rating_avg >= 4.5,
  };
}

export async function GET(req: Request) {
  try {
    // Récupération des paramètres de requête
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const location = (searchParams.get("location") || "").trim();
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10));
    
    // Configuration de la pagination
    const skip = (page - 1) * pageSize;
    
    // Construction de la requête de base
    const baseWhere: any = {
      archived_at: null,
      deleted_at: null,
    };
    
    // Filtre par catégorie si spécifié
    if (category) {
      baseWhere.category_code = category;
    }
    
    // Construction des conditions de recherche
    const conditions: any[] = [];
    
    // Recherche par nom ou service
    if (query) {
      const searchTerms = query.split(/\s+/).filter(term => term.length > 2);
      const useStartsWith = query.length < 4;
      
      const nameOrServiceConditions = [
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
        // Recherche par mots-clés si plusieurs termes
        ...(searchTerms.length > 1 ? [
          { public_name: { search: searchTerms.join(' & '), mode: 'insensitive' as const } },
          { legal_name: { search: searchTerms.join(' & '), mode: 'insensitive' as const } },
        ] : []),
        // Recherche dans la description
        { description: { contains: query, mode: 'insensitive' as const } },
        // Recherche dans les services
        {
          services: {
            some: {
              name: { 
                [useStartsWith ? 'startsWith' : 'contains']: query, 
                mode: 'insensitive' as const 
              },
              is_active: true
            }
          }
        }
      ];
      
      conditions.push({ OR: nameOrServiceConditions });
    }
    
    // Recherche par localisation
    if (location) {
      conditions.push({
        OR: [
          {
            business_locations: {
              some: {
                OR: [
                  { address_line1: { contains: location, mode: 'insensitive' as const } },
                  { address_line2: { contains: location, mode: 'insensitive' as const } },
                  { postal_code: { contains: location } },
                  {
                    cities: {
                      name: { contains: location, mode: 'insensitive' as const }
                    }
                  }
                ]
              }
            }
          },
          {
            business_locations: {
              some: {
                cities: {
                  name: { contains: location, mode: 'insensitive' as const }
                }
              }
            }
          }
        ]
      });
    }
    
    // Combinaison des conditions
    const where = conditions.length > 0 
      ? { ...baseWhere, AND: conditions } 
      : baseWhere;
      
    // Configuration du tri
    const orderBy = [
      { ratings_aggregates: { rating_avg: 'desc' as const } },
      { created_at: 'desc' as const }
    ];

    // Exécution de la requête principale
    // Exécution de la requête principale
    
    let businesses: Business[] = [];
    let total = 0;
    
    // Construction de la requête principale
    const [businessesResult, totalResult] = await Promise.all([
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
      prisma.businesses.count({ where }),
    ]);
    
    businesses = businessesResult as unknown as Business[];
    total = totalResult;
    
    // Si aucun résultat et qu'il y a une requête, on essaie une recherche élargie
    if (businesses.length === 0 && query && query.length > 3) {
      
      const broaderSearch = await performBroaderSearch(query, baseWhere);
      
      if (broaderSearch.businesses.length > 0) {
        businesses = broaderSearch.businesses;
        total = broaderSearch.total;
      }
    }
    
    // Formatage des résultats pour le frontend
    const formattedResults = businesses.map(formatBusinessForResponse);
    const totalPages = Math.ceil(total / pageSize);
    
    // Construction de la réponse
    const responseData: SearchResponse = {
      businesses: formattedResults,
      total,
      page,
      pageSize,
      totalPages
    };
    

    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la recherche",
        details: error instanceof Error ? error.message : String(error),
        code: "SEARCH_ERROR"
      },
      { status: 500 }
    );
  }
}
