-- Add Qoyod fields to customers table
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "qoyodCustomerId" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "syncedToQoyod" BOOLEAN DEFAULT false;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "customers_syncedToQoyod_idx" ON "customers"("syncedToQoyod");

-- Add Qoyod fields to settings table
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "qoyodDefaultBankAccountId" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "qoyodDefaultSalesAccountId" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "qoyodAutoSync" BOOLEAN DEFAULT true;
