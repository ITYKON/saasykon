import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";
import { z } from "zod";

const onboardingSchema = z.object({
  registry: z.object({
    rc_number: z.string().nullable().optional(),
    registry_doc: z.string().url().nullable().optional(),
  }).optional(),
  identity: z.object({
    id_card_front: z.string().url().nullable().optional(),
    id_card_back: z.string().url().nullable().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof onboardingSchema>;
  try {
    const json = await req.json();
    const result = onboardingSchema.safeParse(json);
    if (!result.success) {
      // In this specific flow, we might want to be lenient or leniently ignore extra fields,
      // but strict structure is better. If verification fails, we can either error or use defaults.
      // Given the original code use "body?.registry?.rc_number", it implies optionality.
      // The schema handles optionality. Use data or minimal object.
       body = {};
    } else {
        body = result.data;
    }
  } catch {
      body = {};
  }

  // Find businesses owned by this user
  const owned = await prisma.businesses.findMany({ where: { owner_user_id: user.id }, select: { id: true } });

  // Update onboarding_completed flag and upsert verification docs if provided
  const tx: any[] = [];
  for (const b of owned) {
    tx.push(prisma.businesses.update({ where: { id: b.id }, data: { onboarding_completed: true, updated_at: new Date() } as any }));
    const rc_number = body?.registry?.rc_number || null;
    const rc_document_url = body?.registry?.registry_doc || null;
    const id_document_front_url = body?.identity?.id_card_front || null;
    const id_document_back_url = body?.identity?.id_card_back || null;
    if (rc_document_url || id_document_front_url || id_document_back_url || rc_number) {
      tx.push((async () => {
        const existing = await prisma.business_verifications.findFirst({ where: { business_id: b.id } });
        if (existing) {
          await prisma.business_verifications.update({
            where: { id: existing.id },
            data: {
              rc_number,
              rc_document_url,
              id_document_front_url,
              id_document_back_url,
              updated_at: new Date(),
            },
          });
        } else {
          await prisma.business_verifications.create({
            data: {
              business_id: b.id,
              rc_number,
              rc_document_url,
              id_document_front_url,
              id_document_back_url,
            },
          });
        }
      })());
    }
  }
  if (tx.length) await Promise.all(tx);

  const res = NextResponse.json({ ok: true, businesses: owned.map(o => o.id) });
  const expires = new Date(Date.now() + 365*24*60*60*1000);
  res.cookies.set("onboarding_done", "true", { httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
  return res;
}
