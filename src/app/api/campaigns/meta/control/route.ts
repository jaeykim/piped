import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { updateAdStatus } from "@/lib/services/meta-ads";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { adId, status, campaignDocId } = await request.json();
    if (!adId || !["ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
      return NextResponse.json(
        { error: "adId and valid status required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user?.metaAccessToken) {
      return NextResponse.json(
        { error: "Meta Ads not connected" },
        { status: 400 }
      );
    }

    // adId may be a campaign / ad-set / ad ID — Meta Graph API accepts POST
    // {status} on any of these object IDs.
    await updateAdStatus(adId, user.metaAccessToken, status);

    if (campaignDocId) {
      const c = await prisma.campaign.findUnique({
        where: { id: campaignDocId },
        select: { ownerId: true },
      });
      if (c && c.ownerId === uid) {
        await prisma.campaign.update({
          where: { id: campaignDocId },
          data: {
            status:
              status === "ACTIVE"
                ? "active"
                : status === "PAUSED"
                ? "paused"
                : "archived",
          },
        });
      }
    }

    return NextResponse.json({ success: true, adId, status });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update ad" },
      { status: 500 }
    );
  }
}
