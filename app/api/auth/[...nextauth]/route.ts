import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";

export const authOptions = {
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

      async sendVerificationRequest({ identifier, url }) {
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
          to: identifier,
          from: process.env.EMAIL_FROM,
          subject: `Connexion à ${host}`,
          html: `
            <p>Cliquez ici pour vous connecter :</p>
            <p><a href="${url}">${url}</a></p>
          `,
        });
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },

  debug: process.env.NODE_ENV === "development",
};

// Handler NextAuth
const handler = NextAuth(authOptions);

// Exports nécessaires pour l’App Router
export { handler as GET, handler as POST };
