import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const location = (searchParams.get("location") || "").trim();
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    // Construction des conditions de recherche
    const where: any = {
      archived_at: null,
      deleted_at: null,
    };

    // Filtre par catégorie si spécifié
    if (category) {
      where.category_code = category;
    }

    // Filtre par nom de salon ou services
    if (query) {
      where.OR = [
        { public_name: { contains: query, mode: "insensitive" } },
        { legal_name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        {
          services: {
            some: {
              name: { contains: query, mode: "insensitive" }
            }
          }
        }
      ];
    }

    // Filtre par localisation (ville ou adresse)
    if (location) {
      where.business_locations = {
        some: {
          OR: [
            { address_line1: { contains: location, mode: "insensitive" } },
            { address_line2: { contains: location, mode: "insensitive" } },
            { postal_code: { contains: location, mode: "insensitive" } },
            {
              cities: {
                name: { contains: location, mode: "insensitive" }
              }
            }
          ]
        }
      };
    }

    // Récupération des salons avec leurs relations
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
          { ratings_aggregates: { rating_avg: "desc" } },
          { created_at: "desc" }
        ],
        skip,
        take: pageSize,
      }),
      prisma.businesses.count({ where }),
    ]);

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

    return NextResponse.json({
      businesses: enrichedBusinesses,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error("[GET /api/search] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche", details: error },
      { status: 500 }
    );
  }
}
