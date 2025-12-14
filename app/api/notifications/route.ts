import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Récupérer les notifications non lues de l'utilisateur
    const [notifications, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where: { 
          user_id: ctx.userId,
        },
        orderBy: { created_at: 'desc' },
        take: 50, // Limiter à 50 dernières notifications
      }),
      prisma.notifications.count({
        where: { 
          user_id: ctx.userId,
          is_read: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { type, payload } = await req.json();

    if (!type) {
      return NextResponse.json(
        { error: "Le type de notification est requis" },
        { status: 400 }
      );
    }

    const notification = await prisma.notifications.create({
      data: {
        user_id: ctx.userId,
        type,
        payload,
        is_read: false,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de la notification" },
      { status: 500 }
    );
  }
}
