import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.roles.includes('ADMIN')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '10'));

    const where: any = {};
    
    if (status !== 'all') {
      where.status = status;
    }

    const [total, transfers] = await Promise.all([
      prisma.business_ownership_transfers.count({ where }),
      prisma.business_ownership_transfers.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          business: {
            select: {
              id: true,
              legal_name: true,
              public_name: true,
            },
          },
          current_owner: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          new_owner: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: transfers,
    });
  } catch (error) {
    console.error("Error fetching ownership transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch ownership transfers" },
      { status: 500 }
    );
  }
}
