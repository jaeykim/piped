import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { createMetaCampaign } from "@/lib/services/meta-ads";

// POST /api/campaigns/[campaignId]/clone
// Duplicates an existing Meta campaign — same targeting, budget, schedule,
// creative, target ROAS — and pushes it to Meta as a new paused campaign.
// Useful for A/B testing winning campaigns without rebuilding the wizard.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { campaignId } = await params;
    const original = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!original || original.ownerId !== uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (original.platform !== "meta") {
      return NextResponse.json(
        { error: "Only Meta campaigns can be cloned" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user?.metaAccessToken || !user.metaAdAccountId) {
      return NextResponse.json(
        { error: "Meta Ads not connected" },
        { status: 400 }
      );
    }

    // We don't replicate the underlying creative+copy here — the new
    // campaign reuses the same image_url and text fields by reading them
    // back from the linked project's most recent creative.
    const project = original.projectId
      ? await prisma.project.findUnique({
          where: { id: original.projectId },
          include: {
            creatives: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            copyVariants: { take: 5 },
            analysis: true,
          },
        })
      : null;

    const creative = project?.creatives?.[0];
    if (!creative || !creative.imageUrl) {
      return NextResponse.json(
        { error: "Original campaign has no creative to clone" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://maktmakr.com";
    const adCreativeUrl = creative.imageUrl.startsWith("http")
      ? creative.imageUrl
      : `${baseUrl}${creative.imageUrl}`;

    const headlineCopy = project?.copyVariants?.find(
      (v) => v.type === "headline"
    );
    const objectiveMap: Record<
      string,
      "OUTCOME_TRAFFIC" | "OUTCOME_AWARENESS" | "OUTCOME_SALES"
    > = {
      traffic: "OUTCOME_TRAFFIC",
      awareness: "OUTCOME_AWARENESS",
      conversions: "OUTCOME_SALES",
    };

    const newName = `${original.name} (clone)`;
    const result = await createMetaCampaign({
      accessToken: user.metaAccessToken,
      adAccountId: user.metaAdAccountId,
      name: newName,
      objective: objectiveMap[original.objective] ?? "OUTCOME_TRAFFIC",
      dailyBudget: original.budgetAmount,
      targeting: {
        ageMin: original.ageMin,
        ageMax: original.ageMax,
        genders: [],
        geoLocations: { countries: original.locations },
      },
      placements: original.placements,
      bidStrategy:
        (original.bidStrategy as
          | "LOWEST_COST_WITHOUT_CAP"
          | "LOWEST_COST_WITH_BID_CAP"
          | "COST_CAP"
          | undefined) ?? undefined,
      adCreativeUrl,
      primaryText:
        headlineCopy?.editedContent ??
        headlineCopy?.content ??
        project?.analysis?.valueProposition ??
        "",
      headline: project?.analysis?.productName ?? newName,
      linkDescription: project?.analysis?.valueProposition ?? "",
      destinationUrl: project?.url ?? "",
    });

    const cloned = await prisma.campaign.create({
      data: {
        projectId: original.projectId,
        ownerId: uid,
        platform: "meta",
        platformCampaignId: result.campaignId,
        platformAdSetId: result.adSetId,
        platformAdId: result.adId,
        name: newName,
        status: "paused",
        objective: original.objective,
        budgetAmount: original.budgetAmount,
        budgetCurrency: original.budgetCurrency,
        budgetType: original.budgetType,
        ageMin: original.ageMin,
        ageMax: original.ageMax,
        genders: original.genders,
        locations: original.locations,
        interests: original.interests,
        language: original.language,
        placements: original.placements,
        bidStrategy: original.bidStrategy,
        targetRoas: original.targetRoas,
        optimizationEnabled: original.optimizationEnabled,
      },
    });

    return NextResponse.json({ success: true, campaignId: cloned.id });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "clone failed" },
      { status: 500 }
    );
  }
}
