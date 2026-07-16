-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "joinedAt" TIMESTAMP(3),
ADD COLUMN     "parentOrgId" TEXT;

-- CreateIndex
CREATE INDEX "Organization_parentOrgId_idx" ON "Organization"("parentOrgId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentOrgId_fkey" FOREIGN KEY ("parentOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
