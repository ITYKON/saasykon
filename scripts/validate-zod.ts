import { searchSimpleSchema } from "../app/api/search-simple/schemas";
import { createSubscriptionSchema, updateSubscriptionSchema } from "../app/api/pro/subscription/schemas";
import { salonSchema } from "../app/api/admin/salons/schemas";
import { availabilitySchema } from "../app/api/salon/[id]/timeslots/check-availability/schemas";
import { verificationSchema } from "../app/api/pro/verification/schemas";
import { createRoleSchema, updateRoleSchema } from "../app/api/admin/roles/schemas";
import { assignSchema, unassignSchema } from "../app/api/admin/roles/assign/schemas";
import { v4 as uuidv4 } from "uuid"; // Need uuid for some validations

async function runTests() {
  console.log("Starting Zod Validation Tests...\n");


  // --- Test searchSimpleSchema ---
  console.log("Testing searchSimpleSchema...");
  
  const validSearch = {
    q: "coiffeur",
    location: "Paris",
    page: 1,
    pageSize: 20
  };
  
  const parsedValid = searchSimpleSchema.safeParse(validSearch);
  if (parsedValid.success) {
    console.log("✅ Valid search payload passed");
  } else {
    console.error("❌ Valid search payload failed", parsedValid.error);
  }

  const invalidSearch = {
    page: -1, // Invalid
    pageSize: 200 // Invalid (max 100)
  };
  
  const parsedInvalid = searchSimpleSchema.safeParse(invalidSearch);
  if (!parsedInvalid.success) {
    console.log("✅ Invalid search payload correctly rejected");
    // console.log(parsedInvalid.error.format());
  } else {
    console.error("❌ Invalid search payload should have failed but passed");
  }
  console.log("");

  // --- Test createSubscriptionSchema ---
  console.log("Testing createSubscriptionSchema...");
  
  const validSub = { plan_id: 1 };
  const parsedSub = createSubscriptionSchema.safeParse(validSub);
  if (parsedSub.success) {
    console.log("✅ Valid subscription payload passed");
  } else {
    console.error("❌ Valid subscription payload failed", parsedSub.error);
  }

  const invalidSub = { plan_id: "1" }; // Expected number
  const parsedInvalidSub = createSubscriptionSchema.safeParse(invalidSub);
  if (!parsedInvalidSub.success) {
    console.log("✅ Invalid subscription payload (string id) correctly rejected");
  } else {
    console.error("❌ Invalid subscription payload should have failed");
  }
  console.log("");

  // --- Test updateSubscriptionSchema ---
  console.log("Testing updateSubscriptionSchema...");
  
  const validUpdate = { action: "cancel" };
  const parsedUpdate = updateSubscriptionSchema.safeParse(validUpdate);
  if (parsedUpdate.success) {
    console.log("✅ Valid update payload passed");
  } else {
    console.error("❌ Valid update payload failed", parsedUpdate.error);
  }

  const invalidUpdate = { action: "delete" }; // Invalid enum
  const parsedInvalidUpdate = updateSubscriptionSchema.safeParse(invalidUpdate);
  if (!parsedInvalidUpdate.success) {
    console.log("✅ Invalid update payload (wrong action) correctly rejected");
  } else {
    console.error("❌ Invalid update payload should have failed");
  }
  

  // --- Test salonSchema ---
  console.log("Testing salonSchema...");
  
  const validSalon = {
    legal_name: "My Salon SARL",
    public_name: "My Beautiful Salon",
    email: "contact@mysalon.com",
    phone: "0123456789", // min 8
    location: "Paris" // required
  };
  
  const parsedSalon = salonSchema.safeParse(validSalon);
  if (parsedSalon.success) {
    console.log("✅ Valid salon payload passed");
  } else {
    console.error("❌ Valid salon payload failed", parsedSalon.error);
  }

  const invalidSalon = {
    legal_name: "A", // too short (min 2)
    public_name: "My Salon",
    email: "not-an-email", // invalid email
    phone: "123", // too short
    // location missing
  };
  
  const parsedInvalidSalon = salonSchema.safeParse(invalidSalon);
  if (!parsedInvalidSalon.success) {
    console.log("✅ Invalid salon payload correctly rejected (multiple errors expected)");
    // parsedInvalidSalon.error.errors.forEach(e => console.log(`   - ${e.path}: ${e.message}`));
  } else {
    console.error("❌ Invalid salon payload should have failed");
  }

  // --- Test availabilitySchema ---
  console.log("Testing availabilitySchema...");
  const validAvail = {
    starts_at: "2023-01-01T10:00:00Z",
    ends_at: "2023-01-01T11:00:00Z",
    employee_id: uuidv4()
  };
  const parsedAvail = availabilitySchema.safeParse(validAvail);
  if (parsedAvail.success) console.log("✅ Valid availability payload passed");
  else console.error("❌ Valid availability payload failed", parsedAvail.error);

  const invalidAvail = { starts_at: "not-a-date" };
  if (!availabilitySchema.safeParse(invalidAvail).success) console.log("✅ Invalid availability payload rejected");
  else console.error("❌ Invalid availability payload passed");


  // --- Test verificationSchema ---
  console.log("\nTesting verificationSchema...");
  const validVerif = {
    rc_number: "123456",
    rc_document_url: "https://example.com/doc.pdf"
  };
  const parsedVerif = verificationSchema.safeParse(validVerif);
  if (parsedVerif.success) console.log("✅ Valid verification payload passed");
  else console.error("❌ Valid verification payload failed", parsedVerif.error);

  const invalidVerif = { rc_document_url: "not-a-url" };
  if (!verificationSchema.safeParse(invalidVerif).success) console.log("✅ Invalid verification payload rejected");
  else console.error("❌ Invalid verification payload passed");


  // --- Test Role Schemas ---
  console.log("\nTesting Role Schemas...");
  const validRole = { name: "Manager", permissions: ["manage_users"] };
  if (createRoleSchema.safeParse(validRole).success) console.log("✅ Valid createRole payload passed");
  else console.error("❌ Valid createRole payload failed");

  const invalidRole = { name: "A" }; // Too short
  if (!createRoleSchema.safeParse(invalidRole).success) console.log("✅ Invalid createRole payload rejected");
  else console.error("❌ Invalid createRole payload passed");


  // --- Test Assign/Unassign Schemas ---
  console.log("\nTesting Assign Schemas...");
  const validAssign = { email: "test@test.com", roleCode: "admin", business_id: uuidv4() };
  if (assignSchema.safeParse(validAssign).success) console.log("✅ Valid assign payload passed");
  else console.error("❌ Valid assign payload failed");

  const invalidAssign = { email: "bad-email", roleCode: "a" };
  if (!assignSchema.safeParse(invalidAssign).success) console.log("✅ Invalid assign payload rejected");
  else console.error("❌ Invalid assign payload passed");

  console.log("\nAll tests completed.");
  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
