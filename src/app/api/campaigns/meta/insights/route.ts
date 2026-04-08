import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
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

    const userSnap = await adminDb.doc(`users/${uid}`).get();
    const meta = userSnap.data()?.integrations?.meta;
    if (!meta?.accessToken) {
      return NextResponse.json(
        { error: "Meta Ads not connected", connected: false },
        { status: 200 }
      );
    }

    // Pull user's Meta campaigns from Firestore
    const campSnap = await adminDb
      .collection("campaigns")
      .where("ownerId", "==", uid)
      .where("platform", "==", "meta")
      .get();

    interface CampaignDoc {
      id: string;
      name?: string;
      status?: string;
      platformCampaignId?: string;
      targetRoas?: number | null;
    }
    const campaigns: CampaignDoc[] = campSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<CampaignDoc, "id">) }))
      .filter((c) => !!c.platformCampaignId);

    // Fetch daily insights per campaign in parallel
    const perCampaign = await Promise.all(
      campaigns.map(async (c) => {
        const series = await getMetaCampaignDailyMetrics(
          c.platformCampaignId as string,
          meta.accessToken,
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
          name: c.name ?? "",
          status: c.status ?? "paused",
          targetRoas: c.targetRoas ?? null,
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

    // Aggregate daily across all campaigns
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "insights failed" },
      { status: 500 }
    );
  }
}
