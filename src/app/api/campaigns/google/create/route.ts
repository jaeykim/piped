import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { createGoogleCampaign } from "@/lib/services/google-ads";
import { refreshGoogleAccessToken } from "@/lib/services/google-auth";

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

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user?.googleRefreshToken) {
      return NextResponse.json(
        { error: "Google Ads account not connected. Please connect in Settings." },
        { status: 400 }
      );
    }
    if (!user.googleCustomerId) {
      return NextResponse.json(
        { error: "Google Ads Customer ID not found. Please reconnect your account." },
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

    const accessToken = await refreshGoogleAccessToken(user.googleRefreshToken);

    const result = await createGoogleCampaign({
      customerId: user.googleCustomerId,
      accessToken,
      developerToken,
      name,
      dailyBudget,
      headlines,
      descriptions,
      finalUrl,
      targeting,
    });

    const campaign = await prisma.campaign.create({
      data: {
        projectId: projectId ?? null,
        ownerId: uid,
        platform: "google",
        platformCampaignId: result.campaignResourceName,
        name,
        status: "paused",
        objective: "traffic",
        budgetAmount: dailyBudget,
        budgetCurrency: "USD",
        budgetType: "daily",
        ageMin: targeting?.ageMin ?? 18,
        ageMax: targeting?.ageMax ?? 65,
        genders: (targeting?.genders ?? []).map(String),
        locations: (targeting?.locations ?? []).map(String),
        interests: (targeting?.interests ?? []).map(String),
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
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
