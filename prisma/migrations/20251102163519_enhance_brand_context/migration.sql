-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "openaiApiKey" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "pillars" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "platforms" TEXT NOT NULL DEFAULT '["x","threads","bluesky"]',
    "postsPerWeek" INTEGER NOT NULL DEFAULT 14,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "brandVoice" TEXT,
    "targetAudience" TEXT,
    "brandValues" TEXT,
    "contentGuidelines" TEXT,
    "examplePosts" TEXT,
    "contextTokenLimit" INTEGER NOT NULL DEFAULT 8000,
    "monthlyGenCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostSet" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rawPrompt" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "postSetId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "platforms" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "mediaUrls" TEXT NOT NULL DEFAULT '[]',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "contentHash" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dedupe" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "title" TEXT,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dedupe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PostSet" ADD CONSTRAINT "PostSet_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_postSetId_fkey" FOREIGN KEY ("postSetId") REFERENCES "PostSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dedupe" ADD CONSTRAINT "Dedupe_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
