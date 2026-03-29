import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Record a conversion event.
 * Called when a referred user completes a desired action (signup, purchase, etc.)
 *
 * Can be called:
 * 1. Server-side with ref code from cookie
 * 2. Client-side JS reading piped_ref cookie
 * 3. Webhook from payment provider
 */
export async function POST(request: NextRequest) {
  try {
    const { refCode, conversionValue = 0, eventType = "signup" } = await request.json();

    // Also check cookie if no refCode in body
    const code = refCode || request.cookies.get("piped_ref")?.value;
    if (!code) {
      return NextResponse.json({ error: "No referral code" }, { status: 400 });
    }

    // Find the affiliate link
    const linksSnap = await adminDb
      .collection("affiliateLinks")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (linksSnap.empty) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const linkDoc = linksSnap.docs[0];
    const linkData = linkDoc.data();

    // Get program to calculate commission
    const programSnap = await adminDb.doc(`affiliatePrograms/${linkData.programId}`).get();
    if (!programSnap.exists) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    const program = programSnap.data()!;

    // Calculate commission
    let commission = 0;
    if (program.commissionType === "percentage") {
      commission = (conversionValue * program.commissionValue) / 100;
    } else {
      commission = program.commissionValue; // fixed amount
    }

    // Record conversion event
    await adminDb.collection("affiliateEvents").add({
      linkId: linkDoc.id,
      programId: linkData.programId,
      influencerId: linkData.influencerId,
      type: "conversion",
      conversionValue,
      commission,
      eventType,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update link stats
    await linkDoc.ref.update({
      conversions: FieldValue.increment(1),
      earnings: FieldValue.increment(commission),
    });

    return NextResponse.json({
      success: true,
      commission,
      influencerId: linkData.influencerId,
      programId: linkData.programId,
    });
  } catch (error) {
    console.error("Conversion tracking error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversion tracking failed" },
      { status: 500 }
    );
  }
}
