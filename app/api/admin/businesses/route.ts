import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IncomingBody = {
  owner?: { userId?: string; email?: string };
  business: {
    legal_name: string;
    public_name: string;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    vat_number?: string | null;
    category_code?: string | null;
    logo_url?: string | null;
    cover_url?: string | null;
  };
  location: {
    address_line1: string;
    address_line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
    city_id?: number | null;
    country_code?: string | null; // ISO-2 expected; we'll normalize common inputs
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string | null;
    is_primary?: boolean | null;
  };
  working_hours?: Array<{
    weekday: number; // 0..6
    start_time: string; // HH:mm
    end_time: string;   // HH:mm
    breaks?: unknown;
  }>;
};

function normalizeCountryCode(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const map: Record<string, string> = {
    alg: "DZ",
    dz: "DZ",
    fr: "FR",
    france: "FR",
    maroc: "MA",
    ma: "MA",
    tn: "TN",
  };
  const key = trimmed.toLowerCase();
  if (map[key]) return map[key];
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return null;
}

function normalizeTimezone(tz?: string | null, countryCode?: string | null): string {
  if (tz && tz.trim()) return tz.trim();
  // Defaults by country if possible
  const cc = (countryCode || "").toUpperCase();
  if (cc === "DZ") return "Africa/Algiers";
  if (cc === "FR") return "Europe/Paris";
  return "Europe/Paris";
}

function toPgTime(value: string): Date {
  // Store as a Date with a fixed epoch date; DB column is TIME
  // Accepts HH:mm or HH:mm:ss
  const withSeconds = /^(\d{2}):(\d{2})(:(\d{2}))?$/.exec(value);
  if (!withSeconds) throw new Error("Invalid time format (expected HH:mm)");
  const hh = withSeconds[1];
  const mm = withSeconds[2];
  const ss = withSeconds[4] ?? "00";
  return new Date(`1970-01-01T${hh}:${mm}:${ss}Z`);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingBody;

    if (!body?.business?.legal_name || !body?.business?.public_name) {
      return NextResponse.json({ error: "legal_name et public_name requis" }, { status: 400 });
    }
    if (!body?.location?.address_line1) {
      return NextResponse.json({ error: "address_line1 requis" }, { status: 400 });
    }

    // Resolve owner
    let ownerUserId: string | null = body?.owner?.userId ?? null;
    if (!ownerUserId && body?.owner?.email) {
      const owner = await prisma.users.findUnique({ where: { email: body.owner.email } });
      if (!owner) {
        return NextResponse.json({ error: "Propriétaire introuvable via email" }, { status: 404 });
      }
      ownerUserId = owner.id;
    }
    if (!ownerUserId) {
      return NextResponse.json({ error: "owner_user_id ou email requis" }, { status: 400 });
    }

    const countryCode = normalizeCountryCode(body.location.country_code ?? null);
    const timezone = normalizeTimezone(body.location.timezone ?? null, countryCode);

    // City handling (optional)
    let cityId: number | null = body.location.city_id ?? null;
    if (!cityId && body.location.city) {
      const name = body.location.city.trim();
      const existingCity = await prisma.cities.findFirst({ where: { name } });
      if (existingCity) cityId = existingCity.id;
      else {
        const createdCity = await prisma.cities.create({ data: { name, country_code: countryCode ?? undefined } });
        cityId = createdCity.id;
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const business = await tx.businesses.create({
        data: {
          owner_user_id: ownerUserId!,
          legal_name: body.business.legal_name,
          public_name: body.business.public_name,
          description: body.business.description ?? null,
          email: body.business.email ?? null,
          phone: body.business.phone ?? null,
          website: body.business.website ?? null,
          vat_number: body.business.vat_number ?? null,
          category_code: body.business.category_code ?? null,
          logo_url: body.business.logo_url ?? null,
          cover_url: body.business.cover_url ?? null,
        },
      });

      const location = await tx.business_locations.create({
        data: {
          business_id: business.id,
          address_line1: body.location.address_line1,
          address_line2: body.location.address_line2 ?? null,
          postal_code: body.location.postal_code ?? null,
          city_id: cityId ?? undefined,
          country_code: countryCode ?? undefined,
          latitude: body.location.latitude ?? null,
          longitude: body.location.longitude ?? null,
          timezone,
          is_primary: body.location.is_primary ?? true,
        },
      });

      let hours: any[] = [];
      if (Array.isArray(body.working_hours) && body.working_hours.length > 0) {
        const data = body.working_hours.map((h) => ({
          business_id: business.id,
          weekday: h.weekday,
          start_time: toPgTime(h.start_time),
          end_time: toPgTime(h.end_time),
          breaks: h.breaks ?? undefined,
        }));
        hours = await tx.working_hours.createManyAndReturn
          ? await (tx.working_hours as any).createManyAndReturn({ data })
          : (await tx.working_hours.createMany({ data })).count;
      }

      return { business, location, hours };
    });

    return NextResponse.json({ created }, { status: 201 });
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


