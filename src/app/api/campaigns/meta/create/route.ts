import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { createMetaCampaign } from "@/lib/services/meta-ads";
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

    const body = await request.json();
    const {
      projectId,
      name,
      objective,
      dailyBudget,
      targeting,
      creativeUrl,
      primaryText,
      headline,
      linkDescription,
      destinationUrl,
    } = body;

    // Get user's Meta integration
    const userSnap = await adminDb.doc(`users/${uid}`).get();
    const userData = userSnap.data();
    const metaIntegration = userData?.integrations?.meta;

    if (!metaIntegration?.accessToken) {
      return NextResponse.json(
        { error: "Meta Ads account not connected" },
        { status: 400 }
      );
    }

    const objectiveMap: Record<string, string> = {
      traffic: "OUTCOME_TRAFFIC",
      awareness: "OUTCOME_AWARENESS",
      conversions: "OUTCOME_SALES",
    };

    // Create campaign on Meta
    const result = await createMetaCampaign({
      accessToken: metaIntegration.accessToken,
      adAccountId: metaIntegration.adAccountId,
      name,
      objective: objectiveMap[objective] as "OUTCOME_TRAFFIC",
      dailyBudget,
      targeting: {
        ageMin: targeting.ageMin || 18,
        ageMax: targeting.ageMax || 65,
        genders: targeting.genders || [],
        geoLocations: { countries: targeting.locations || ["US"] },
      },
      adCreativeUrl: creativeUrl,
      primaryText,
      headline,
      linkDescription,
      destinationUrl,
    });

    // Save campaign to Firestore
    const campaignRef = await adminDb.collection("campaigns").add({
      projectId,
      ownerId: uid,
      platform: "meta",
      platformCampaignId: result.campaignId,
      name,
      status: "paused",
      objective,
      budget: { amount: dailyBudget, currency: "USD", type: "daily" },
      targeting,
      selectedCopyIds: [],
      selectedCreativeIds: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      campaignId: campaignRef.id,
      metaCampaignId: result.campaignId,
    });
  } catch (error) {
    console.error("Meta campaign creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Campaign creation failed" },
      { status: 500 }
    );
  }
}
