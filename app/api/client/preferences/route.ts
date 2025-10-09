import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";

// GET: return user's notification preferences (create defaults if missing)
export async function GET() {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ preferences: null }, { status: 401 });

  let pref = await prisma.notification_preferences.findUnique({ where: { user_id: user.id } }).catch(() => null);
  if (!pref) {
    pref = await prisma.notification_preferences.create({
      data: { user_id: user.id, email: true, sms: false, push: false, categories: {} },
    });
  }
  return NextResponse.json({ preferences: pref });
}

// PUT: update user's notification preferences
export async function PUT(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({} as any));
  const data: any = {};
  if (typeof body.email === "boolean") data.email = body.email;
  if (typeof body.sms === "boolean") data.sms = body.sms;
  if (typeof body.push === "boolean") data.push = body.push;
  if (body.categories && typeof body.categories === "object") data.categories = body.categories;

  // Upsert to ensure record exists
  const updated = await prisma.notification_preferences.upsert({
    where: { user_id: user.id },
    update: data,
    create: { user_id: user.id, email: true, sms: false, push: false, categories: body.categories ?? {} },
  });
  return NextResponse.json({ preferences: updated });
}
