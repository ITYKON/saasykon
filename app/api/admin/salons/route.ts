import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: Request) {
  // Pagination
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [salons, total] = await Promise.all([
    prisma.businesses.findMany({
      include: {
        business_locations: true,
        business_media: true,
        users: true,
        services: true,
        reviews: true,
        employees: true,
        subscriptions: { include: { plans: true } },
        ratings_aggregates: true,
      },
      orderBy: { created_at: "desc" },
      skip,
      take,
    }),
    prisma.businesses.count(),
  ]);

  // Calculs business pour badges/statuts avancés
  const salonsWithBadges = salons.map(salon => {
    // rating_avg et rating_count
    const rating_avg = salon.ratings_aggregates?.rating_avg ? Number(salon.ratings_aggregates.rating_avg) : 0;
    const rating_count = salon.ratings_aggregates?.rating_count ?? 0;
    // abonnement principal (nom du plan)
    const subscription = salon.subscriptions?.[0]?.plans?.name || "";
    return {
      ...salon,
      rating_avg,
      rating_count,
      subscription,
      isTop: rating_avg >= 4.5,
      isNew: (new Date().getTime() - new Date(salon.created_at).getTime()) < 1000 * 60 * 60 * 24 * 30,
      isPremium: subscription.toLowerCase() === "premium",
    };
  });

  return NextResponse.json({ salons: salonsWithBadges, total, page, pageSize });
}

// Validation Zod
const salonSchema = z.object({
  legal_name: z.string().min(2),
  public_name: z.string().min(2),
  description: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(6),
  country_code: z.string().min(2),
  website: z.string().url().optional(),
  vat_number: z.string().optional(),
  category_code: z.string().optional(),
  logo_url: z.string().optional(),
  cover_url: z.string().optional(),
  status: z.string(),
  subscription: z.string(),
  joinDate: z.string().optional(),
  lastActivity: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  totalBookings: z.number().optional(),
  monthlyRevenue: z.number().optional(),
});

export async function POST(req: Request) {
  const data = await req.json();
  console.log("[POST /api/admin/salons] data reçu:", data);
  const parse = salonSchema.safeParse(data);
  if (!parse.success) {
    console.error("[POST /api/admin/salons] Validation error:", parse.error);
    return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
  }
  // Création du user owner si non fourni
  let ownerUserId = data.owner_user_id;
  if (!ownerUserId) {
    try {
      const ownerUser = await prisma.users.create({
        data: {
          email: data.email,
          phone: data.phone,
          first_name: data.public_name,
          last_name: data.legal_name,
        },
      });
      ownerUserId = ownerUser.id;
      console.log("[POST /api/admin/salons] User owner créé:", ownerUser);
    } catch (err) {
      console.error("[POST /api/admin/salons] Erreur création user:", err);
      return NextResponse.json({ error: "Erreur création user", details: err }, { status: 500 });
    }
  }
  // Création salon
  try {
    const salon = await prisma.businesses.create({
      data: {
        owner_user_id: ownerUserId,
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
        // autres champs si besoin
      },
    });
    console.log("[POST /api/admin/salons] Salon créé:", salon);
    return NextResponse.json({ salon });
  } catch (err) {
    console.error("[POST /api/admin/salons] Erreur création salon:", err);
    return NextResponse.json({ error: "Erreur création salon", details: err }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const data = await req.json();
  console.log("[PUT /api/admin/salons] data reçu:", data);
  if (!data.id) {
    console.error("[PUT /api/admin/salons] Missing salon id");
    return NextResponse.json({ error: "Missing salon id" }, { status: 400 });
  }
  const parse = salonSchema.safeParse(data);
  if (!parse.success) {
    console.error("[PUT /api/admin/salons] Validation error:", parse.error);
    return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
  }
  try {
    const salon = await prisma.businesses.update({
      where: { id: data.id },
      data: {
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
        // autres champs si besoin
      },
    });
    console.log("[PUT /api/admin/salons] Salon modifié:", salon);
    return NextResponse.json({ salon });
  } catch (err) {
    console.error("[PUT /api/admin/salons] Erreur modification salon:", err);
    return NextResponse.json({ error: "Erreur modification salon", details: err }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing salon id" }, { status: 400 });
  await prisma.businesses.delete({ where: { id } });
  return NextResponse.json({ success: true });
}