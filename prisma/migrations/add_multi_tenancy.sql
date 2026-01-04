-- Migration: Add Multi-Tenancy Support
-- Run this SQL directly on your PostgreSQL database

-- 1. Add ownerId to users table (nullable for hall owners, references own table)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "commercialRegNo" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vatRegNo" TEXT;

-- 2. Add ownerId to halls table
ALTER TABLE "halls" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- 3. Add ownerId to customers table (make it nullable first, then update)
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- 4. Add ownerId to bookings table
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- 5. Add ownerId to invoices table
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- 6. Add ownerId to payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- 7. Modify settings table - add ownerId and create unique constraint
-- First drop old primary key constraint on 'system' id
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_pkey";
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
-- Make id auto-generate if not already
ALTER TABLE "settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS "users_ownerId_idx" ON "users"("ownerId");
CREATE INDEX IF NOT EXISTS "halls_ownerId_idx" ON "halls"("ownerId");
CREATE INDEX IF NOT EXISTS "customers_ownerId_idx" ON "customers"("ownerId");
CREATE INDEX IF NOT EXISTS "bookings_ownerId_idx" ON "bookings"("ownerId");
CREATE INDEX IF NOT EXISTS "invoices_ownerId_idx" ON "invoices"("ownerId");
CREATE INDEX IF NOT EXISTS "payments_ownerId_idx" ON "payments"("ownerId");

-- 9. Add unique constraint on settings.ownerId
CREATE UNIQUE INDEX IF NOT EXISTS "settings_ownerId_key" ON "settings"("ownerId");

-- 10. Add foreign key constraints (optional - can be added later)
-- ALTER TABLE "users" ADD CONSTRAINT "users_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL;
-- ALTER TABLE "halls" ADD CONSTRAINT "halls_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE;
-- etc.

-- Done! After running this, regenerate Prisma client:
-- npx prisma generate
