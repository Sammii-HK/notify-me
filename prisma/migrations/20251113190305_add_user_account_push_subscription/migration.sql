-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "csvData" TEXT,
ADD COLUMN     "platformSettings" TEXT,
ADD COLUMN     "schedulerConfig" TEXT,
ADD COLUMN     "socialAccounts" TEXT,
ADD COLUMN     "websiteUrl" TEXT,
ALTER COLUMN "platforms" SET DEFAULT '["x","threads","bluesky","instagram","linkedin","tiktok"]';

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "succulentUserId" TEXT,
    "succulentEmail" TEXT,
    "name" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "metadata" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_succulentUserId_key" ON "User"("succulentUserId");

-- CreateIndex
CREATE INDEX "UserAccount_userId_idx" ON "UserAccount"("userId");

-- CreateIndex
CREATE INDEX "UserAccount_accountId_idx" ON "UserAccount"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_userId_accountId_key" ON "UserAccount"("userId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_active_idx" ON "PushSubscription"("active");

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
