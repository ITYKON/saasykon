import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ ok: true }); // do not leak

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: true });

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    await prisma.password_reset_tokens.create({
      data: { user_id: user.id, token, expires_at: expiresAt },
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    const emailContent = {
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Réinitialisation de mot de passe</h2>
          <p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :</p>
          <p>
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Ou copiez ce lien dans votre navigateur :</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p style="color: #666; font-size: 0.9em;">
            Ce lien est valable 30 minutes. Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email.
          </p>
        </div>
      `,
      text: `Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant : ${resetUrl}\n\nCe lien est valable 30 minutes.`
    };

    if (process.env.NODE_ENV === 'production') {
      await sendEmail(emailContent);
    } else {
      // En développement, on log le lien dans la console
      // console.log('Lien de réinitialisation (désactivé en développement) :', resetUrl);
      // On envoie quand même l'email si les identifiants Mailtrap sont configurés
      if (process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS) {
        await sendEmail(emailContent);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Erreur lors de la demande de réinitialisation :', e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


