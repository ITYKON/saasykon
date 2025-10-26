-- Create business_settings table
CREATE TABLE IF NOT EXISTS "business_settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "business_id" UUID NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "online_booking_enabled" BOOLEAN NOT NULL DEFAULT true,
  "automatic_confirmation" BOOLEAN NOT NULL DEFAULT true,
  "online_payment_enabled" BOOLEAN NOT NULL DEFAULT false,
  "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
  "sms_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
  "reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
  "reminder_hours_before" INTEGER NOT NULL DEFAULT 24,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "business_settings_business_id_key" UNIQUE ("business_id")
);

-- Create an index on business_id for faster lookups
CREATE INDEX IF NOT EXISTS "business_settings_business_id_idx" ON "business_settings" ("business_id");

-- Add a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_settings_modtime
BEFORE UPDATE ON "business_settings"
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
