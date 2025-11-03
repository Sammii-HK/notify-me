-- Platform-specific enhancements migration
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "platformSettings" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "csvData" TEXT;

-- Update existing accounts with Bluesky support
UPDATE "Account" SET "platforms" = '["x","instagram","threads","bluesky"]' WHERE "platforms" = '["x","threads","instagram"]';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "Account_websiteUrl_idx" ON "Account"("websiteUrl");
CREATE INDEX IF NOT EXISTS "Account_active_platforms_idx" ON "Account"("active", "platforms");
