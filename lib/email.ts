import * as nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

const MAILTRAP_HOST = process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io";
const MAILTRAP_PORT = Number(process.env.MAILTRAP_PORT || 587);
const MAILTRAP_USER = process.env.MAILTRAP_USER || "";
const MAILTRAP_PASS = process.env.MAILTRAP_PASS || "";
const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN || "";
const MAILTRAP_USE_SMTP = process.env.MAILTRAP_USE_SMTP === "true";
const MAILTRAP_TEST_INBOX_ID = process.env.MAILTRAP_TEST_INBOX_ID ? Number(process.env.MAILTRAP_TEST_INBOX_ID) : undefined;
const MAILTRAP_SANDBOX = process.env.MAILTRAP_SANDBOX === "true";
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@example.com";

// Prefer Mailtrap API transport if token is provided; fallback to SMTP
export const transporter = MAILTRAP_TOKEN && !MAILTRAP_USE_SMTP
  ? nodemailer.createTransport(
      MailtrapTransport({ token: MAILTRAP_TOKEN, testInboxId: MAILTRAP_TEST_INBOX_ID })
    )
  : nodemailer.createTransport({
      host: MAILTRAP_HOST,
      port: MAILTRAP_PORT,
      auth: {
        user: MAILTRAP_USER,
        pass: MAILTRAP_PASS,
      },
    });

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string; category?: string; sandbox?: boolean }) {
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    // Mailtrap API supports category and sandbox; SMTP will ignore unknown fields
    category: opts.category,
    sandbox: typeof opts.sandbox === "boolean" ? opts.sandbox : MAILTRAP_SANDBOX || undefined,
    headers: opts.category ? { "X-Category": opts.category } : undefined,
  });
}

export function inviteEmailTemplate(params: { firstName?: string | null; appUrl: string; token: string; validityHours?: number }) {
  const validity = params.validityHours ?? 24;
  const url = `${params.appUrl.replace(/\/$/, "")}/auth/invite?token=${encodeURIComponent(params.token)}`;
  const greeting = params.firstName ? `Bonjour ${params.firstName},` : "Bonjour,";
  const text = `${greeting}\n\nVotre compte est prêt. Cliquez pour activer et définir votre mot de passe : ${url}\n\nCe lien est valable ${validity}h.`;
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
    <p>${greeting}</p>
    <p>Votre compte est prêt. Cliquez pour activer et définir votre mot de passe.</p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block;padding:12px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">Activer mon compte</a>
    </p>
    <p>Ce lien est valable ${validity}h. S'il a expiré, répondez à cet email pour en recevoir un nouveau.</p>
  </div>`;
  return { text, html };
}
