import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import EmailProvider from "next-auth/providers/email";
import type { AuthOptions } from "next-auth";

export const authConfig: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.MAILTRAP_HOST!,
        port: Number(process.env.MAILTRAP_PORT),
        auth: {
          user: process.env.MAILTRAP_USER!,
          pass: process.env.MAILTRAP_PASS!,
        },
      },
      from: process.env.EMAIL_FROM!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  cookies: {
    sessionToken: {
      name: "next_auth_session",
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch roles from DB when user logs in
        const userRoles = await prisma.user_roles.findMany({
          where: { user_id: user.id },
          include: { roles: true }
        });
        token.roles = userRoles.map(ur => ur.roles.code);
        // Find businessId
        const special = userRoles.find((ur) => ur.business_id === "00000000-0000-0000-0000-000000000000");
        token.businessId = special ? special.business_id : (userRoles.length > 0 ? userRoles[0].business_id : "");
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).roles = token.roles;
        (session.user as any).businessId = token.businessId;
      }
      return session;
    }
  }
};
