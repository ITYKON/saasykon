import nodemailer from "nodemailer";

// Détection environnement
const isProduction = process.env.NODE_ENV === "production";
const useSES = process.env.EMAIL_PROVIDER === "ses";

// Configuration du transport (SES SMTP ou MailDev)
let transporter: nodemailer.Transporter;

if (useSES && isProduction) {
  // Production: Amazon SES via SMTP
  transporter = nodemailer.createTransport({
    host: "email-smtp.eu-central-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.AWS_ACCESS_KEY_ID!,
      pass: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
  console.log("Email Provider: Amazon SES SMTP (Production)");
} else {
  // Développement: MailDev/SMTP
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT || 1025),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
  console.log("Email Provider: SMTP/MailDev (Development)");
}

// Configuration
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@example.com";
const EMAIL_TEST_TO = process.env.EMAIL_TEST_TO || "test@example.com";

// Log SMTP configuration (without sensitive data)


// Function to send a test email
export async function sendTestEmail() {
  // Ne pas envoyer d'emails pendant le build
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NODE_ENV === "test"
  ) {

    return { success: true, messageId: "skipped-during-build" };
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TEST_TO,
      subject: "Test Email from SaaS YKON",
      text: "This is a test email sent from SaaS YKON application.",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email sent from SaaS YKON application.</p>
        <p>Provider: ${useSES && isProduction ? "Amazon SES" : "SMTP/MailDev"}</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });


    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending test email:", error);
    throw error;
  }
}

// Fonction principale (CORRIGÉE - ajout de sandbox)
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  category?: string;
  sandbox?: boolean; // <-- AJOUTÉ pour compatibilité
}) {


  try {
    const result = await transporter.sendMail({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      headers: opts.category ? { "X-Category": opts.category } : undefined,
    });

  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}

// Templates (inchangés)
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

export { transporter };