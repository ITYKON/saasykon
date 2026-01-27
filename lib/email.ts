// lib/email.ts
import { EmailClient } from "@azure/communication-email";

const EMAIL_FROM = process.env.EMAIL_FROM || "support@yoka-dz.com";

// Interface de compatibilité AWS SES
export interface EmailSendResult {
  messageId: string;
  status?: string;
}

// Lazy loading du client - n'est instancié qu'à la première utilisation
let emailClientInstance: EmailClient | null = null;

function getEmailClient(): EmailClient {
  if (!emailClientInstance) {
    const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    
    if (!connectionString) {
      console.error("AZURE_COMMUNICATION_CONNECTION_STRING manquante");
      throw new Error("Configuration email manquante");
    }
    
    emailClientInstance = new EmailClient(connectionString);
  }
  return emailClientInstance;
}

// Fonction TEST
export async function sendTestEmail(): Promise<EmailSendResult> {
  return sendEmail({
    to: process.env.EMAIL_TEST_TO || "test@example.com",
    subject: "Test Email from SaaS YKON",
    html: "<h1>Test Email</h1><p>This is a test email sent from SaaS YKON.</p>",
    text: "This is a test email sent from SaaS YKON.",
  });
}

// Fonction principale
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  category?: string;
  sandbox?: boolean;
}): Promise<EmailSendResult> {
  try {
    const message = {
      senderAddress: EMAIL_FROM,
      content: {
        subject: opts.subject,
        html: opts.html,
        plainText: opts.text,
      },
      recipients: {
        to: [{ address: opts.to }],
      },
    };

    // Utilise le lazy loader
    const client = getEmailClient();
    const poller = await client.beginSend(message);
    const response = await poller.pollUntilDone();
    
    console.log("Email sent:", response.id);
    
    // Mapping Azure (id) -> Compatibilité AWS SES (messageId)
    return {
      messageId: response.id,
      status: response.status
    };
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
}

// Tes templates (inchangés)
export function inviteEmailTemplate(params: {
  firstName?: string | null;
  appUrl: string;
  token: string;
  validityHours?: number;
}) {
  const validity = params.validityHours ?? 24;
  const url = `${params.appUrl.replace(/\/$/, "")}/auth/invite?token=${encodeURIComponent(params.token)}`;
  const greeting = params.firstName ? `Bonjour ${params.firstName},` : "Bonjour,";
  const text = `${greeting}\n\nVotre compte est prêt. Cliquez pour activer et définir votre mot de passe : ${url}\n\nCe lien est valable ${validity}h.`;

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
    <p>${greeting}</p>
    <p>Votre compte est prêt. Cliquez pour activer et définir votre mot de passe.</p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block;padding:12px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">
        Activer mon compte
      </a>
    </p>
    <p>Ce lien est valable ${validity}h. S'il a expiré, répondez à cet email pour en recevoir un nouveau.</p>
  </div>`;

  return { text, html };
}

export function claimApprovedEmailTemplate(params: {
  firstName: string;
  businessName: string;
  dashboardUrl: string;
}) {
  const greeting = `Bonjour ${params.firstName},`;
  const text = `${greeting}\n\nFélicitations ! Votre revendication pour l'entreprise "${params.businessName}" a été approuvée.\n\nAccédez à votre tableau de bord : ${params.dashboardUrl}\n\nCordialement,\nL'équipe`;

  const html = `
  <div style="font-family: system-ui; line-height:1.5; max-width:600px; margin:0 auto; padding:20px;">
    <h1 style="color:#111;">Revendication approuvée !</h1>
    <p>${greeting}</p>
    <p>Félicitations ! Votre revendication pour <strong>${params.businessName}</strong> a été approuvée.</p>
    <div style="margin:32px 0;">
      <a href="${params.dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">
        Accéder au tableau de bord
      </a>
    </div>
  </div>`;

  return { text, html };
}