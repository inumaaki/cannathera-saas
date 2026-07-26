-- CreateTable
CREATE TABLE "PartnerCode" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerCode_code_key" ON "PartnerCode"("code");

-- CreateIndex
CREATE INDEX "PartnerCode_orgId_idx" ON "PartnerCode"("orgId");

-- CreateIndex
CREATE INDEX "PartnerCode_code_idx" ON "PartnerCode"("code");

-- AddForeignKey
ALTER TABLE "PartnerCode" ADD CONSTRAINT "PartnerCode_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
