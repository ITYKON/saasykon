import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to public/uploads/salons
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "salons");
    await mkdir(uploadsDir, { recursive: true });

    const ext = (file.name?.split(".").pop() || "bin").toLowerCase();
    const safeExt = ext.substring(0, 6).replace(/[^a-z0-9]/g, "");
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${safeExt || "bin"}`;
    const fullPath = path.join(uploadsDir, filename);

    await writeFile(fullPath, buffer);

    const url = `/uploads/salons/${filename}`;
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}
