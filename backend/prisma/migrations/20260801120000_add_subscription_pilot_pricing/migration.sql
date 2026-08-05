-- Per-partner pilot pricing (admin-configured). Additive + idempotent so it is
-- safe against databases already synced via `prisma db push`.

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "customMonthlyPrice" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "pilotNote" TEXT;
