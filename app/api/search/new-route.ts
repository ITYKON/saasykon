import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// @ts-ignore - Le type Prisma est disponible via l'import de @prisma/client
import type { Prisma, subscription_status } from "@prisma/client";

type BusinessWithRelations = Prisma.businessesGetPayload<{
  include: {
    business_locations: {
      include: {
        cities: true;
        countries: true;
      };
    };
    business_media: true;
    services: {
      include: {
        service_variants: true;
      };
    };
    ratings_aggregates: true;
    subscriptions: {
      include: {
        plans: true;
      };
    };
  };
}>;

// Types pour les conditions de requête
type BusinessWhereInput = Prisma.businessesWhereInput;
type BusinessOrderByWithRelationInput = Prisma.businessesOrderByWithRelationInput;

// Alias pour la compatibilité
type Business = BusinessWithRelations;

// Type pour la réponse de l'API
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
  baseWhere: BusinessWhereInput
): Promise<{ businesses: BusinessWithRelations[]; total: number }> {
  if (!query || query.length < 3) {
    return { businesses: [], total: 0 };
  }

  console.log('Tentative de recherche élargie pour:', query);
  
  const broaderWhere: BusinessWhereInput = {
    ...baseWhere,
    OR: [
      { public_name: { contains: query.substring(0, 3), mode: 'insensitive' } },
      { legal_name: { contains: query.substring(0, 3), mode: 'insensitive' } },
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
        ratings_aggregates: true,
        subscriptions: {
          where: { status: 'ACTIVE' as subscription_status },
          include: { plans: true },
          take: 1
        }
      },
      take: 10,
    }),
    prisma.businesses.count({ where: broaderWhere }),
  ]);
  
  return { businesses, total };
}

// Fonction utilitaire pour formater les résultats de recherche
function formatBusinessForResponse(business: BusinessWithRelations) {
  const rating_avg = business.ratings_aggregates?.rating_avg 
    ? Number(business.ratings_aggregates.rating_avg) 
    : 0;
  const rating_count = business.ratings_aggregates?.rating_count ?? 0;
  
  const primaryLocation = business.business_locations.find((loc: any) => loc.is_primary) || business.business_locations[0];
  
  const subscription = business.subscriptions[0];
  const mainImage = business.business_media[0]?.url || null;
  
  const formattedServices = business.services.flatMap((service: any) => ({
    id: service.id,
    name: service.name,
    price: service.price,
    duration: service.duration
  }));
  
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
    services: formattedServices,
    employeesCount: 0, // À implémenter si nécessaire
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
    const baseWhere: BusinessWhereInput = {
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
      
      const nameOrServiceConditions: any[] = [
        // Recherche exacte
        { public_name: { equals: query, mode: 'insensitive' } },
        { legal_name: { equals: query, mode: 'insensitive' } },
        // Recherche par préfixe ou contient selon la longueur
        ...(useStartsWith 
          ? [
              { public_name: { startsWith: query, mode: 'insensitive' } },
              { legal_name: { startsWith: query, mode: 'insensitive' } },
            ]
          : [
              { public_name: { contains: query, mode: 'insensitive' } },
              { legal_name: { contains: query, mode: 'insensitive' } },
            ]
        ),
        // Recherche par mots-clés si plusieurs termes
        ...(searchTerms.length > 1 ? [
          { public_name: { search: searchTerms.join(' & '), mode: 'insensitive' } },
          { legal_name: { search: searchTerms.join(' & '), mode: 'insensitive' } },
        ] : []),
        // Recherche dans la description
        { description: { contains: query, mode: 'insensitive' } },
        // Recherche dans les services
        {
          services: {
            some: {
              name: { 
                [useStartsWith ? 'startsWith' : 'contains']: query, 
                mode: 'insensitive' 
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
                  { address_line1: { contains: location, mode: 'insensitive' } },
                  { address_line2: { contains: location, mode: 'insensitive' } },
                  { postal_code: { contains: location } },
                  {
                    cities: {
                      name: { contains: location, mode: 'insensitive' }
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
                  name: { contains: location, mode: 'insensitive' }
                }
              }
            }
          }
        ]
      });
    }
    
    // Combinaison des conditions
    const where: BusinessWhereInput = conditions.length > 0 
      ? { ...baseWhere, AND: conditions } 
      : baseWhere;
      
    // Configuration du tri
    const orderBy: BusinessOrderByWithRelationInput[] = [
      { ratings_aggregates: { rating_avg: 'desc' } },
      { created_at: 'desc' }
    ];

    // Exécution de la requête principale
    console.log('Exécution de la requête Prisma...');
    
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
        ratings_aggregates: true,
        subscriptions: {
          where: { status: 'ACTIVE' as subscription_status },
          include: { plans: true },
          take: 1
        }
      },
      orderBy,
      skip,
      take: pageSize,
    };
    
    const [businessesResult, totalResult] = await Promise.all([
      prisma.businesses.findMany(queryOptions),
      prisma.businesses.count({ where }),
    ]);
    
    businesses = businessesResult as unknown as Business[];
    total = totalResult;
    
    // Si aucun résultat et qu'il y a une requête, on essaie une recherche élargie
    if (businesses.length === 0 && query && query.length > 3) {
      console.log('Aucun résultat trouvé, tentative de recherche élargie...');
      
      const broaderSearch = await performBroaderSearch(query, baseWhere);
      
      if (broaderSearch.businesses.length > 0) {
        console.log(`Recherche élargie réussie: ${broaderSearch.businesses.length} résultats trouvés`);
        businesses = broaderSearch.businesses;
        total = broaderSearch.total;
      }
    }
    
    // Formatage des résultats pour le frontend
    const formattedResults = businesses.map(formatBusinessForResponse);
    
    // Construction de la réponse
    const responseData: SearchResponse = {
      businesses: formattedResults,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
    
    console.log(`Recherche terminée: ${formattedResults.length} résultats sur ${total}`);
    
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
