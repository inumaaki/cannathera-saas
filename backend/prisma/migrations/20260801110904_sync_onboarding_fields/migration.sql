-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Locale" ADD VALUE IF NOT EXISTS 'uk';
ALTER TYPE "Locale" ADD VALUE IF NOT EXISTS 'ary';
ALTER TYPE "Locale" ADD VALUE IF NOT EXISTS 'ru';
ALTER TYPE "Locale" ADD VALUE IF NOT EXISTS 'pl';
ALTER TYPE "Locale" ADD VALUE IF NOT EXISTS 'ro';

-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "baselineMetrics" JSONB,
ADD COLUMN IF NOT EXISTS "complaintsDescription" TEXT,
ADD COLUMN IF NOT EXISTS "hasActiveSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "mainComplaints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "therapyGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "TherapyLog" ADD COLUMN IF NOT EXISTS "batchNumber" TEXT,
ADD COLUMN IF NOT EXISTS "consumptionMethod" TEXT,
ADD COLUMN IF NOT EXISTS "manufacturer" TEXT;
