import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireAdminOrPermission } from "@/lib/authorization";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const authCheck = await requireAdminOrPermission("salons");
  if (authCheck instanceof NextResponse) return authCheck;
  // Gestion upload image (logo/couverture)
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name);
  const fileName = `${Date.now()}${ext}`;
  const filePath = path.join(process.cwd(), "public", "uploads", fileName);
  await writeFile(filePath, buffer);
  return NextResponse.json({ url: `/uploads/${fileName}` });
}
