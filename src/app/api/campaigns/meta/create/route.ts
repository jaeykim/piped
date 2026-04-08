import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { createMetaCampaign } from "@/lib/services/meta-ads";

// Map our friendly gender labels → Meta's numeric codes.
function gendersToMeta(g: string[]): number[] {
  if (!g.length || g.includes("all")) return []; // empty = all
  const out: number[] = [];
  if (g.includes("male")) out.push(1);
  if (g.includes("female")) out.push(2);
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await request.json();
    const {
      projectId,
      name,
      objective,
      dailyBudget,
      targeting,
      placements,
      bidStrategy,
      scheduleStart,
      scheduleEnd,
      language,
      creativeUrl,
      primaryText,
      headline,
      linkDescription,
      destinationUrl,
      targetRoas,
      optimizationEnabled,
    } = body;

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user?.metaAccessToken || !user.metaAdAccountId) {
      return NextResponse.json(
        { error: "Meta Ads account not connected" },
        { status: 400 }
      );
    }

    const objectiveMap: Record<string, "OUTCOME_TRAFFIC" | "OUTCOME_AWARENESS" | "OUTCOME_SALES"> = {
      traffic: "OUTCOME_TRAFFIC",
      awareness: "OUTCOME_AWARENESS",
      conversions: "OUTCOME_SALES",
    };

    const result = await createMetaCampaign({
      accessToken: user.metaAccessToken,
      adAccountId: user.metaAdAccountId,
      name,
      objective: objectiveMap[objective] ?? "OUTCOME_TRAFFIC",
      dailyBudget,
      targeting: {
        ageMin: targeting?.ageMin ?? 18,
        ageMax: targeting?.ageMax ?? 65,
        genders: gendersToMeta(targeting?.genders ?? []),
        geoLocations: { countries: targeting?.locations ?? ["US"] },
      },
      placements: Array.isArray(placements) ? placements : undefined,
      bidStrategy: bidStrategy ?? undefined,
      scheduleStart: scheduleStart ?? undefined,
      scheduleEnd: scheduleEnd ?? undefined,
      adCreativeUrl: creativeUrl,
      primaryText,
      headline,
      linkDescription,
      destinationUrl,
    });

    const campaign = await prisma.campaign.create({
      data: {
        projectId: projectId ?? null,
        ownerId: uid,
        platform: "meta",
        platformCampaignId: result.campaignId,
        platformAdSetId: result.adSetId,
        platformAdId: result.adId,
        name,
        status: "paused",
        objective: objective ?? "traffic",
        budgetAmount: dailyBudget,
        budgetCurrency: "USD",
        budgetType: "daily",
        ageMin: targeting?.ageMin ?? 18,
        ageMax: targeting?.ageMax ?? 65,
        genders: (targeting?.genders ?? []).map(String),
        locations: (targeting?.locations ?? []).map(String),
        interests: (targeting?.interests ?? []).map(String),
        language: language ?? null,
        placements: Array.isArray(placements) ? placements : [],
        bidStrategy: bidStrategy ?? null,
        scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
        scheduleEnd: scheduleEnd ? new Date(scheduleEnd) : null,
        targetRoas: typeof targetRoas === "number" ? targetRoas : null,
        optimizationEnabled: !!optimizationEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      metaCampaignId: result.campaignId,
    });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Meta campaign creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Campaign creation failed" },
      { status: 500 }
    );
  }
}
