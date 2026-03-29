import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getMetaCampaignMetrics } from "@/lib/services/meta-ads";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { campaignId } = await request.json();
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }

    // Get Meta integration
    const userSnap = await adminDb.doc(`users/${uid}`).get();
    const meta = userSnap.data()?.integrations?.meta;
    if (!meta?.accessToken) {
      return NextResponse.json({ error: "Meta Ads not connected" }, { status: 400 });
    }

    const metrics = await getMetaCampaignMetrics(campaignId, meta.accessToken);

    return NextResponse.json({ metrics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
