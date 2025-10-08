import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

function getMonthBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

export async function GET(req: Request) {
  const auth = await requireAdminOrPermission("statistics");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "current-month";
  const now = new Date();
  const { start, end } = getMonthBounds(now);

  const where = period === "current-month" ? { created_at: { gte: start, lt: end } } : {};

  const rows = await prisma.payments.findMany({
    where,
    select: {
      id: true,
      business_id: true,
      reservation_id: true,
      provider_id: true,
      amount_cents: true,
      currency: true,
      status: true,
      created_at: true,
    },
    orderBy: { created_at: "asc" },
  });

  const header = [
    "payment_id",
    "business_id",
    "reservation_id",
    "provider_id",
    "amount_cents",
    "currency",
    "status",
    "created_at",
  ];
  const lines = [header.join(",")].concat(
    rows.map((r) =>
      [
        r.id,
        r.business_id,
        r.reservation_id ?? "",
        r.provider_id ?? "",
        String(r.amount_cents),
        r.currency,
        r.status,
        r.created_at.toISOString(),
      ].join(",")
    )
  );
  const csv = lines.join("\n");

  const filename = `financials_${now.getUTCFullYear()}_${String(now.getUTCMonth() + 1).padStart(2, "0")}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
      "Cache-Control": "no-store",
    },
  });
}
