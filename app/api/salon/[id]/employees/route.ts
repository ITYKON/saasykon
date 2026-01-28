import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = params.id;
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    if (!businessId) {
      return NextResponse.json({ error: "Missing business id" }, { status: 400 });
    }

    // Base filter: active employees of the business
    // If serviceId provided, restrict to employees linked to that service
    let employees;
    if (serviceId) {
      employees = await prisma.employees.findMany({
        where: {
          business_id: businessId,
          is_active: true,
          employee_services: { some: { service_id: serviceId } },
        },
        select: { id: true, full_name: true, color: true },
        orderBy: { full_name: "asc" },
      });
    } else {
      employees = await prisma.employees.findMany({
        where: { business_id: businessId, is_active: true },
        select: { id: true, full_name: true, color: true },
        orderBy: { full_name: "asc" },
      });
    }

    return NextResponse.json({ employees });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
