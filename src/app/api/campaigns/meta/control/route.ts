import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
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

    const { adId, status } = await request.json();
    if (!adId || !["ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "adId and valid status required" }, { status: 400 });
    }

    const userSnap = await adminDb.doc(`users/${uid}`).get();
    const meta = userSnap.data()?.integrations?.meta;
    if (!meta?.accessToken) {
      return NextResponse.json({ error: "Meta Ads not connected" }, { status: 400 });
    }

    await updateAdStatus(adId, meta.accessToken, status);

    return NextResponse.json({ success: true, adId, status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update ad" },
      { status: 500 }
    );
  }
}
