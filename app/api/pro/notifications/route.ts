import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(Number(url.searchParams.get("limit") || 10), 50);
  const cursor = url.searchParams.get("cursor"); // use created_at,id tuple as cursor

  let where = { business_id: businessId } as any;
  let orderBy = [{ created_at: "desc" as const }, { id: "desc" as const }];

  // Cursor-based pagination using created_at and id
  if (cursor) {
    const [ts, id] = cursor.split("_");
    const createdAt = new Date(ts);
    where = {
      ...where,
      OR: [
        { created_at: { lt: createdAt } },
        { created_at: createdAt, id: { lt: id } },
      ],
    };
  }

  const items = await prisma.notifications.findMany({
    where,
    orderBy,
    take: limit,
    select: { id: true, type: true, payload: true, is_read: true, created_at: true },
  });

  const nextCursor = items.length === limit
    ? `${items[items.length - 1].created_at.toISOString()}_${items[items.length - 1].id}`
    : null;

  return NextResponse.json({ notifications: items, nextCursor });
}
