import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

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

    await prisma.user.update({
      where: { id: uid },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleCustomerId: customerId,
      },
    });

    return NextResponse.redirect(`${baseUrl}/settings?google_ads=success`);
  } catch (err) {
    if (typeof (err as { code?: string })?.code === "string" && (err as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Google Ads callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings?google_ads=error&reason=server`
    );
  }
}
