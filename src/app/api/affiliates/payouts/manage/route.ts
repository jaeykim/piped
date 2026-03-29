import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// Owner endpoint: approve/reject/mark paid payout requests
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { payoutId, action } = await request.json(); // action: "approve" | "reject" | "paid"
    if (!payoutId || !["approve", "reject", "paid"].includes(action)) {
      return NextResponse.json({ error: "payoutId and action required" }, { status: 400 });
    }

    // Verify the requester owns the program linked to this payout
    const payoutSnap = await adminDb.doc(`payoutRequests/${payoutId}`).get();
    if (!payoutSnap.exists) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }
    const payoutData = payoutSnap.data()!;
    if (payoutData.programId) {
      const programSnap = await adminDb.doc(`affiliatePrograms/${payoutData.programId}`).get();
      if (programSnap.exists && programSnap.data()?.ownerId !== uid) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      paid: "paid",
    };

    await adminDb.doc(`payoutRequests/${payoutId}`).update({
      status: statusMap[action],
      processedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, payoutId, status: statusMap[action] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

// GET: List all payout requests (for owners)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const snap = await adminDb
      .collection("payoutRequests")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const payouts = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        // Get influencer name
        let influencerName = "Unknown";
        try {
          const userSnap = await adminDb.doc(`users/${data.influencerId}`).get();
          influencerName = userSnap.data()?.displayName || "Unknown";
        } catch { /* ignore */ }
        return { id: d.id, ...data, influencerName };
      })
    );

    return NextResponse.json({ payouts });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
