import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Types pour les résultats de recherche

interface BusinessLocation {
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
}

interface BusinessMedia {
  id: string;
  url: string;
  position: number;
}

interface ServiceVariant {
  id: string;
  price: number;
  duration: number;
  duration_minutes: number | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  service_variants: ServiceVariant[];
}

interface Employee {
  id: string;
  full_name: string;
}

interface Subscription {
  id: string;
  plans: {
    code: string;
    name: string;
  };
}

interface BusinessRatings {
  rating_avg: number | null;
  rating_count: number;
}

interface Business {
  id: string;
  public_name: string;
  legal_name: string;
  description: string | null;
  category_code: string | null;
  created_at: Date;
  business_locations: BusinessLocation[];
  business_media: BusinessMedia[];
  services: Service[];
  employees: Employee[];
  ratings_aggregates?: BusinessRatings;
  subscriptions: Subscription[];
}

interface SearchResult {
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
}

// Types pour les résultats de recherche
// Interface pour la réponse de recherche
type BusinessSearchResult = {
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
}

// Fonction pour effectuer une recherche élargie
async function performBroaderSearch(
  query: string, 
  baseWhere: any
): Promise<{ businesses: Business[]; total: number }> {
  if (!query || query.length < 3) {
    return { businesses: [], total: 0 };
  }

  console.log('Tentative de recherche élargie pour:', query);
  
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
function formatBusinessForResponse(business: Business): BusinessSearchResult {
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

export async function GET(req: Request): Promise<NextResponse> {
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
    const baseWhere = {
      archived_at: null,
      deleted_at: null,
    };
    
    // Filtre par catégorie si spécifié
    if (category) {
      baseWhere.category_code = category;
    }
    
    // Construction des conditions de recherche
    const conditions = [];
    
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
      if (query && location) {
        // Recherche par nom ET localisation
        console.log('Recherche par nom ET localisation');
        where.AND = [
          { 
            OR: nameOrServiceConditions,
          },
          { 
            business_locations: {
              some: { 
                OR: locationConditions,
              }
            }
          }
        ];
      } else if (query) {
        // Recherche par nom uniquement
        console.log('Recherche par nom uniquement', { nameOrServiceConditions });
        where.OR = nameOrServiceConditions;
        
        // Tri par pertinence pour la recherche par nom
        orderBy = [
          // Les correspondances exactes en premier
          { public_name: 'asc' },
          // Puis les correspondances par préfixe
          ...(orderBy || [])
        ];
      } else if (location) {
        // Recherche par localisation uniquement
        console.log('Recherche par localisation uniquement', { locationConditions });
        where.business_locations = {
          some: { 
            OR: locationConditions,
          }
        };
      } else if (!category) {
        // Aucun critère de recherche valide
        return NextResponse.json(
          { 
            error: "Veuillez spécifier un nom d'institut, une localisation ou une catégorie pour effectuer une recherche",
            code: "MISSING_SEARCH_CRITERIA"
          },
          { status: 400 }
        );
      }
      
      console.log('Requête Prisma finale:', JSON.stringify({ where, orderBy }, null, 2));
    } catch (error) {
      console.error('Erreur lors de la construction de la requête:', error);
      return NextResponse.json(
        { 
          error: "Erreur lors de la construction de la requête de recherche",
          details: error instanceof Error ? error.message : String(error),
          code: "QUERY_BUILD_ERROR"
        },
        { status: 500 }
      );
    }

    // Exécution de la requête principale
    console.log('Exécution de la requête Prisma...');
    
    try {
      let businesses: Business[] = [];
      let total = 0;
      
      // Construction de la requête principale
      const queryOptions = {
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
            where: { status: 'ACTIVE' as const },
            include: { plans: true },
            take: 1
          }
        },
        orderBy,
        skip,
        take,
      };
      
      const [businessesResult, totalResult] = await Promise.all([
        prisma.businesses.findMany(queryOptions),
          where,
          include: {
            business_locations: {
              include: {
                cities: true,
                countries: true
              countries: true
            }
          },
          business_media: {
            orderBy: { position: "asc" },
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
            where: {
              status: "ACTIVE"
            },
            include: {
              plans: true
            },
            take: 1
          }
        },
        orderBy: orderBy || [
          { ratings_aggregates: { rating_avg: "desc" } },
          { created_at: "desc" }
        ],
        skip: 0,
        }
      }
    ];
  } else if (query) {
    // Recherche par nom uniquement
    console.log('Recherche par nom uniquement', { nameOrServiceConditions });
    where.OR = nameOrServiceConditions;
    
    // Tri par pertinence pour la recherche par nom
    orderBy = [
      // Les correspondances exactes en premier
      { public_name: 'asc' },
      // Puis les correspondances par préfixe
      ...(orderBy || [])
    ];
  } else if (location) {
    // Recherche par localisation uniquement
    console.log('Recherche par localisation uniquement', { locationConditions });
    where.business_locations = {
      some: { 
        OR: locationConditions,
                  }
                },
                business_media: {
                  orderBy: { position: "asc" },
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
                  where: {
                    status: "ACTIVE"
                  },
                  include: {
                    plans: true
                  },
                  take: 1
                }
              },
              orderBy: [
                { public_name: 'asc' },
                { ratings_aggregates: { rating_avg: "desc" } },
                { created_at: "desc" }
              ],
              skip: 0,
              take: 10,
            }),
            prisma.businesses.count({ where }),
          ]);
          
          console.log('Résultats de la recherche élargie:', { count: broaderResults.length });
          
          // On utilise les résultats élargis s'il y en a
          if (broaderResults.length > 0) {
            businesses = broaderResults;
            total = broaderTotal;
          }
        }
      }
      
      // Enrichissement des données pour le frontend
      const enrichedBusinesses = businesses.map(business => {
      const rating_avg = business.ratings_aggregates?.rating_avg 
        ? Number(business.ratings_aggregates.rating_avg) 
        : 0;
      const rating_count = business.ratings_aggregates?.rating_count ?? 0;
      const primaryLocation = business.business_locations.find(loc => loc.is_primary) 
        || business.business_locations[0];
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
        pageSize: take,
        totalPages: Math.ceil(total / take)
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
}
