import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { createGoogleCampaign } from "@/lib/services/google-ads";
import { refreshGoogleAccessToken } from "@/lib/services/google-auth";
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
      dailyBudget,
      headlines,
      descriptions,
      finalUrl,
      targeting,
    } = body;

    // Get user's Google integration
    const userSnap = await adminDb.doc(`users/${uid}`).get();
    const userData = userSnap.data();
    const googleIntegration = userData?.integrations?.google;

    if (!googleIntegration?.refreshToken) {
      return NextResponse.json(
        { error: "Google Ads 계정이 연결되지 않았습니다. Settings에서 연결하세요." },
        { status: 400 }
      );
    }

    if (!googleIntegration.customerId) {
      return NextResponse.json(
        { error: "Google Ads Customer ID가 없습니다. 계정을 다시 연결하세요." },
        { status: 400 }
      );
    }

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) {
      return NextResponse.json(
        { error: "Google Ads developer token not configured" },
        { status: 500 }
      );
    }

    // Get fresh access token from refresh token
    const accessToken = await refreshGoogleAccessToken(
      googleIntegration.refreshToken
    );

    const result = await createGoogleCampaign({
      customerId: googleIntegration.customerId,
      accessToken,
      developerToken,
      name,
      dailyBudget,
      headlines,
      descriptions,
      finalUrl,
      targeting,
    });

    // Save campaign to Firestore
    const campaignRef = await adminDb.collection("campaigns").add({
      projectId,
      ownerId: uid,
      platform: "google",
      platformCampaignId: result.campaignResourceName,
      name,
      status: "paused",
      objective: "traffic",
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
      googleCampaignId: result.campaignResourceName,
    });
  } catch (error) {
    console.error("Google campaign creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Campaign creation failed" },
      { status: 500 }
    );
  }
}
