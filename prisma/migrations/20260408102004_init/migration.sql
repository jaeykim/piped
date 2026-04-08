-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'influencer');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('crawling', 'analyzed', 'generating', 'ready', 'error');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('analysis', 'copy', 'creatives', 'campaigns', 'affiliates');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('influencer', 'meta', 'google');

-- CreateEnum
CREATE TYPE "CopyType" AS ENUM ('headline', 'description_short', 'description_long', 'ad_meta', 'ad_google', 'social', 'cta');

-- CreateEnum
CREATE TYPE "CreativeStatus" AS ENUM ('generating', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "CampaignPlatform" AS ENUM ('meta', 'google');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'pending', 'active', 'paused', 'completed', 'archived', 'error');

-- CreateEnum
CREATE TYPE "CampaignObjective" AS ENUM ('traffic', 'conversions', 'awareness');

-- CreateEnum
CREATE TYPE "OptimizerKind" AS ENUM ('noop', 'pause', 'scale_budget', 'skip', 'error');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('active', 'paused', 'closed');

-- CreateEnum
CREATE TYPE "AffiliateEventType" AS ENUM ('click', 'conversion');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "photoURL" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'owner',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "metaAccessToken" TEXT,
    "metaAdAccountId" TEXT,
    "metaExpiresAt" TIMESTAMP(3),
    "metaConnectedAt" TIMESTAMP(3),
    "googleRefreshToken" TEXT,
    "googleCustomerId" TEXT,
    "cryptoNetwork" TEXT,
    "cryptoAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'crawling',
    "pipelineStage" "PipelineStage" NOT NULL DEFAULT 'analysis',
    "campaignType" "CampaignType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteAnalysis" (
    "projectId" TEXT NOT NULL,
    "rawHtmlUrl" TEXT,
    "extractedText" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "ogImage" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "keywords" TEXT,
    "productName" TEXT NOT NULL,
    "valueProposition" TEXT NOT NULL,
    "targetAudience" TEXT[],
    "keyFeatures" TEXT[],
    "tone" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "brandColors" TEXT[],
    "logoUrl" TEXT,
    "screenshots" TEXT[],
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteAnalysis_pkey" PRIMARY KEY ("projectId")
);

-- CreateTable
CREATE TABLE "CopyVariant" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "CopyType" NOT NULL,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isFavorited" BOOLEAN NOT NULL DEFAULT false,
    "editedContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopyVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "subject" TEXT,
    "overlayText" TEXT,
    "status" "CreativeStatus" NOT NULL DEFAULT 'generating',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Creative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "ownerId" TEXT NOT NULL,
    "platform" "CampaignPlatform" NOT NULL,
    "platformCampaignId" TEXT,
    "platformAdSetId" TEXT,
    "platformAdId" TEXT,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "objective" "CampaignObjective" NOT NULL DEFAULT 'traffic',
    "budgetAmount" DOUBLE PRECISION NOT NULL,
    "budgetCurrency" TEXT NOT NULL DEFAULT 'USD',
    "budgetType" TEXT NOT NULL DEFAULT 'daily',
    "originalDailyBudget" DOUBLE PRECISION,
    "ageMin" INTEGER NOT NULL DEFAULT 18,
    "ageMax" INTEGER NOT NULL DEFAULT 65,
    "genders" TEXT[],
    "locations" TEXT[],
    "interests" TEXT[],
    "targetRoas" DOUBLE PRECISION,
    "optimizationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "selectedCopyIds" TEXT[],
    "selectedCreativeIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationLog" (
    "id" TEXT NOT NULL,
    "campaignDocId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "OptimizerKind" NOT NULL,
    "reason" TEXT NOT NULL,
    "recentRoas" DOUBLE PRECISION,
    "recentSpend" DOUBLE PRECISION,
    "targetRoas" DOUBLE PRECISION,
    "nextDailyBudget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "commissionValue" DOUBLE PRECISION NOT NULL,
    "cookieDurationDays" INTEGER NOT NULL DEFAULT 30,
    "status" "ProgramStatus" NOT NULL DEFAULT 'active',
    "totalAffiliates" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateEvent" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "type" "AffiliateEventType" NOT NULL,
    "conversionValue" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "eventType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "paymentDetails" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMetricSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_ownerId_createdAt_idx" ON "Project"("ownerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CopyVariant_projectId_createdAt_idx" ON "CopyVariant"("projectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Creative_projectId_createdAt_idx" ON "Creative"("projectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Campaign_ownerId_createdAt_idx" ON "Campaign"("ownerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Campaign_platform_optimizationEnabled_idx" ON "Campaign"("platform", "optimizationEnabled");

-- CreateIndex
CREATE INDEX "OptimizationLog_campaignDocId_createdAt_idx" ON "OptimizationLog"("campaignDocId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OptimizationLog_ownerId_createdAt_idx" ON "OptimizationLog"("ownerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AffiliateProgram_ownerId_idx" ON "AffiliateProgram"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_code_key" ON "AffiliateLink"("code");

-- CreateIndex
CREATE INDEX "AffiliateLink_programId_idx" ON "AffiliateLink"("programId");

-- CreateIndex
CREATE INDEX "AffiliateLink_influencerId_idx" ON "AffiliateLink"("influencerId");

-- CreateIndex
CREATE INDEX "AffiliateEvent_linkId_createdAt_idx" ON "AffiliateEvent"("linkId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AffiliateEvent_programId_createdAt_idx" ON "AffiliateEvent"("programId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PayoutRequest_influencerId_createdAt_idx" ON "PayoutRequest"("influencerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CampaignMetricSnapshot_campaignId_date_idx" ON "CampaignMetricSnapshot"("campaignId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMetricSnapshot_campaignId_date_key" ON "CampaignMetricSnapshot"("campaignId", "date");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAnalysis" ADD CONSTRAINT "SiteAnalysis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopyVariant" ADD CONSTRAINT "CopyVariant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creative" ADD CONSTRAINT "Creative_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationLog" ADD CONSTRAINT "OptimizationLog_campaignDocId_fkey" FOREIGN KEY ("campaignDocId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationLog" ADD CONSTRAINT "OptimizationLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AffiliateProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateEvent" ADD CONSTRAINT "AffiliateEvent_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "AffiliateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateEvent" ADD CONSTRAINT "AffiliateEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AffiliateProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
