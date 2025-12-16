import { prisma } from "@/lib/prisma";

async function updateConvertedFromLead() {
  try {
    // Update businesses that are pending verification and have approved claim status
    // These are likely converted from leads
    const result = await prisma.businesses.updateMany({
      where: {
        status: "pending_verification",
        claim_status: "approved",
        converted_from_lead: false, // Only update those not already set
      },
      data: {
        converted_from_lead: true,
      },
    });

    console.log(
      `Updated ${result.count} businesses to set converted_from_lead = true`
    );

    // Check the specific business from logs
    const specificBusiness = await prisma.businesses.findUnique({
      where: { id: "d82233bb-dfc0-43d6-875e-be74b87b5368" },
      include: {
        business_verifications: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (specificBusiness) {
      console.log("Specific business details:");
      console.log(`- ID: ${specificBusiness.id}`);
      console.log(
        `- Converted from lead: ${specificBusiness.converted_from_lead}`
      );
      console.log(`- Status: ${specificBusiness.status}`);
      console.log(`- Claim status: ${specificBusiness.claim_status}`);
      if (specificBusiness.business_verifications.length > 0) {
        const verif = specificBusiness.business_verifications[0];
        console.log(`- Verification status: ${verif.status}`);
        console.log(`- Has RC doc: ${!!verif.rc_document_url}`);
        console.log(`- Has ID front: ${!!verif.id_document_front_url}`);
        console.log(`- Has ID back: ${!!verif.id_document_back_url}`);
      } else {
        console.log("- No verification record");
      }
    }

    // Also check if there are any businesses with verification records that should be marked
    const businessesWithVerification = await prisma.businesses.findMany({
      where: {
        business_verifications: {
          some: {},
        },
        converted_from_lead: false,
      },
      select: {
        id: true,
        legal_name: true,
        email: true,
      },
    });

    if (businessesWithVerification.length > 0) {
      console.log(
        "Businesses with verification but not marked as converted from lead:"
      );
      businessesWithVerification.forEach((b) =>
        console.log(`- ${b.id}: ${b.legal_name} (${b.email})`)
      );
    }
  } catch (error) {
    console.error("Error updating businesses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateConvertedFromLead();
