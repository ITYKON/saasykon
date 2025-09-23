import { destroySessionFromRequestCookie } from "@/lib/auth";

export async function POST() {
  return await destroySessionFromRequestCookie();
}


