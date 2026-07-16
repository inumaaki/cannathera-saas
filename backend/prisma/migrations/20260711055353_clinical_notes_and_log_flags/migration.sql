-- DropForeignKey
ALTER TABLE "RedFlagHit" DROP CONSTRAINT "RedFlagHit_ruleId_fkey";

-- AlterTable
ALTER TABLE "RedFlagHit" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'submission',
ALTER COLUMN "submissionId" DROP NOT NULL,
ALTER COLUMN "ruleId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalNote_patientId_createdAt_idx" ON "ClinicalNote"("patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "RedFlagHit" ADD CONSTRAINT "RedFlagHit_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RedFlagRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
