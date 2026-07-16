-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "pharmacyId" TEXT;

-- CreateIndex
CREATE INDEX "PatientProfile_pharmacyId_idx" ON "PatientProfile"("pharmacyId");

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: patients whose single org was a PHARMACY move into the new column,
-- so `orgId` means "practice" from here on and nothing is lost.
UPDATE "PatientProfile" p
SET "pharmacyId" = p."orgId",
    "orgId"      = NULL
FROM "Organization" o
WHERE o."id" = p."orgId"
  AND o."type" = 'PHARMACY';
