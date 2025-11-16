-- Create business_ownership_transfers table
CREATE TABLE IF NOT EXISTS "business_ownership_transfers" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "current_owner_id" TEXT NOT NULL,
    "new_owner_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" TEXT,
    "review_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "business_ownership_transfers_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraints
ALTER TABLE "business_ownership_transfers" ADD CONSTRAINT "business_ownership_transfers_business_id_fkey" 
FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NoAction;

ALTER TABLE "business_ownership_transfers" ADD CONSTRAINT "business_ownership_transfers_current_owner_id_fkey" 
FOREIGN KEY ("current_owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NoAction;

ALTER TABLE "business_ownership_transfers" ADD CONSTRAINT "business_ownership_transfers_new_owner_id_fkey" 
FOREIGN KEY ("new_owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NoAction;

ALTER TABLE "business_ownership_transfers" ADD CONSTRAINT "business_ownership_transfers_reviewed_by_fkey" 
FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NoAction;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "business_ownership_transfers_business_id_idx" ON "business_ownership_transfers"("business_id");
CREATE INDEX IF NOT EXISTS "business_ownership_transfers_current_owner_id_idx" ON "business_ownership_transfers"("current_owner_id");
CREATE INDEX IF NOT EXISTS "business_ownership_transfers_new_owner_id_idx" ON "business_ownership_transfers"("new_owner_id");
CREATE INDEX IF NOT EXISTS "business_ownership_transfers_status_idx" ON "business_ownership_transfers"("status");
