import { NextResponse } from "next/server";
import { getAuthUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  const file = form.get("file") as unknown as File | null;
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
  if (!("type" in file) || !validTypes.includes((file as any).type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const arrayBuffer = await (file as any).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = (file as any).type === "image/png" ? ".png" : (file as any).type === "image/webp" ? ".webp" : (file as any).type === "image/gif" ? ".gif" : ".jpg";
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${user.id}_${Date.now()}${ext}`;
  const filepath = path.join(uploadsDir, filename);
  await fs.writeFile(filepath, buffer);

  const urlPath = `/uploads/avatars/${filename}`;
  await prisma.users.update({ where: { id: user.id }, data: { avatar_url: urlPath } });

  return NextResponse.json({ url: urlPath });
}
