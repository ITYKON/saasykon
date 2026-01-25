export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Récupération des paramètres de requête
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const locationQuery = (searchParams.get("location") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10));
    const skip = (page - 1) * pageSize;
    
    // Paramètres de bounding box pour la recherche par carte
    const north = searchParams.get("n");
    const south = searchParams.get("s");
    const east = searchParams.get("e");
    const west = searchParams.get("w");
    
    const hasBounds = north && south && east && west;
    
    // Si pas de query ni de location ni de bounds, on renvoie une erreur ou des résultats par défaut
    if (!query && !locationQuery && !hasBounds) {
       return NextResponse.json(
        { 
          error: "Veuillez spécifier une recherche, une localisation ou des coordonnées",
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

    // --- 2. Filtre par LOCALISATION (Ville) et/ou CARTE (Bounds) ---
    const locationConditions: any[] = [];

    // B. Filtre géographique (Bounds)
    if (hasBounds) {
        // Si on a des bounds, on ignore le filtre texte de localisation car l'utilisateur 
        // est en train de naviguer manuellement sur la carte.
        locationConditions.push({
            latitude: { lte: parseFloat(north!), gte: parseFloat(south!) },
            longitude: { lte: parseFloat(east!), gte: parseFloat(west!) }
        });
    } else if (locationQuery) {
        // A. Filtre texte (Ville, adresse, etc.) - Uniquement si pas de bounds
        const parts = locationQuery.split(',').map(p => p.trim());
        
        if (parts.length >= 2) {
            // Format "Commune, Wilaya"
            const [commune, wilaya] = parts;
            
            locationConditions.push({
                OR: [
                    {
                        AND: [
                            { cities: { name: { contains: wilaya, mode: 'insensitive' as const } } },
                            { 
                                OR: [
                                    { address_line1: { contains: commune, mode: 'insensitive' as const } },
                                    { address_line2: { contains: commune, mode: 'insensitive' as const } }
                                ]
                            }
                        ]
                    },
                    { cities: { name: { contains: locationQuery, mode: 'insensitive' as const } } },
                    { address_line1: { contains: locationQuery, mode: 'insensitive' as const } }
                ]
            });
        } else {
            // Recherche par terme unique
            locationConditions.push({
                OR: [
                    { cities: { name: { contains: locationQuery, mode: 'insensitive' as const } } },
                    { address_line1: { contains: locationQuery, mode: 'insensitive' as const } },
                    { address_line2: { contains: locationQuery, mode: 'insensitive' as const } },
                    { postal_code: { contains: locationQuery, mode: 'insensitive' as const } },
                ]
            });
        }
    }

    // Appliquer les filtres sur les localisations
    if (locationConditions.length > 0) {
        where.business_locations = {
            some: {
                AND: locationConditions
            }
        };
    }

    // Configuration du tri
    const orderBy = [
      { ratings_aggregates: { rating_avg: 'desc' as const } },
      { created_at: 'desc' as const }
    ];
    
    // Exécution de la requête Prisma
    const [allBusinesses, total] = await Promise.all([
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
        skip: 0,
        take: pageSize * 3, // Fetch more to sort properly
      }),
      prisma.businesses.count({ where })
    ]);
    
    // Sort by claim_status first (functional salons first, then claimable)
    const sortedByClaimStatus = allBusinesses.sort((a: any, b: any) => {
      const aIsFunctional = (a.claim_status ?? 'none') !== 'none';
      const bIsFunctional = (b.claim_status ?? 'none') !== 'none';
      if (aIsFunctional && !bIsFunctional) return -1;
      if (!aIsFunctional && bIsFunctional) return 1;
      return 0;
    });
    
    // Apply pagination after sorting
    const businesses = sortedByClaimStatus.slice(skip, skip + pageSize);
    
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
        location: {
          latitude: primaryLocation?.latitude,
          longitude: primaryLocation?.longitude,
          address: primaryLocation ? `${primaryLocation.address_line1} ${primaryLocation.address_line2 || ''}`.trim() : ''
        },
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
        isTop: Number(business.ratings_aggregates?.rating_avg || 0) >= 4.5
      };
    });

    // --- 4. Tri par pertinence de localisation ---
    if (locationQuery) {
      const normalizedQuery = locationQuery.toLowerCase();
      const queryParts = normalizedQuery.split(',').map(p => p.trim());
      const communeQuery = queryParts[0];
      const wilayaQuery = queryParts[1] || queryParts[0];

      formattedResults.sort((a, b) => {
        const aCity = a.city.toLowerCase();
        const aAddr = a.address.toLowerCase();
        const bCity = b.city.toLowerCase();
        const bAddr = b.address.toLowerCase();

        // 1. Priorité aux communes exactes (ex: "Bejaia" -> "Bejaia")
        const aExactCommune = aAddr.includes(communeQuery) || aCity === communeQuery;
        const bExactCommune = bAddr.includes(communeQuery) || bCity === communeQuery;
        if (aExactCommune && !bExactCommune) return -1;
        if (bExactCommune && !aExactCommune) return 1;

        // 2. Priorité au "centre" de la wilaya cherchée (ex: "Alger" -> "Alger centre")
        const aIsCentre = (aAddr.includes("centre") || aCity.includes("centre")) && (aCity.includes(wilayaQuery) || aAddr.includes(wilayaQuery));
        const bIsCentre = (bAddr.includes("centre") || bCity.includes("centre")) && (bCity.includes(wilayaQuery) || bAddr.includes(wilayaQuery));
        if (aIsCentre && !bIsCentre) return -1;
        if (bIsCentre && !aIsCentre) return 1;

        return 0;
      });
    }
    
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
