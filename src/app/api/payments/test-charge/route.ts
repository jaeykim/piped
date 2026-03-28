import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { addCredits } from "@/lib/services/credits";

/**
 * Test endpoint — adds credits without real payment.
 * TODO: Remove in production.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { credits } = await request.json();
    const amount = Math.min(credits || 100, 1000);

    const balance = await addCredits(uid, amount, "credit-purchase", `Test charge — ${amount} credits`);

    return NextResponse.json({ success: true, creditsAdded: amount, balance });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
