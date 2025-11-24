import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";

// Vérification des variables d'environnement requises
const requiredEnvVars = [
  'MAILTRAP_HOST',
  'MAILTRAP_PORT',
  'MAILTRAP_USER',
  'MAILTRAP_PASS',
  'EMAIL_FROM',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error("Variables d'environnement manquantes pour NextAuth:", missingVars);
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Configuration manquante: ${missingVars.join(', ')}`);
  }
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.MAILTRAP_HOST,
        port: Number(process.env.MAILTRAP_PORT),
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASS,
        },
      },
      from: process.env.EMAIL_FROM,

      sendVerificationRequest: async ({
        identifier: email,
        url,
      }) => {
        // ⚠️ Transporter créé ici !
        const transporter = nodemailer.createTransport({
          host: process.env.MAILTRAP_HOST,
          port: Number(process.env.MAILTRAP_PORT),
          secure: false,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
          },
        });

        const { host } = new URL(url);

        await transporter.sendMail({
          to: email,
          from: process.env.EMAIL_FROM,
          subject: `Connexion à ${host}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Connexion à ${host}</h2>
              <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
              <p>
                <a href="${url}" 
                   style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
                  Se connecter
                </a>
              </p>
              <p>Ou copiez/collez ce lien :</p>
              <p><a href="${url}">${url}</a></p>
            </div>
          `,
        });
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
