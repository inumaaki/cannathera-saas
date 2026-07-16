-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRestockAt" TIMESTAMP(3),
ADD COLUMN     "orderedAt" TIMESTAMP(3),
ADD COLUMN     "reorderQty" DOUBLE PRECISION;
