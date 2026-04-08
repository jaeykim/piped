import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { updateAdStatus } from "@/lib/services/meta-ads";
import { FieldValue } from "firebase-admin/firestore";

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
      return NextResponse.json({ error: "adId and valid status required" }, { status: 400 });
    }

    const userSnap = await adminDb.doc(`users/${uid}`).get();
    const meta = userSnap.data()?.integrations?.meta;
    if (!meta?.accessToken) {
      return NextResponse.json({ error: "Meta Ads not connected" }, { status: 400 });
    }

    // adId here may be a campaign ID, ad-set ID, or ad ID — Meta Graph API
    // accepts POST {status} on any of these object IDs.
    await updateAdStatus(adId, meta.accessToken, status);

    // Mirror status onto the Firestore campaign doc when provided
    if (campaignDocId) {
      const docRef = adminDb.doc(`campaigns/${campaignDocId}`);
      const docSnap = await docRef.get();
      if (docSnap.exists && docSnap.data()?.ownerId === uid) {
        await docRef.update({
          status:
            status === "ACTIVE"
              ? "active"
              : status === "PAUSED"
              ? "paused"
              : "archived",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({ success: true, adId, status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update ad" },
      { status: 500 }
    );
  }
}
