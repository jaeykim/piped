import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import {
  getMetaCampaignDailyMetrics,
  type DailyMetric,
} from "@/lib/services/meta-ads";

// GET /api/campaigns/meta/insights?days=14
// Returns aggregated daily metrics across all of the user's Meta campaigns,
// plus a per-campaign roll-up.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const days = Math.min(
      90,
      Math.max(1, parseInt(request.nextUrl.searchParams.get("days") || "14"))
    );

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user?.metaAccessToken) {
      return NextResponse.json(
        { error: "Meta Ads not connected", connected: false },
        { status: 200 }
      );
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        ownerId: uid,
        platform: "meta",
        platformCampaignId: { not: null },
      },
    });

    const accessToken = user.metaAccessToken;
    const perCampaign = await Promise.all(
      campaigns.map(async (c) => {
        const series = await getMetaCampaignDailyMetrics(
          c.platformCampaignId as string,
          accessToken,
          days
        );
        const totals = series.reduce(
          (acc, d) => ({
            spend: acc.spend + d.spend,
            impressions: acc.impressions + d.impressions,
            clicks: acc.clicks + d.clicks,
            conversions: acc.conversions + d.conversions,
            conversionValue: acc.conversionValue + d.conversionValue,
          }),
          { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 }
        );
        return {
          campaignId: c.id,
          name: c.name,
          status: c.status,
          targetRoas: c.targetRoas,
          series,
          totals: {
            ...totals,
            ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
            cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
            cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
            roas: totals.spend > 0 ? totals.conversionValue / totals.spend : 0,
          },
        };
      })
    );

    const dailyMap = new Map<string, DailyMetric>();
    for (const c of perCampaign) {
      for (const d of c.series) {
        const existing = dailyMap.get(d.date);
        if (existing) {
          existing.spend += d.spend;
          existing.impressions += d.impressions;
          existing.clicks += d.clicks;
          existing.conversions += d.conversions;
          existing.conversionValue += d.conversionValue;
          existing.roas =
            existing.spend > 0 ? existing.conversionValue / existing.spend : 0;
          existing.ctr =
            existing.impressions > 0
              ? (existing.clicks / existing.impressions) * 100
              : 0;
          existing.cpc =
            existing.clicks > 0 ? existing.spend / existing.clicks : 0;
        } else {
          dailyMap.set(d.date, { ...d });
        }
      }
    }
    const daily = Array.from(dailyMap.values()).sort((a, b) =>
      a.date < b.date ? -1 : 1
    );

    const totals = perCampaign.reduce(
      (acc, c) => ({
        spend: acc.spend + c.totals.spend,
        impressions: acc.impressions + c.totals.impressions,
        clicks: acc.clicks + c.totals.clicks,
        conversions: acc.conversions + c.totals.conversions,
        conversionValue: acc.conversionValue + c.totals.conversionValue,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 }
    );

    return NextResponse.json({
      connected: true,
      days,
      totals: {
        ...totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
        roas: totals.spend > 0 ? totals.conversionValue / totals.spend : 0,
      },
      daily,
      campaigns: perCampaign,
    });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "insights failed" },
      { status: 500 }
    );
  }
}
