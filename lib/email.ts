import nodemailer from "nodemailer";

// Configuration SMTP pour MailDev
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 1025),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  tls: {
    // Ne pas échouer sur les certificats auto-signés en développement
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@example.com";
const EMAIL_TEST_TO = process.env.EMAIL_TEST_TO || "test@example.com";

// Log SMTP configuration (without sensitive data)
console.log('📧 SMTP Configuration:', {
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 1025,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? 'configured' : 'not configured'
});

// Function to send a test email
export async function sendTestEmail() {
  // Ne pas envoyer d'emails pendant le build
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'test') {
    console.log('Skipping test email during build or test environment');
    return { success: true, messageId: 'skipped-during-build' };
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
        <p>If you're seeing this, email sending is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });

    console.log("Test email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending test email:", error);
    throw error;
  }
}

// Function to send a generic email
export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string; category?: string; sandbox?: boolean }) {
  console.log('📧 Attempting to send email:', {
    to: opts.to,
    subject: opts.subject,
    from: EMAIL_FROM
  });
  
  try {
    const result = await transporter.sendMail({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      // Mailtrap API supports category and sandbox; SMTP will ignore unknown fields
      headers: opts.category ? { "X-Category": opts.category } : undefined,
    });
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}

export function inviteEmailTemplate(params: { 
  firstName?: string | null; 
  appUrl: string; 
  token: string; 
  validityHours?: number 
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
  const text = `${greeting}

Félicitations ! Votre revendication pour l'entreprise "${params.businessName}" a été approuvée avec succès.

Vous pouvez dès maintenant accéder à votre tableau de bord professionnel pour gérer votre entreprise :
${params.dashboardUrl}

Cordialement,
L'équipe de support`;

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5; max-width:600px; margin:0 auto; padding:20px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">Revendication approuvée !</h1>
      <div style="height: 4px; width: 64px; background: #10B981; margin: 0 auto 16px;"></div>
    </div>
    
    <p>${greeting}</p>
    
    <p>Félicitations ! Votre revendication pour l'entreprise <strong>${params.businessName}</strong> a été approuvée avec succès.</p>
    
    <p>Vous pouvez dès maintenant accéder à votre tableau de bord professionnel pour gérer votre entreprise :</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${params.dashboardUrl}" 
         style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; 
                text-decoration: none; border-radius: 8px; font-weight: 500;">
        Accéder au tableau de bord
      </a>
    </div>
    
    <p>Si vous avez des questions ou avez besoin d'aide, n'hésitez pas à répondre à cet email.</p>
    
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
      <p>Cordialement,<br>L'équipe de support</p>
    </div>
  </div>`;
  
  return { text, html };
}

// Export the transporter for direct use if needed
export { transporter };
