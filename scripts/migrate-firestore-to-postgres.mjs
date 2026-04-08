#!/usr/bin/env node
// One-shot migration: pulls everything out of Firestore and stuffs it into
// the local Postgres via Prisma. Run with `node scripts/migrate-firestore-to-postgres.mjs`.
//
// Idempotent: each row uses the original Firestore doc ID, so re-running
// upserts instead of duplicating.

import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const fs = getFirestore();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const stats = {};
const bump = (k) => (stats[k] = (stats[k] || 0) + 1);

// ─── helpers ───
const ts = (v) => {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate();
  if (v._seconds != null) return new Date(v._seconds * 1000);
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") return new Date(v);
  return null;
};
const tsOrNow = (v) => ts(v) ?? new Date();
const str = (v) => (v == null ? "" : String(v));
const arr = (v) => (Array.isArray(v) ? v : []);

// ─── Users ───
async function migrateUsers() {
  const snap = await fs.collection("users").get();
  for (const doc of snap.docs) {
    const d = doc.data();
    try {
      await prisma.user.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          email: d.email || `${doc.id}@unknown.invalid`,
          displayName: d.displayName || "",
          photoURL: d.photoURL ?? null,
          role: d.role === "influencer" ? "influencer" : "owner",
          credits: typeof d.credits === "number" ? d.credits : 0,
          onboardingComplete: !!d.onboardingComplete,
          metaAccessToken: d.integrations?.meta?.accessToken ?? null,
          metaAdAccountId: d.integrations?.meta?.adAccountId ?? null,
          metaExpiresAt: ts(d.integrations?.meta?.expiresAt),
          metaConnectedAt: ts(d.integrations?.meta?.connectedAt),
          googleRefreshToken: d.integrations?.google?.refreshToken ?? null,
          googleCustomerId: d.integrations?.google?.customerId ?? null,
          cryptoNetwork: d.payoutSettings?.cryptoNetwork ?? null,
          cryptoAddress: d.payoutSettings?.cryptoAddress ?? null,
          createdAt: tsOrNow(d.createdAt),
          updatedAt: tsOrNow(d.updatedAt),
        },
      });
      bump("users");
    } catch (e) {
      console.error("user", doc.id, e.message);
    }
  }
}

// ─── Projects + nested analysis/copy/creatives ───
async function migrateProjects() {
  const snap = await fs.collection("projects").get();
  for (const doc of snap.docs) {
    const d = doc.data();
    if (!d.ownerId) continue;
    // Make sure the owner row exists (foreign key)
    const ownerExists = await prisma.user.findUnique({ where: { id: d.ownerId } });
    if (!ownerExists) {
      console.warn("skip project (no owner)", doc.id);
      continue;
    }
    try {
      await prisma.project.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          ownerId: d.ownerId,
          url: str(d.url),
          name: str(d.name),
          status: ["crawling", "analyzed", "generating", "ready", "error"].includes(d.status)
            ? d.status
            : "crawling",
          pipelineStage: [
            "analysis",
            "copy",
            "creatives",
            "campaigns",
            "affiliates",
          ].includes(d.pipelineStage)
            ? d.pipelineStage
            : "analysis",
          campaignType:
            d.campaignType && ["meta", "google", "influencer"].includes(d.campaignType)
              ? d.campaignType
              : null,
          createdAt: tsOrNow(d.createdAt),
          updatedAt: tsOrNow(d.updatedAt),
        },
      });
      bump("projects");

      // analysis/result
      const analysisDoc = await fs.doc(`projects/${doc.id}/analysis/result`).get();
      if (analysisDoc.exists) {
        const a = analysisDoc.data();
        await prisma.siteAnalysis.upsert({
          where: { projectId: doc.id },
          update: {},
          create: {
            projectId: doc.id,
            rawHtmlUrl: a.rawHtmlUrl ?? null,
            extractedText: str(a.extractedText),
            metaTitle: str(a.metaTags?.title),
            metaDescription: str(a.metaTags?.description),
            ogImage: a.metaTags?.ogImage ?? null,
            ogTitle: a.metaTags?.ogTitle ?? null,
            ogDescription: a.metaTags?.ogDescription ?? null,
            keywords: a.metaTags?.keywords ?? null,
            productName: str(a.productName),
            valueProposition: str(a.valueProposition),
            targetAudience: arr(a.targetAudience).map(String),
            keyFeatures: arr(a.keyFeatures).map(String),
            tone: str(a.tone),
            industry: str(a.industry),
            brandColors: arr(a.brandColors).map(String),
            logoUrl: a.logoUrl ?? null,
            screenshots: arr(a.screenshots).map(String),
            analyzedAt: tsOrNow(a.analyzedAt),
          },
        });
        bump("siteAnalysis");
      }

      // copyVariants
      const copySnap = await fs.collection(`projects/${doc.id}/copyVariants`).get();
      for (const c of copySnap.docs) {
        const cd = c.data();
        try {
          await prisma.copyVariant.upsert({
            where: { id: c.id },
            update: {},
            create: {
              id: c.id,
              projectId: doc.id,
              type: [
                "headline",
                "description_short",
                "description_long",
                "ad_meta",
                "ad_google",
                "social",
                "cta",
              ].includes(cd.type)
                ? cd.type
                : "headline",
              content: str(cd.content),
              isEdited: !!cd.isEdited,
              isFavorited: !!cd.isFavorited,
              editedContent: cd.editedContent ?? null,
              createdAt: tsOrNow(cd.createdAt),
            },
          });
          bump("copyVariants");
        } catch (e) {
          console.error("copy", c.id, e.message);
        }
      }

      // creatives
      const creativeSnap = await fs.collection(`projects/${doc.id}/creatives`).get();
      for (const c of creativeSnap.docs) {
        const cd = c.data();
        try {
          await prisma.creative.upsert({
            where: { id: c.id },
            update: {},
            create: {
              id: c.id,
              projectId: doc.id,
              imageUrl: str(cd.imageUrl),
              prompt: str(cd.prompt),
              size: str(cd.size || "1080x1080"),
              platform: str(cd.platform || "general"),
              concept: str(cd.concept || "benefit-driven"),
              subject: cd.subject ?? null,
              overlayText: cd.overlayText ?? null,
              status: ["generating", "ready", "failed"].includes(cd.status)
                ? cd.status
                : "ready",
              createdAt: tsOrNow(cd.createdAt),
            },
          });
          bump("creatives");
        } catch (e) {
          console.error("creative", c.id, e.message);
        }
      }
    } catch (e) {
      console.error("project", doc.id, e.message);
    }
  }
}

// ─── Campaigns ───
async function migrateCampaigns() {
  const snap = await fs.collection("campaigns").get();
  for (const doc of snap.docs) {
    const d = doc.data();
    if (!d.ownerId) continue;
    const ownerExists = await prisma.user.findUnique({ where: { id: d.ownerId } });
    if (!ownerExists) continue;
    try {
      await prisma.campaign.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          projectId: d.projectId ?? null,
          ownerId: d.ownerId,
          platform: d.platform === "google" ? "google" : "meta",
          platformCampaignId: d.platformCampaignId ?? null,
          platformAdSetId: d.platformAdSetId ?? null,
          platformAdId: d.platformAdId ?? null,
          name: str(d.name),
          status: [
            "draft",
            "pending",
            "active",
            "paused",
            "completed",
            "archived",
            "error",
          ].includes(d.status)
            ? d.status
            : "draft",
          objective: ["traffic", "conversions", "awareness"].includes(d.objective)
            ? d.objective
            : "traffic",
          budgetAmount: d.budget?.amount ?? 0,
          budgetCurrency: d.budget?.currency ?? "USD",
          budgetType: d.budget?.type ?? "daily",
          originalDailyBudget: d.originalDailyBudget ?? null,
          ageMin: d.targeting?.ageMin ?? 18,
          ageMax: d.targeting?.ageMax ?? 65,
          genders: arr(d.targeting?.genders).map(String),
          locations: arr(d.targeting?.locations).map(String),
          interests: arr(d.targeting?.interests).map(String),
          targetRoas: typeof d.targetRoas === "number" ? d.targetRoas : null,
          optimizationEnabled: !!d.optimizationEnabled,
          selectedCopyIds: arr(d.selectedCopyIds).map(String),
          selectedCreativeIds: arr(d.selectedCreativeIds).map(String),
          createdAt: tsOrNow(d.createdAt),
          updatedAt: tsOrNow(d.updatedAt),
        },
      });
      bump("campaigns");
    } catch (e) {
      console.error("campaign", doc.id, e.message);
    }
  }
}

// ─── Affiliates (programs / links / events / payouts) ───
async function migrateAffiliates() {
  const progSnap = await fs.collection("affiliatePrograms").get();
  for (const doc of progSnap.docs) {
    const d = doc.data();
    if (!d.ownerId || !d.projectId) continue;
    const projectExists = await prisma.project.findUnique({ where: { id: d.projectId } });
    if (!projectExists) continue;
    try {
      await prisma.affiliateProgram.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          projectId: d.projectId,
          ownerId: d.ownerId,
          name: str(d.name),
          description: str(d.description),
          commissionType: d.commissionType === "percentage" ? "percentage" : "fixed",
          commissionValue: d.commissionValue ?? 0,
          cookieDurationDays: d.cookieDurationDays ?? 30,
          status: ["active", "paused", "closed"].includes(d.status) ? d.status : "active",
          totalAffiliates: d.totalAffiliates ?? 0,
          createdAt: tsOrNow(d.createdAt),
          updatedAt: tsOrNow(d.updatedAt),
        },
      });
      bump("affiliatePrograms");
    } catch (e) {
      console.error("affProgram", doc.id, e.message);
    }
  }

  const linkSnap = await fs.collection("affiliateLinks").get();
  for (const doc of linkSnap.docs) {
    const d = doc.data();
    if (!d.programId) continue;
    const progExists = await prisma.affiliateProgram.findUnique({ where: { id: d.programId } });
    if (!progExists) continue;
    try {
      await prisma.affiliateLink.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          programId: d.programId,
          influencerId: str(d.influencerId),
          code: str(d.code || doc.id),
          destinationUrl: str(d.destinationUrl),
          clicks: d.clicks ?? 0,
          conversions: d.conversions ?? 0,
          earnings: d.earnings ?? 0,
          createdAt: tsOrNow(d.createdAt),
        },
      });
      bump("affiliateLinks");
    } catch (e) {
      console.error("affLink", doc.id, e.message);
    }
  }

  const eventSnap = await fs.collection("affiliateEvents").get();
  for (const doc of eventSnap.docs) {
    const d = doc.data();
    if (!d.linkId || !d.programId) continue;
    const linkExists = await prisma.affiliateLink.findUnique({ where: { id: d.linkId } });
    if (!linkExists) continue;
    try {
      await prisma.affiliateEvent.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          linkId: d.linkId,
          programId: d.programId,
          influencerId: str(d.influencerId),
          type: d.type === "conversion" ? "conversion" : "click",
          conversionValue: d.conversionValue ?? null,
          commission: d.commission ?? null,
          eventType: d.eventType ?? null,
          createdAt: tsOrNow(d.createdAt),
        },
      });
      bump("affiliateEvents");
    } catch (e) {
      console.error("affEvent", doc.id, e.message);
    }
  }

  const payoutSnap = await fs.collection("payoutRequests").get();
  for (const doc of payoutSnap.docs) {
    const d = doc.data();
    if (!d.influencerId) continue;
    const userExists = await prisma.user.findUnique({ where: { id: d.influencerId } });
    if (!userExists) continue;
    try {
      await prisma.payoutRequest.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          influencerId: d.influencerId,
          amount: d.amount ?? 0,
          status: ["pending", "approved", "paid", "rejected"].includes(d.status)
            ? d.status
            : "pending",
          paymentMethod: d.paymentMethod ?? null,
          paymentDetails: d.paymentDetails ?? null,
          note: d.note ?? null,
          createdAt: tsOrNow(d.createdAt),
          processedAt: ts(d.processedAt),
        },
      });
      bump("payoutRequests");
    } catch (e) {
      console.error("payout", doc.id, e.message);
    }
  }
}

(async () => {
  console.log("Starting Firestore → Postgres migration…");
  await migrateUsers();
  await migrateProjects();
  await migrateCampaigns();
  await migrateAffiliates();
  console.log("Done. Migrated rows:", stats);
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
