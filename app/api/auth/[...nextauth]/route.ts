import NextAuth from "next-auth";
import { authConfig } from "@/lib/next-auth-config";

// Handler NextAuth avec la configuration importée
const handler = NextAuth(authConfig);

// Exports nécessaires pour l'App Router
export { handler as GET, handler as POST };


