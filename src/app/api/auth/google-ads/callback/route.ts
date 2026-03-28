import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // Firebase ID token
  const error = request.nextUrl.searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/settings?google_ads=error&reason=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/settings?google_ads=error&reason=missing_params`
    );
  }

  try {
    // Verify the user from state
    const decoded = await adminAuth.verifyIdToken(state);
    const uid = decoded.uid;

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${baseUrl}/api/auth/google-ads/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      console.error("Token exchange failed:", err);
      return NextResponse.redirect(
        `${baseUrl}/settings?google_ads=error&reason=token_exchange`
      );
    }

    const tokens = await tokenRes.json();

    // Try to get the Google Ads customer ID using the accessible customers endpoint
    let customerId = "";
    try {
      const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
      const customersRes = await fetch(
        "https://googleads.googleapis.com/v19/customers:listAccessibleCustomers",
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "developer-token": developerToken || "",
          },
        }
      );
      if (customersRes.ok) {
        const data = await customersRes.json();
        // Take the first customer ID (format: "customers/1234567890")
        const first = data.resourceNames?.[0];
        if (first) {
          customerId = first.replace("customers/", "");
        }
      }
    } catch (e) {
      console.error("Failed to fetch customer IDs:", e);
    }

    // Save tokens to Firestore
    await adminDb.doc(`users/${uid}`).update({
      "integrations.google": {
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        customerId,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        connectedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.redirect(`${baseUrl}/settings?google_ads=success`);
  } catch (err) {
    console.error("Google Ads callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings?google_ads=error&reason=server`
    );
  }
}
