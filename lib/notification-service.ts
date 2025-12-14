import { prisma } from "./prisma";
import { sendEmail } from "./email";

export const NotificationService = {
  async createUserNotification(userId: string, type: string, data: any) {
    try {
      // Créer la notification en base de données
      const notification = await prisma.notifications.create({
        data: {
          user_id: userId,
          type,
          payload: data,
          is_read: false,
        },
      });

      // Envoyer un email si nécessaire
      if (type === 'claim.approved') {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true, first_name: true, last_name: true }
        });

        if (user) {
          const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Cher client';
          
          await sendEmail({
            to: user.email,
            subject: 'Votre demande de revendication a été approuvée',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <p>Bonjour ${userName},</p>
                <p>Nous avons le plaisir de vous informer que votre demande de revendication pour l'établissement <strong>${data.businessName}</strong> a été approuvée avec succès.</p>
                <p>Vous pouvez dès à présent accéder à votre tableau de bord professionnel pour gérer votre établissement.</p>
                <p style="margin-top: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/pro/dashboard" 
                     style="display: inline-block; padding: 10px 20px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px;">
                    Accéder à mon tableau de bord
                  </a>
                </p>
                <p style="margin-top: 30px;">
                  Cordialement,<br>
                  L'équipe YOKA
                </p>
              </div>
            `
          });
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string) {
    return prisma.notifications.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  },

  async getUserNotifications(userId: string, limit = 10) {
    return prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },
};

export default NotificationService;
