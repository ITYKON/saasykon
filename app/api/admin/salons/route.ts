import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";
import { z } from "zod";

// Type personnalisé pour la réponse de la requête Prisma
type BusinessWithRelations = {
  id: string;
  legal_name: string;
  public_name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  cover_url: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
  deleted_at: Date | null;
  owner_user_id: string;
  claim_status?: string;
  business_locations: any[];
  services: Array<{ id: string; name: string }>;
  employees: any[];
  subscriptions: Array<{
    id: string;
    plans: { id: number; name: string } | null;
  }>;
  business_verifications?: Array<{
    id: string;
    status: string;
    reviewed_at: Date | null;
  }>;
};

type SalonResponse = BusinessWithRelations & {
  rating_avg: number;
  rating_count: number;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  monthlyRevenue: number;
  joinDate: string;
  lastActivity?: string;
  subscription: string;
  status: "en attente" | "inactif" | "active" | "verified" | "pending_verification";
  verification_status?: string;
  isTop: boolean;
  isNew: boolean;
  isPremium: boolean;
};

export async function GET(req: Request) {
  try {
    // Vérification de l'authentification
    const authCheck = await requireAdminOrPermission("salons");
    if (authCheck instanceof NextResponse) return authCheck;
    
    // Gestion de la pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "10", 10), 100);
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const q = (searchParams.get("q") || "").trim();

    // Construction de la requête de recherche
    const claimStatusFilter = searchParams.get("claim_status");
    const where: any = {
      // Exclure les salons archivés et supprimés
      archived_at: null,
      deleted_at: null,
      ...(q && {
        OR: [
          { public_name: { contains: q, mode: 'insensitive' } },
          { legal_name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }),
      // Filtre par statut de revendication si spécifié
      ...(claimStatusFilter && claimStatusFilter !== "all" ? { claim_status: claimStatusFilter } : {}),
    };

    // Récupération des données avec sélection précise des champs
    const salons = await prisma.businesses.findMany({
      where,
      select: {
        id: true,
        legal_name: true,
        public_name: true,
        description: true,
        email: true,
        phone: true,
        website: true,
        logo_url: true,
        cover_url: true,
        status: true,
        claim_status: true,
        slug: true,
        created_at: true,
        updated_at: true,
        archived_at: true,
        deleted_at: true,
        owner_user_id: true,
        business_locations: {
          include: {
            cities: {
              select: {
                name: true
              }
            }
          },
          take: 1
        },
        business_verifications: {
          select: {
            id: true,
            status: true,
            reviewed_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 1
        },
        services: {
          select: {
            id: true,
            name: true
          },
          take: 10
        },
        employees: true,
        subscriptions: {
          select: {
            id: true,
            plans: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: { created_at: "desc" },
      skip,
      take,
    }) as unknown as BusinessWithRelations[];

    // Comptage total des résultats
    const total = await prisma.businesses.count({ where });

    // Récupération des IDs pour les requêtes supplémentaires
    const businessIds = salons.map((s) => s.id);
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // groupBy reservations -> totalBookings
    const reservationsCounts = businessIds.length
      ? await prisma.reservations.groupBy({
          by: ["business_id"],
          where: { business_id: { in: businessIds } },
          _count: { _all: true },
        })
      : [];
    const bookingsMap = Object.fromEntries(reservationsCounts.map((r) => [r.business_id, r._count._all]));

    // groupBy payments in last 30d -> monthlyRevenue in DA
    const paymentsSums = businessIds.length
      ? await prisma.payments.groupBy({
          by: ["business_id"],
          where: { business_id: { in: businessIds }, status: "CAPTURED", created_at: { gte: last30, lt: now } },
          _sum: { amount_cents: true },
        })
      : [];
    const monthlyRevenueMap = Object.fromEntries(
      paymentsSums.map((p) => [p.business_id, Math.round(((p._sum.amount_cents || 0) as number) / 100)])
    );

    // lastActivity via event_logs (take recent and pick first per business)
    const recentLogs = businessIds.length
      ? await prisma.event_logs.findMany({
          where: { business_id: { in: businessIds } },
          orderBy: { occurred_at: "desc" },
          take: 200,
          select: { business_id: true, occurred_at: true },
        })
      : [];
    const lastActivityMap: Record<string, string> = {};
    for (const log of recentLogs) {
      const bid = log.business_id as string | null;
      if (bid && !lastActivityMap[bid]) lastActivityMap[bid] = log.occurred_at.toISOString();
    }

    // Enrichissement des données pour le frontend
    const salonsWithBadges: SalonResponse[] = salons.map((salon: BusinessWithRelations) => {
      // Valeurs par défaut
      const rating_avg = 0;
      const rating_count = 0;
      
      // Vérification des données de base
      const businessLocations = Array.isArray(salon.business_locations) ? salon.business_locations : [];
      const services = Array.isArray(salon.services) ? salon.services : [];
      const employees = Array.isArray(salon.employees) ? salon.employees : [];
      const subscriptions = Array.isArray(salon.subscriptions) ? salon.subscriptions : [];
      
      // Calculs de statut
      const hasLocation = businessLocations.length > 0;
      const hasService = services.length > 0;
      const hasEmployee = employees.length > 0;
      const profileComplete = hasLocation && hasService && hasEmployee && Boolean(salon.public_name);
      const hasActiveSubscription = subscriptions.length > 0;
      const isNew = (new Date().getTime() - new Date(salon.created_at).getTime()) < 1000 * 60 * 60 * 24 * 30; // Moins de 30 jours
      
      // Détermination du statut - utiliser le statut réel du business
      let status: "en attente" | "inactif" | "active" | "verified" | "pending_verification" = "en attente";
      if (salon.archived_at || salon.deleted_at) {
        status = "inactif"; // Keep 'inactif' as it seems to be a display state for archived? Or should it be 'inactive'? Database doesn't have 'inactive'.
        // Wait, database enum has 'active', 'verified', 'pending_verification'.
        // 'inactif' isn't in DB. It's a derived state.
        // But 'status' field in response is used for display. 
        // If I change this to returns 'active', frontend will work for PUT.
        // But frontend display logic (page.tsx) expects 'active' (I updated it).
        // Does page.tsx handle 'inactif'? Yes.
        
      } else if (salon.status === "active" || salon.status === "actif") {
        status = "active";
      } else if (salon.status === "verified") {
        status = "verified";
      } else if (salon.status === "pending_verification") {
        status = "pending_verification";
      }
      
      // Statut de vérification (depuis business_verifications)
      const verification = Array.isArray(salon.business_verifications) && salon.business_verifications.length > 0
        ? salon.business_verifications[0]
        : null;
      const verification_status = verification?.status || undefined;
      
      // Données de l'abonnement
      const subscription = subscriptions[0]?.plans?.name || "";
      
      return {
        ...salon,
        rating_avg,
        rating_count,
        // Champs attendus par le front
        rating: rating_avg,
        reviewCount: rating_count,
        totalBookings: bookingsMap[salon.id] || 0,
        monthlyRevenue: monthlyRevenueMap[salon.id] || 0, // DA
        joinDate: salon.created_at?.toISOString() || new Date().toISOString(),
        lastActivity: lastActivityMap[salon.id] || undefined,
        subscription,
        status,
        verification_status,
        isTop: rating_avg >= 4.5,
        isNew: (new Date().getTime() - new Date(salon.created_at).getTime()) < 1000 * 60 * 60 * 24 * 30,
        isPremium: subscription.toLowerCase() === "premium",
      };
    });

    // Préparation de la réponse
    return NextResponse.json({ 
      success: true,
      data: {
        salons: salonsWithBadges, 
        total, 
        page, 
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error: unknown) {
    console.error('Error in /api/admin/salons:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal Server Error',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

// Validation Zod
const salonSchema = z.object({
  legal_name: z.string().min(2, "Le nom légal est requis (2 caractères min)"),
  public_name: z.string().min(2, "Le nom public est requis (2 caractères min)"),
  description: z.string().nullable().optional(),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  website: z.string().nullable().optional(),
  vat_number: z.string().nullable().optional(),
  category_code: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  cover_url: z.string().nullable().optional(),
  location: z.string().min(1, "La wilaya est requise"), 
  google_maps_link: z.string().nullable().optional(),
  latitude: z.string().nullable().optional().or(z.number()),
  longitude: z.string().nullable().optional().or(z.number()),
});


async function expandShortUrl(url: string): Promise<string> {
  if (!url) return url;
  if (!url.includes("goo.gl") && !url.includes("g.page") && !url.includes("google.com/maps")) return url;
  
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return response.url;
  } catch (error) {
    console.warn("Failed to expand short URL:", url, error);
    return url;
  }
}

function extractCoordinatesFromUrl(url: string): { latitude: number, longitude: number } | null {
  if (!url) return null;
  
  // Format 1: @lat,lng (e.g., https://www.google.com/maps/place/.../@36.75,3.05,15z)
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { latitude: parseFloat(atMatch[1]), longitude: parseFloat(atMatch[2]) };
  }

  // Format 1b: !3dlat!4dlng (Very common in Google Maps place URLs)
  const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch) {
    return { latitude: parseFloat(dMatch[1]), longitude: parseFloat(dMatch[2]) };
  }
  
  // Format 2: q=lat,lng (e.g., https://maps.google.com/?q=36.75,3.05)
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { latitude: parseFloat(qMatch[1]), longitude: parseFloat(qMatch[2]) };
  }
  
  // Format 3: ll=lat,lng
  const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) {
    return { latitude: parseFloat(llMatch[1]), longitude: parseFloat(llMatch[2]) };
  }

  // Format 4: 36.75, 3.05 (just coordinates)
  const coordsMatch = url.match(/^\[?\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]?$/);
  if (coordsMatch) {
     return { latitude: parseFloat(coordsMatch[1]), longitude: parseFloat(coordsMatch[2]) };
  }
  
  return null;
}

export async function POST(req: Request) {
    const authCheck = await requireAdminOrPermission("salons");
    if (authCheck instanceof NextResponse) return authCheck;
    const data = await req.json();
  const parse = salonSchema.safeParse(data);
  if (!parse.success) {
    console.error("[POST /api/admin/salons] Validation error:", parse.error);
    return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
  }
  // Si create_for_claim est true, créer le salon sans propriétaire pour permettre la revendication
  const createForClaim = data.create_for_claim === true;
  let ownerUserId = data.owner_user_id;
  
  if (createForClaim) {
    // Pour revendication : pas de propriétaire, claim_status = "none"
    ownerUserId = null;
  } else if (!ownerUserId) {
    // Vérifier d'abord si l'email existe déjà
    if (data.email) {
      const existingUser = await prisma.users.findUnique({
        where: { email: data.email },
        select: { id: true, email: true }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { 
            error: "email_exists",
            message: "Un compte avec cet email existe déjà. Veuillez utiliser un email différent ou contacter le support.",
            field: "email"
          }, 
          { status: 400 }
        );
      }
    }
    
    // Création du user owner si l'email n'existe pas
    try {
      const ownerUser = await prisma.users.create({
        data: {
          email: data.email || `temp-${Date.now()}@example.com`,
          phone: data.phone,
          first_name: data.public_name?.split(" ")[0] || "",
          last_name: data.public_name?.split(" ").slice(1).join(" ") || data.legal_name || "",
        },
      });
      ownerUserId = ownerUser.id;
    } catch (error) {
      console.error("[POST /api/admin/salons] Erreur création utilisateur:", error);
      const err = error as { code?: string; meta?: { target?: string[] } };
      if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
        return NextResponse.json(
          { 
            error: "email_exists",
            message: "Un compte avec cet email existe déjà. Veuillez utiliser un email différent.",
            field: "email"
          }, 
          { status: 400 }
        );
      }
      return NextResponse.json(
        { 
          error: "user_creation_error",
          message: "Une erreur est survenue lors de la création du compte utilisateur.",
          details: process.env.NODE_ENV === 'development' ? err : undefined
        }, 
        { status: 500 }
      );
    }
  }
  
  // Création salon
  try {
    const salonData: any = {
      legal_name: data.legal_name,
      public_name: data.public_name,
      description: data.description || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      vat_number: data.vat_number || null,
      category_code: data.category_code || null,
      logo_url: data.logo_url || null,
      cover_url: data.cover_url || null,
      status: data.status || "pending_verification",
    };

    // Si create_for_claim, créer avec un user système comme propriétaire temporaire
    // et claim_status = "none" pour permettre la revendication
    if (createForClaim) {
      // Créer ou récupérer un user système pour les salons à revendiquer
      let systemUser = await prisma.users.findFirst({
        where: { email: "system@yoka.com" },
      });
      
      if (!systemUser) {
        // Créer un user système si nécessaire
        systemUser = await prisma.users.create({
          data: {
            email: "system@yoka.com",
            first_name: "System",
            last_name: "YOKA",
            locale: "fr",
          },
        });
      }
      
      salonData.owner_user_id = systemUser.id;
      salonData.claim_status = "none"; // Permet la revendication
      salonData.status = "pending_verification"; // En attente de revendication
    } else {
      // Les salons créés depuis l'admin sans l'option "revendication" ne sont PAS revendicables
      salonData.owner_user_id = ownerUserId;
      salonData.claim_status = "approved"; // Considéré comme revendiqué/approuvé
      // Allow status to be set by frontend (pending_verification), defaulting to active if missing
      salonData.status = data.status || "active";
      salonData.verification_status = "verified";
    }

    // Generate slug
    const { generateUniqueSlug } = await import("@/lib/salon-slug");
    const cityForSlug = parse.data.location || "";
    const nameForSlug = salonData.public_name || salonData.legal_name || "salon";
    salonData.slug = await generateUniqueSlug(nameForSlug, cityForSlug);

    const salon = await prisma.businesses.create({
      data: salonData,
    });

    // Create business location if location is provided
    if (parse.data.location) {
      try {
        // Try to find the city in the database
        const city = await prisma.cities.findFirst({
          where: {
            name: {
              contains: parse.data.location,
              mode: 'insensitive'
            },
          },
        });

        // Use coordinates from body if available, otherwise try to extract from link
        let lat = data.latitude ? parseFloat(data.latitude.toString()) : null;
        let lng = data.longitude ? parseFloat(data.longitude.toString()) : null;

        if (!lat || !lng) {
          const expandedUrl = parse.data.google_maps_link 
             ? await expandShortUrl(parse.data.google_maps_link) 
             : null;
             
          const coords = expandedUrl 
              ? extractCoordinatesFromUrl(expandedUrl) 
              : null;
          
          lat = coords?.latitude || null;
          lng = coords?.longitude || null;
        }

        await prisma.business_locations.create({
          data: {
            business_id: salon.id,
            address_line1: parse.data.location,
            city_id: city?.id,
            is_primary: true,
            latitude: lat,
            longitude: lng,
          },
        });
      } catch (locationError) {
        console.error("[POST /api/admin/salons] Erreur création localisation:", locationError);
        // Continue even if location creation fails
      }
    }
    await prisma.event_logs.create({
      data: {
        user_id: (authCheck as any).userId,
        event_name: "salon.create",
        payload: { business_id: salon.id } as any,
      },
    });
    return NextResponse.json({ salon });
  } catch (err) {
    console.error("[POST /api/admin/salons] Erreur création salon:", err);
    return NextResponse.json({ error: "Erreur création salon", details: err }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    const authCheck = await requireAdminOrPermission("salons");
    if (authCheck instanceof NextResponse) return authCheck;
    const data = await req.json();
  if (!data.id) {
    console.error("[PUT /api/admin/salons] Missing salon id");
    return NextResponse.json({ error: "Missing salon id" }, { status: 400 });
  }
  
  // Si seulement le statut est fourni, on peut mettre à jour juste le statut
  if (data.status && Object.keys(data).length === 2) {
    try {
      const salon = await prisma.businesses.update({
        where: { id: data.id },
        data: {
          status: data.status as any,
          updated_at: new Date(),
        },
      });
      await prisma.event_logs.create({
        data: {
          user_id: (authCheck as any).userId,
          event_name: "salon.status_update",
          payload: { business_id: salon.id, status: data.status } as any,
        },
      });
      return NextResponse.json({ salon });
    } catch (err: any) {
      console.error("[PUT /api/admin/salons] Erreur modification statut:", err);
      if (err?.code === "P2025") {
        return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
      }
      return NextResponse.json({ error: "Erreur modification statut", details: err }, { status: 500 });
    }
  }
  
  const parse = salonSchema.safeParse(data);
  if (!parse.success) {
    console.error("[PUT /api/admin/salons] Validation error:", parse.error);
    return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
  }
  try {
    const updateData: any = {
      legal_name: data.legal_name,
      public_name: data.public_name,
      description: data.description,
      email: data.email,
      phone: data.phone,
      website: data.website,
      vat_number: data.vat_number,
      category_code: data.category_code,
      logo_url: data.logo_url,
      cover_url: data.cover_url,
      updated_at: new Date(),
    };
    
    // Si le statut est fourni, l'inclure dans la mise à jour
    if (data.status) {
      updateData.status = data.status as any;
    }
    
    const salon = await prisma.businesses.update({
      where: { id: data.id },
      data: updateData,
    });
    
    // Handle location update if provided
    if (data.location || data.google_maps_link) {
      let city = null;
      // Find the city by name
      if (data.location) {
        city = await prisma.cities.findFirst({
            where: {
            name: {
                contains: data.location,
                mode: 'insensitive'
            }
            }
        });
      }

      // Use coordinates from body if available, otherwise try to extract from link
      let lat = data.latitude ? parseFloat(data.latitude.toString()) : null;
      let lng = data.longitude ? parseFloat(data.longitude.toString()) : null;

      if (!lat || !lng) {
        const expandedUrl = data.google_maps_link 
          ? await expandShortUrl(data.google_maps_link) 
          : null;

        const coords = expandedUrl 
          ? extractCoordinatesFromUrl(expandedUrl) 
          : null;
        
        lat = coords?.latitude || null;
        lng = coords?.longitude || null;
      }
      
      // Update or create business location
      const existingLocation = await prisma.business_locations.findFirst({
        where: { business_id: data.id, is_primary: true }
      });
      
      if (existingLocation) {
        await prisma.business_locations.update({
          where: { id: existingLocation.id },
          data: {
            ...(data.location ? { address_line1: data.location } : {}),
            ...(city ? { city_id: city.id } : {}),
            latitude: lat,
            longitude: lng,
            updated_at: new Date()
          }
        });
      } else {
        if (data.location) {
            await prisma.business_locations.create({
            data: {
                business_id: data.id,
                address_line1: data.location,
                city_id: city?.id,
                is_primary: true,
                latitude: lat,
                longitude: lng,
            }
            });
        }
      }
    }
    await prisma.event_logs.create({
      data: {
        user_id: (authCheck as any).userId,
        event_name: "salon.update",
        payload: { business_id: salon.id } as any,
      },
    });
    return NextResponse.json({ salon });
  } catch (err: any) {
    console.error("[PUT /api/admin/salons] Erreur modification salon:", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur modification salon", details: err }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authCheck = await requireAdminOrPermission("salons");
  if (authCheck instanceof NextResponse) return authCheck;
  
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: "ID du salon manquant" }, { status: 400 });
    }
    
    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json({ error: "Statut manquant" }, { status: 400 });
    }
    
    const updatedSalon = await prisma.businesses.update({
      where: { id },
      data: { status },
      include: {
        business_locations: {
          include: { cities: true }
        },
        subscriptions: {
          include: { plans: true }
        }
      }
    });
    
    // Journalisation de l'action
    await prisma.event_logs.create({
      data: {
        user_id: (authCheck as any).userId,
        event_name: "salon.status_update",
        payload: { business_id: id, status } as any,
      },
    });
    
    return NextResponse.json({ success: true, data: updatedSalon });
    
  } catch (err: any) {
    console.error("[PATCH /api/admin/salons/[id]/status] Erreur:", err);
    
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const authCheck = await requireAdminOrPermission("salons");
  if (authCheck instanceof NextResponse) return authCheck;
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing salon id" }, { status: 400 });
  try {
    // Soft delete: archive le salon pour intégration avec la page Archives
    const salon = await prisma.businesses.update({ where: { id }, data: { archived_at: new Date() } });
    await prisma.event_logs.create({
      data: {
        user_id: (authCheck as any).userId,
        event_name: "salon.archive",
        payload: { business_id: id } as any,
      },
    });
    return NextResponse.json({ success: true, message: "Salon archivé", salon });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
    }
    if (err?.code === "P2003") {
      return NextResponse.json({ error: "Suppression impossible: contraintes de données" }, { status: 409 });
    }
    console.error("[DELETE /api/admin/salons] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}