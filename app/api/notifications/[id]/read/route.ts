import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const notificationId = params.id;

    // Vérifier que la notification appartient bien à l'utilisateur
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification non trouvée" },
        { status: 404 }
      );
    }

    if (notification.user_id !== ctx.userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    // Marquer la notification comme lue
    await prisma.notifications.update({
      where: { id: notificationId },
      data: { is_read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du marquage de la notification comme lue" },
      { status: 500 }
    );
  }
}
