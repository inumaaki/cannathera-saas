-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Locale" ADD VALUE 'uk';
ALTER TYPE "Locale" ADD VALUE 'ary';
ALTER TYPE "Locale" ADD VALUE 'ru';
ALTER TYPE "Locale" ADD VALUE 'pl';
ALTER TYPE "Locale" ADD VALUE 'ro';

-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "address" TEXT,
ADD COLUMN     "baselineMetrics" JSONB,
ADD COLUMN     "complaintsDescription" TEXT,
ADD COLUMN     "hasActiveSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mainComplaints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "therapyGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "TherapyLog" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "consumptionMethod" TEXT,
ADD COLUMN     "manufacturer" TEXT;
