import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrPermission("CLAIMS_MANAGE");
  if (auth instanceof NextResponse) return auth;

  // Parse claim ID and validate
  let claimId: number;
  try {
    claimId = parseInt(params.id, 10);
    if (isNaN(claimId)) throw new Error('Invalid claim ID');
  } catch (error) {
    return NextResponse.json({ error: "Invalid claim ID" }, { status: 400 });
  }

  // Define request body type
  interface RequestBody {
    action: 'approve' | 'reject';
    notes?: string;
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, notes } = body;

  if (!action || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 });
  }

  const claim = await prisma.claims.findUnique({
    where: { id: claimId },
    include: {
      businesses: true,
      users: true,
    },
  });

  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  if (claim.status === "approved" || claim.status === "rejected") {
    return NextResponse.json({ error: "Claim already processed" }, { status: 400 });
  }

  // Check if all documents are submitted
  if (action === "approve" && !claim.documents_submitted) {
    return NextResponse.json({ error: "Cannot approve claim without all documents" }, { status: 400 });
  }

  // Update claim status
  await prisma.claims.update({
    where: { id: claimId },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      updated_at: new Date(),
    },
  });

  if (action === "approve") {
    // Update business owner
    await prisma.businesses.update({
      where: { id: claim.business_id },
      data: {
        owner_user_id: claim.user_id,
        claim_status: "approved",
        status: "active",
        updated_at: new Date(),
      },
    });

    // Ensure user has PRO role
    try {
      const proRole = await prisma.roles.findUnique({ where: { code: "PRO" } });
      if (proRole) {
        await prisma.user_roles.upsert({
          where: {
            user_id_role_id_business_id: {
              user_id: claim.user_id,
              role_id: proRole.id,
              business_id: claim.business_id,
            } as any,
          },
          update: {},
          create: {
            user_id: claim.user_id,
            role_id: proRole.id,
            business_id: claim.business_id,
          },
        } as any);
      }
    } catch {}

    // Update business verification status if exists
    const verification = await prisma.business_verifications.findFirst({
      where: { business_id: claim.business_id },
    });

    if (verification) {
      await prisma.business_verifications.update({
        where: { id: verification.id },
        data: {
          status: "approved" as const,
          reviewed_by: auth.userId,
          reviewed_at: new Date(),
          notes: notes || null,
        },
      });
    } else {
      // Create verification record
      await prisma.business_verifications.create({
        data: {
          business_id: claim.business_id,
          rc_number: claim.rc_number || null,
          rc_document_url: claim.rc_document_url || null,
          id_document_front_url: claim.id_document_front_url || null,
          id_document_back_url: claim.id_document_back_url || null,
          status: "approved" as const,
          reviewed_by: auth.userId,
          reviewed_at: new Date(),
          notes: notes || null,
        },
      });
    }

    // Create trial subscription (3 months)
    try {
      const freePlan = await prisma.plans.findFirst({
        where: { code: "FREE" },
      });

      if (freePlan) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months

        await prisma.subscriptions.create({
          data: {
            business_id: claim.business_id,
            plan_id: freePlan.id,
            status: "TRIALING" as const,
            current_period_start: now,
            current_period_end: trialEnd,
          },
        });
      }
    } catch {}

    // Event log
    await prisma.event_logs.create({
      data: {
        user_id: auth.userId,
        business_id: claim.business_id,
        event_name: "claim.approved",
        payload: { claim_id: claimId, reviewed_by: auth.userId, notes },
      },
    }).catch(() => {});
  } else {
    // Reject claim
    await prisma.businesses.update({
      where: { id: claim.business_id },
      data: {
        claim_status: "rejected",
        updated_at: new Date(),
      },
    });

    // Event log
    await prisma.event_logs.create({
      data: {
        user_id: auth.userId,
        business_id: claim.business_id,
        event_name: "claim.rejected",
        payload: { claim_id: claimId, reviewed_by: auth.userId, notes },
      },
    }).catch(() => {});
  }

  // Define response type
  interface ApiResponse {
    ok: boolean;
    message: string;
  }

  return NextResponse.json<ApiResponse>({
    ok: true,
    message: action === "approve" ? "Claim approved" : "Claim rejected",
  });
}

