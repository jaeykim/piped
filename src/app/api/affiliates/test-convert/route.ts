import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Test conversion endpoint — simulates a purchase conversion.
 * GET /api/affiliates/test-convert?code=XXX
 *
 * This simulates what would happen when a referred user makes a purchase.
 * Records a conversion event with a random value between $10-$100.
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")
      || request.cookies.get("piped_ref")?.value;

    if (!code) {
      return NextResponse.json({ error: "No referral code. Visit a referral link first." }, { status: 400 });
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

    // Get program for commission calculation
    const programSnap = await adminDb.doc(`affiliatePrograms/${linkData.programId}`).get();
    if (!programSnap.exists) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    const program = programSnap.data()!;

    // Simulate a purchase
    const conversionValue = Math.round((Math.random() * 90 + 10) * 100) / 100; // $10-$100

    // Calculate commission
    let commission = 0;
    if (program.commissionType === "percentage") {
      commission = Math.round((conversionValue * program.commissionValue) / 100 * 100) / 100;
    } else {
      commission = program.commissionValue;
    }

    // Record conversion event
    await adminDb.collection("affiliateEvents").add({
      linkId: linkDoc.id,
      programId: linkData.programId,
      influencerId: linkData.influencerId,
      type: "conversion",
      conversionValue,
      commission,
      eventType: "test-purchase",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update link stats
    await linkDoc.ref.update({
      conversions: FieldValue.increment(1),
      earnings: FieldValue.increment(commission),
    });

    return NextResponse.json({
      success: true,
      message: `테스트 전환 완료! 구매 금액: $${conversionValue.toFixed(2)}, 커미션: $${commission.toFixed(2)}`,
      conversionValue,
      commission,
      code,
      influencerId: linkData.influencerId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Test conversion failed" },
      { status: 500 }
    );
  }
}
