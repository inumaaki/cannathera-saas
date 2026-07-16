-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "orgRole" TEXT NOT NULL DEFAULT 'DOCTOR',
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
