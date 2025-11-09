-- Add claim fields to claims table
ALTER TABLE "claims" 
ADD COLUMN IF NOT EXISTS "rc_number" TEXT,
ADD COLUMN IF NOT EXISTS "rc_document_url" TEXT,
ADD COLUMN IF NOT EXISTS "id_document_front_url" TEXT,
ADD COLUMN IF NOT EXISTS "id_document_back_url" TEXT,
ADD COLUMN IF NOT EXISTS "claim_token" TEXT,
ADD COLUMN IF NOT EXISTS "token_expires_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "documents_submitted" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "documents_submitted_at" TIMESTAMPTZ(6);

-- Create unique index on claim_token
CREATE UNIQUE INDEX IF NOT EXISTS "idx_claim_token" ON "claims" ("claim_token");

-- Update existing claims to have documents_submitted = false if null
UPDATE "claims" 
SET "documents_submitted" = false
WHERE "documents_submitted" IS NULL;

