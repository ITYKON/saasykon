import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cities = await prisma.cities.findMany({
      where: {
        country_code: "DZ", // Assuming Algeria
        wilaya_number: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        wilaya_number: true,
      },
      orderBy: {
        wilaya_number: "asc"
      }
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}