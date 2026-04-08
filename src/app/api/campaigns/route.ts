import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

// GET /api/campaigns?projectId=...
// Lists the current user's campaigns, optionally scoped to a project.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const projectId = request.nextUrl.searchParams.get("projectId");

    const campaigns = await prisma.campaign.findMany({
      where: {
        ownerId: decoded.uid,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        // Pull the most recent creative from the linked project so the
        // /campaigns page can render a thumbnail.
        project: {
          select: {
            id: true,
            name: true,
            url: true,
            creatives: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { id: true, imageUrl: true },
            },
          },
        },
      },
    });

    // Re-shape to match the legacy `Campaign` interface the client uses.
    const shaped = campaigns.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      ownerId: c.ownerId,
      platform: c.platform,
      platformCampaignId: c.platformCampaignId,
      platformAdSetId: c.platformAdSetId,
      platformAdId: c.platformAdId,
      name: c.name,
      status: c.status,
      objective: c.objective,
      budget: {
        amount: c.budgetAmount,
        currency: c.budgetCurrency,
        type: c.budgetType,
      },
      targeting: {
        ageMin: c.ageMin,
        ageMax: c.ageMax,
        genders: c.genders,
        locations: c.locations,
        interests: c.interests,
        language: c.language,
      },
      placements: c.placements,
      bidStrategy: c.bidStrategy,
      scheduleStart: c.scheduleStart,
      scheduleEnd: c.scheduleEnd,
      creativeThumbnail: c.project?.creatives?.[0]?.imageUrl ?? null,
      projectName: c.project?.name ?? null,
      targetRoas: c.targetRoas,
      optimizationEnabled: c.optimizationEnabled,
      selectedCopyIds: c.selectedCopyIds,
      selectedCreativeIds: c.selectedCreativeIds,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ campaigns: shaped });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "fetch failed" },
      { status: 500 }
    );
  }
}
