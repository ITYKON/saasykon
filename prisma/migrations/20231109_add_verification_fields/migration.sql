-- Ajout des champs de vérification à la table businesses
ALTER TABLE "businesses" 
ADD COLUMN "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "trial_ends_at" TIMESTAMPTZ,
ADD COLUMN "last_reminder_sent_at" TIMESTAMPTZ;

-- Mise à jour de l'enum verification_status
ALTER TYPE "verification_status" ADD VALUE IF NOT EXISTS 'PENDING';

-- Création d'un index pour les recherches par statut de vérification
CREATE INDEX IF NOT EXISTS "businesses_verification_status_idx" ON "businesses" ("verification_status");

-- Mise à jour des entreprises existantes
UPDATE "businesses" 
SET "verification_status" = 'PENDING'
WHERE "verification_status" IS NULL;
