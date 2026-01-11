-- AlterTable
ALTER TABLE "business_leads" ADD COLUMN     "archived_at" TIMESTAMPTZ(6),
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);
