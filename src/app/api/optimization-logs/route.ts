import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

// GET /api/optimization-logs?limit=50&campaignId=...
// Returns the auto-optimization activity feed for the current user.
// The dashboard surfaces this as the "what the loop did" timeline.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(200, Math.max(1, parseInt(limitParam || "50")));
    const campaignId = request.nextUrl.searchParams.get("campaignId");

    const logs = await prisma.optimizationLog.findMany({
      where: {
        ownerId: decoded.uid,
        ...(campaignId ? { campaignDocId: campaignId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        campaignId: l.campaignDocId,
        campaignName: l.campaign?.name ?? "(deleted)",
        kind: l.kind,
        reason: l.reason,
        recentRoas: l.recentRoas,
        recentSpend: l.recentSpend,
        targetRoas: l.targetRoas,
        nextDailyBudget: l.nextDailyBudget,
        createdAt: l.createdAt,
      })),
    });
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
