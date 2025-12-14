import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Marquer toutes les notifications non lues comme lues
    await prisma.notifications.updateMany({
      where: { 
        user_id: ctx.userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du marquage des notifications comme lues" },
      { status: 500 }
    );
  }
}
