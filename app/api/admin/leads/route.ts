import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  const auth = await requireAdminOrPermission("LEADS_VIEW");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const activity = searchParams.get("activity") || undefined;
  const location = searchParams.get("location") || undefined;
  const q = searchParams.get("q") || undefined;
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

  const where: any = {};
  if (status) where.status = status as any;
  if (activity) where.activity_type = activity;
  if (location) where.location = location;
  if (q) {
    where.OR = [
      { business_name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { owner_first_name: { contains: q, mode: "insensitive" } },
      { owner_last_name: { contains: q, mode: "insensitive" } },
    ];
  }
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) (where.created_at as any).gte = new Date(startDate);
    if (endDate) (where.created_at as any).lte = new Date(endDate);
  }

  const [total, items] = await Promise.all([
    prisma.business_leads.count({ where }),
    prisma.business_leads.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        business_name: true,
        owner_first_name: true,
        owner_last_name: true,
        email: true,
        phone: true,
        activity_type: true,
        location: true,
        status: true,
        created_at: true,
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, items });
}
