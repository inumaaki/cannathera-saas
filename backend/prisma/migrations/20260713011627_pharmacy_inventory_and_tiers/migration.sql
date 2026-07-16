-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "condition" TEXT,
ADD COLUMN     "lastReviewAt" TIMESTAMP(3),
ADD COLUMN     "packageTier" "SubscriptionTier" NOT NULL DEFAULT 'BASIC';

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "thc" DOUBLE PRECISION,
    "cbd" DOUBLE PRECISION,
    "stockLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'g',
    "safetyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "pendingOrder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryItem_orgId_idx" ON "InventoryItem"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_orgId_sku_key" ON "InventoryItem"("orgId", "sku");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
