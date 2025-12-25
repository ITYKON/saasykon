export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Récupération des paramètres de requête
    const { searchParams } = new URL(req.url);
    const location = (searchParams.get("location") || "").trim();
    const query = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10));
    
    // Configuration de la pagination
    const skip = (page - 1) * pageSize;
    
    // Vérification du terme de recherche
    // if (!query && !location) {
    //   return NextResponse.json(
    //     { 
    //       error: "Veuillez spécifier un nom d'institut ou une localisation",
    //       code: "MISSING_SEARCH_QUERY"
    //     },
    //     { status: 400 }
    //   );
    // }
    
    // Construction de la requête de base
    const where: any = {
      archived_at: null,
      deleted_at: null,
    };
    
    // Filtre par localisation
    if (location) {
        where.business_locations = {
            some: {
                OR: [
                    { cities: { name: { contains: location, mode: 'insensitive' as const } } },
                    { address_line1: { contains: location, mode: 'insensitive' as const } },
                    { postal_code: { contains: location, mode: 'insensitive' as const } }
                ]
            }
        };
    }

    if (query) {
        const searchTerms = query.split(/\s+/).filter(term => term.length > 2);
        const useStartsWith = query.length < 4;
        
        // Liste de mots-clés génériques qui ne doivent pas filtrer les résultats s'ils sont seuls
        // car la plateforme ne contient QUE ce type d'établissement pour le moment.
        const GENERIC_TERMS = ['institut', 'beauté', 'beaute', 'salon', 'centre'];
        
        // Vérifie si TOUS les termes de recherche sont génériques
        const isGenericQuery = searchTerms.every(term => 
            GENERIC_TERMS.some(generic => term.toLowerCase().includes(generic))
        );

        // Si la requête n'est PAS générique (ex: contient "Modjo"), on applique le filtre textuel
        // Si elle EST générique (ex: "Institut de beauté"), on N'applique PAS le filtre (on affiche tout)
        if (!isGenericQuery) {
            // Conditions de recherche par nom
            const nameConditions: any[] = [
            { public_name: { equals: query, mode: 'insensitive' as const } },
            { legal_name: { equals: query, mode: 'insensitive' as const } },
            // Recherche dans les services
            { services: { some: { name: { contains: query, mode: 'insensitive' as const } } } },
            // Recherche par catégorie
            { category_code: { contains: query, mode: 'insensitive' as const } }
            ];

            if (useStartsWith) {
                nameConditions.push(
                    { public_name: { startsWith: query, mode: 'insensitive' as const } },
                    { legal_name: { startsWith: query, mode: 'insensitive' as const } }
                );
            } else {
                nameConditions.push(
                    { public_name: { contains: query, mode: 'insensitive' as const } },
                    { legal_name: { contains: query, mode: 'insensitive' as const } }
                );
            }
            
            // Si plusieurs termes de recherche, ajouter une recherche par mots-clés "AND" (doit contenir TOUS les termes)
            if (searchTerms.length > 1) {
            nameConditions.push(
                // Le nom doit contenir TOUS les termes (ex: "Institut" ET "Rose")
                { 
                    AND: searchTerms.map(term => ({ 
                        public_name: { contains: term, mode: 'insensitive' as const } 
                    })) 
                },
                { 
                    AND: searchTerms.map(term => ({ 
                        legal_name: { contains: term, mode: 'insensitive' as const } 
                    })) 
                },
                // Recherche concaténée classique (garde-fou)
                { public_name: { contains: searchTerms.join(' '), mode: 'insensitive' as const } },
                { legal_name: { contains: searchTerms.join(' '), mode: 'insensitive' as const } }
            );
            }
            
            where.OR = nameConditions;
        }
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
            take: 5
          },
          services: {
             where: { is_active: true },
             take: 5,
             include: {
               service_variants: {
                 where: { is_active: true },
                 take: 1
               }
             }
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
      
      const mappedServices = business.services.map(s => {
          const variant = s.service_variants[0];
          return {
            id: s.id, 
            name: s.name, 
            price_cents: variant?.price_cents || 0, 
            duration_minutes: variant?.duration_minutes || 0 
          };
      });

      return {
        id: business.id,
        name: business.public_name || business.legal_name || 'Sans nom',
        description: business.description,
        category: business.category_code,
        cover_url: primaryImage,
        media: business.business_media.map(m => ({ url: m.url, type: m.type, position: m.position })),
        services: mappedServices,
        rating: Number(business.ratings_aggregates?.rating_avg || 0),
        reviewCount: business.ratings_aggregates?.rating_count || 0,
        claim_status: business.claim_status,
        location: primaryLocation ? {
            address: `${primaryLocation.address_line1} ${primaryLocation.address_line2 || ''}`.trim(),
            city: primaryLocation.cities?.name,
            postalCode: primaryLocation.postal_code,
            latitude: Number(primaryLocation.latitude),
            longitude: Number(primaryLocation.longitude),
        } : null,
        city: primaryLocation?.cities?.name || '',
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
