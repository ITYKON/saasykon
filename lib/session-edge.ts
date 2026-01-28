import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "default_secret_fallback_12345");

export async function getAuthDataFromTokenEdge(token: string) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload) {
      console.log(`[EdgeAuth] JWT verified for userId: ${payload.userId}`)
      return {
        userId: payload.userId as string,
        roles: payload.roles as string[],
        businessId: payload.businessId as string
      };
    }
  } catch (err: any) {
    console.warn(`[EdgeAuth] JWT verification failed: ${err.message}. Secret present: ${!!process.env.NEXTAUTH_SECRET}`)
    // Fail silent for middleware
    return null;
  }
  return null;
}
