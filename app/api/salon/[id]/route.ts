import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const business = await prisma.businesses.findUnique({
      where: { id },
      select: {
        id: true,
        public_name: true,
        legal_name: true,
        email: true,
        phone: true,
        description: true,
        business_locations: { where: { is_primary: true }, take: 1, select: { address_line1: true, address_line2: true, postal_code: true } },
        business_media: { orderBy: { position: "asc" }, select: { url: true } },
        ratings_aggregates: { select: { rating_avg: true, rating_count: true } },
        services: {
          where: { is_active: true },
          select: {
            id: true,
            name: true,
            description: true,
            category_id: true,
            service_categories: { select: { name: true } },
            service_variants: { where: { is_active: true }, orderBy: { duration_minutes: "asc" }, select: { id: true, name: true, duration_minutes: true, price_cents: true } },
          },
          orderBy: { name: "asc" },
        },
        reviews: { select: { id: true, rating: true, comment: true, created_at: true }, take: 20, orderBy: { created_at: "desc" } },
      },
    });

    if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const address = business.business_locations?.[0];
    const addressText = [address?.address_line1, address?.address_line2, address?.postal_code].filter(Boolean).join(", ");
    const images = (business.business_media || []).map((m) => m.url);
    const rating = business.ratings_aggregates ? Number(business.ratings_aggregates.rating_avg) : 0;
    const reviewCount = business.ratings_aggregates ? business.ratings_aggregates.rating_count : 0;

    // Group services by category
    const categoriesMap = new Map<string, { category: string; items: Array<{ id: string; name: string; description?: string | null; duration_minutes: number; price_cents: number | null }> }>();
    for (const s of business.services) {
      const catName = s.service_categories?.name || "Autres";
      if (!categoriesMap.has(catName)) categoriesMap.set(catName, { category: catName, items: [] });
      const variant = s.service_variants?.[0];
      const duration = variant?.duration_minutes || 30;
      const price = variant?.price_cents ?? null;
      categoriesMap.get(catName)!.items.push({ id: s.id, name: s.name, description: s.description, duration_minutes: duration, price_cents: price });
    }

    // Reviews simplified
    const reviews = (business.reviews || []).map((r) => ({ id: r.id, rating: r.rating, date: r.created_at, comment: r.comment, author: "Client" }));

    return NextResponse.json({
      id: business.id,
      name: business.public_name || business.legal_name,
      address: addressText,
      phone: business.phone,
      email: business.email,
      rating,
      reviewCount,
      images,
      services: Array.from(categoriesMap.values()),
      reviews,
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
