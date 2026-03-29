import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const appId = process.env.META_APP_ID;
    if (!appId) {
      return NextResponse.json({ error: "Meta App ID not configured" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/auth/meta-ads/callback`;

    const scopes = ["ads_management", "ads_read", "business_management"].join(",");
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${token}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Auth failed" }, { status: 500 });
  }
}
