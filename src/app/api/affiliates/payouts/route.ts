import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const MIN_PAYOUT = 10; // $10 minimum

// GET: List payout requests for the current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const snap = await adminDb
      .collection("payoutRequests")
      .where("influencerId", "==", decoded.uid)
      .orderBy("createdAt", "desc")
      .get();

    const payouts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Calculate available balance (total earnings - pending/paid payouts)
    const linksSnap = await adminDb
      .collection("affiliateLinks")
      .where("influencerId", "==", decoded.uid)
      .get();

    const totalEarnings = linksSnap.docs.reduce((sum, d) => sum + (d.data().earnings || 0), 0);
    const paidOrPending = payouts
      .filter((p) => (p as unknown as { status: string }).status !== "rejected")
      .reduce((sum, p) => sum + ((p as unknown as { amount: number }).amount || 0), 0);

    const availableBalance = totalEarnings - paidOrPending;

    return NextResponse.json({ payouts, totalEarnings, availableBalance });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

// POST: Request a payout
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { amount, paymentMethod, paymentDetails } = await request.json();

    if (!amount || amount < MIN_PAYOUT) {
      return NextResponse.json({ error: `최소 출금 금액은 $${MIN_PAYOUT}입니다` }, { status: 400 });
    }

    // Verify available balance
    const linksSnap = await adminDb
      .collection("affiliateLinks")
      .where("influencerId", "==", uid)
      .get();
    const totalEarnings = linksSnap.docs.reduce((sum, d) => sum + (d.data().earnings || 0), 0);

    const payoutsSnap = await adminDb
      .collection("payoutRequests")
      .where("influencerId", "==", uid)
      .where("status", "in", ["pending", "approved", "paid"])
      .get();
    const alreadyPaid = payoutsSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

    const available = totalEarnings - alreadyPaid;
    if (amount > available) {
      return NextResponse.json({ error: `잔액이 부족합니다. 출금 가능: $${available.toFixed(2)}` }, { status: 400 });
    }

    // Get programId from user's first affiliate link for attribution
    const firstLink = linksSnap.docs[0]?.data();
    const ref = await adminDb.collection("payoutRequests").add({
      influencerId: uid,
      programId: firstLink?.programId || "",
      amount,
      status: "pending",
      paymentMethod: paymentMethod || "bank_transfer",
      paymentDetails: paymentDetails || "",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, payoutId: ref.id, amount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payout request failed" },
      { status: 500 }
    );
  }
}
