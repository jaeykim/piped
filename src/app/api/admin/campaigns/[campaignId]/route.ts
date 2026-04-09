import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getMetaCampaignDailyMetrics } from "@/lib/services/meta-ads";

// GET /api/admin/campaigns/[campaignId]
// Full campaign drill-down for admins. Returns the campaign row, owner,
// linked project, the project's creatives + copy variants, the most
// recent optimization log entries, and (if Meta is connected on the
// owner) live 14-day insights from Meta.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          displayName: true,
          metaAccessToken: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          url: true,
          status: true,
          pipelineStage: true,
          creatives: {
            orderBy: { createdAt: "desc" },
            take: 12,
          },
          copyVariants: {
            orderBy: { createdAt: "desc" },
            take: 12,
          },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const optimizationLogs = await prisma.optimizationLog.findMany({
    where: { campaignDocId: campaignId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Live Meta insights (14 days) — best-effort, never block the response.
  let dailyMetrics: Awaited<ReturnType<typeof getMetaCampaignDailyMetrics>> = [];
  if (
    campaign.owner.metaAccessToken &&
    campaign.platformCampaignId &&
    campaign.platform === "meta"
  ) {
    try {
      dailyMetrics = await getMetaCampaignDailyMetrics(
        campaign.platformCampaignId,
        campaign.owner.metaAccessToken,
        14
      );
    } catch {
      /* Meta down, expired token, etc. — UI handles empty state */
    }
  }

  const totals = dailyMetrics.reduce(
    (acc, d) => ({
      spend: acc.spend + d.spend,
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      conversions: acc.conversions + d.conversions,
      conversionValue: acc.conversionValue + d.conversionValue,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 }
  );

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      platform: campaign.platform,
      objective: campaign.objective,
      platformCampaignId: campaign.platformCampaignId,
      platformAdSetId: campaign.platformAdSetId,
      platformAdId: campaign.platformAdId,
      budget: {
        amount: campaign.budgetAmount,
        currency: campaign.budgetCurrency,
        type: campaign.budgetType,
      },
      originalDailyBudget: campaign.originalDailyBudget,
      targeting: {
        ageMin: campaign.ageMin,
        ageMax: campaign.ageMax,
        genders: campaign.genders,
        locations: campaign.locations,
        interests: campaign.interests,
        language: campaign.language,
      },
      placements: campaign.placements,
      bidStrategy: campaign.bidStrategy,
      scheduleStart: campaign.scheduleStart,
      scheduleEnd: campaign.scheduleEnd,
      targetRoas: campaign.targetRoas,
      optimizationEnabled: campaign.optimizationEnabled,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    },
    owner: {
      id: campaign.owner.id,
      email: campaign.owner.email,
      displayName: campaign.owner.displayName,
    },
    project: campaign.project,
    optimizationLogs,
    metrics: {
      daily: dailyMetrics,
      totals: {
        ...totals,
        ctr:
          totals.impressions > 0
            ? (totals.clicks / totals.impressions) * 100
            : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
        roas: totals.spend > 0 ? totals.conversionValue / totals.spend : 0,
      },
    },
  });
}
