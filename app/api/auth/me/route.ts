import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  // Fetch full user details using the ID from the validated context
  const user = await prisma.users.findUnique({
    where: { id: ctx.userId },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      avatar_url: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      ...user,
      roles: ctx.roles,
      permissions: ctx.permissions,
      assignments: ctx.assignments,
    },
  });
}
