import { prisma } from './prisma';
import { sendEmail } from './email';

export async function sendDocumentReminders() {
  try {
    // Récupérer les entreprises avec des documents en attente et dont la période d'essai n'est pas encore terminée
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 1); // Demain pour les rappels quotidiens

    // Définir le type pour l'inclusion des utilisateurs
    const businessesNeedingReminder = await prisma.businesses.findMany({
      where: {
        verification_status: 'pending',
        trial_ends_at: {
          gte: now, // Seulement si la période d'essai n'est pas encore terminée
          lte: sevenDaysFromNow // Seulement si la période d'essai se termine bientôt
        },
        last_reminder_sent_at: {
          // Ne pas envoyer plus d'un rappel par jour
          lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        users_businesses_owner_user_idTousers: true,
        business_verifications: {
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        }
      }
    });

    for (const business of businessesNeedingReminder) {
      const user = business.users_businesses_owner_user_idTousers;
      if (!user) continue;

      const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
      const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      // Envoyer un email de rappel
      await sendDocumentReminderEmail(
        user.email, 
        user.first_name || 'Cher client', 
        business.public_name || 'votre entreprise', 
        daysLeft
      );
      
      // Créer une notification dans la base de données
      await prisma.notifications.create({
        data: {
          user_id: user.id,
          business_id: business.id,
          type: 'DOCUMENT_REMINDER',
          is_read: false,
          payload: {
            title: 'Rappel de documents',
            message: `Il vous reste ${daysLeft} jour(s) pour soumettre vos documents.`,
            businessId: business.id,
            daysRemaining: daysLeft
          }
        }
      });

      // Mettre à jour la date du dernier rappel
      await prisma.businesses.update({
        where: { id: business.id },
        data: { last_reminder_sent_at: now }
      });
    }

    return { success: true, count: businessesNeedingReminder.length };
  } catch (error) {
    console.error('Erreur lors de l\'envoi des rappels de documents:', error);
    return { success: false, error };
  }
}

async function sendDocumentReminderEmail(to: string, name: string, businessName: string, daysLeft: number) {
  const subject = `[${businessName}] Rappel : Documents manquants (${daysLeft} jour(s) restant(s))`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a365d;">Documents manquants pour ${businessName}</h2>
      <p>Bonjour ${name},</p>
      <p>Nous n'avons pas encore reçu tous les documents nécessaires pour vérifier votre entreprise <strong>${businessName}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4299e1; margin: 20px 0;">
        <p style="margin: 0;">
          <strong>Il vous reste ${daysLeft} jour(s)</strong> pour soumettre les documents requis avant la suspension de votre compte.
        </p>
      </div>
      
      <p>Veuillez vous connecter à votre espace professionnel pour télécharger les documents nécessaires :</p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/pro/settings/business?tab=documents" 
         style="display: inline-block; background-color: #4299e1; color: white; 
                padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Télécharger les documents
      </a>
      
      <p>Si vous avez des questions ou rencontrez des difficultés, n'hésitez pas à répondre à cet email pour contacter notre équipe de support.</p>
      
      <p>Cordialement,<br>L'équipe ${process.env.NEXT_PUBLIC_APP_NAME || 'SaasyKon'}</p>
      
      <p style="font-size: 12px; color: #718096; margin-top: 30px;">
        Ceci est un email automatique, merde de ne pas y répondre directement.
      </p>
    </div>
  `;

  // Utiliser le service d'email existant
  return sendEmail({
    to,
    subject,
    html,
  });
}

// Fonction pour vérifier et bloquer les comptes en retard
export async function checkAndBlockExpiredAccounts() {
  try {
    const now = new Date();
    
    // Trouver les entreprises dont la période de 7 jours est écoulée sans soumission de documents
    const businesses = await prisma.businesses.findMany({
      where: {
        verification_status: 'pending',
        trial_ends_at: {
          lt: now
        },
        status: 'active'
      },
      include: {
        users_businesses_owner_user_idTousers: true
      }
    });

    for (const business of businesses) {
      // Mettre à jour le statut de l'entreprise
      await prisma.businesses.update({
        where: { id: business.id },
        data: {
          status: 'pending_verification', // Utilisation d'une valeur valide de l'enum business_status
          verification_status: 'rejected',
          updated_at: now
        }
      });

      // Notifier l'utilisateur
      const owner = business.users_businesses_owner_user_idTousers;
      if (owner) {
        await sendAccountBlockedEmail(
          owner.email,
          owner.first_name || 'Cher client',
          business.public_name
        );

        // Créer une notification
        await prisma.notifications.create({
          data: {
            user_id: owner.id,
            business_id: business.id,
            type: 'ACCOUNT_SUSPENDED',
            is_read: false,
            payload: {
              title: 'Compte suspendu',
              message: 'Votre compte a été suspendu en raison de documents manquants.',
              businessId: business.id,
              reason: 'Documents manquants après la période d\'essai'
            }
          }
        });
      }
    }

    return { success: true, blockedCount: businesses.length };
  } catch (error) {
    console.error('Erreur lors de la vérification des comptes expirés:', error);
    return { success: false, error };
  }
}

async function sendAccountBlockedEmail(to: string, name: string, businessName: string) {
  const subject = `[${businessName}] Votre compte a été bloqué`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #e53e3e;">Compte bloqué</h2>
      <p>Bonjour ${name},</p>
      
      <p>Nous vous informons que votre compte pour l'entreprise <strong>${businessName}</strong> a été bloqué en raison du non-respect des délais de soumission des documents requis.</p>
      
      <div style="background-color: #fff5f5; padding: 15px; border-left: 4px solid #e53e3e; margin: 20px 0;">
        <p style="margin: 0;">
          <strong>Raison du blocage :</strong> Documents de vérification non soumis dans les délais impartis.
        </p>
      </div>
      
      <p>Pour débloquer votre compte, veuillez :</p>
      <ol>
        <li>Vous connecter à votre espace professionnel</li>
        <li>Soumettre les documents manquants</li>
        <li>Notre équipe examinera votre demande sous 24-48h</li>
      </ol>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/pro/settings/business?tab=documents" 
         style="display: inline-block; background-color: #e53e3e; color: white; 
                padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Débloquer mon compte
      </a>
      
      <p>Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, veuillez répondre à cet email pour contacter notre équipe de support.</p>
      
      <p>Cordialement,<br>L'équipe ${process.env.NEXT_PUBLIC_APP_NAME || 'SaasyKon'}</p>
      
      <p style="font-size: 12px; color: #718096; margin-top: 30px;">
        Ceci est un email automatique, merde de ne pas y répondre directement.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}
