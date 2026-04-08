import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings?meta_ads=error&reason=${error || "missing_params"}`);
  }

  try {
    const decoded = await adminAuth.verifyIdToken(state);
    const uid = decoded.uid;

    // Exchange code for token
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const redirectUri = `${baseUrl}/api/auth/meta-ads/callback`;

    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/settings?meta_ads=error&reason=token_exchange`);
    }

    const tokens = await tokenRes.json();

    // Get long-lived token
    const llRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokens.access_token}`
    );
    const llTokens = llRes.ok ? await llRes.json() : tokens;

    // Get ad accounts
    let adAccountId = "";
    try {
      const acctRes = await fetch(
        `https://graph.facebook.com/v21.0/me/adaccounts?fields=account_id,name&access_token=${llTokens.access_token}`
      );
      if (acctRes.ok) {
        const acctData = await acctRes.json();
        adAccountId = acctData.data?.[0]?.account_id || "";
      }
    } catch { /* ignore */ }

    await prisma.user.update({
      where: { id: uid },
      data: {
        metaAccessToken: llTokens.access_token,
        metaAdAccountId: adAccountId,
        metaExpiresAt: new Date(
          Date.now() + (llTokens.expires_in || 5184000) * 1000
        ),
        metaConnectedAt: new Date(),
      },
    });

    return NextResponse.redirect(`${baseUrl}/settings?meta_ads=success`);
  } catch (err) {
    console.error("Meta callback error:", err);
    return NextResponse.redirect(`${baseUrl}/settings?meta_ads=error&reason=server`);
  }
}
