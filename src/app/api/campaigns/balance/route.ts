import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

const META_API_VERSION = "v21.0";
const GOOGLE_ADS_BASE_URL = "https://googleads.googleapis.com/v19";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const platform = request.nextUrl.searchParams.get("platform");
    if (!platform || !["meta", "google"].includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (platform === "meta") {
      if (!user.metaAccessToken || !user.metaAdAccountId) {
        return NextResponse.json({ connected: false });
      }

      // Fetch Meta ad account info: balance, spend_cap, amount_spent
      const res = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/act_${user.metaAdAccountId}?fields=balance,spend_cap,amount_spent,currency&access_token=${user.metaAccessToken}`
      );

      if (!res.ok) {
        return NextResponse.json({ connected: true, error: "Failed to fetch balance" });
      }

      const data = await res.json();
      // Meta returns values in cents
      return NextResponse.json({
        connected: true,
        platform: "meta",
        balance: data.balance ? (parseInt(data.balance) / 100) : null,
        spendCap: data.spend_cap ? (parseInt(data.spend_cap) / 100) : null,
        amountSpent: data.amount_spent ? (parseInt(data.amount_spent) / 100) : null,
        currency: data.currency || "USD",
      });
    }

    if (platform === "google") {
      if (!user.googleRefreshToken || !user.googleCustomerId) {
        return NextResponse.json({ connected: false });
      }

      // Refresh access token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          refresh_token: user.googleRefreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenRes.ok) {
        return NextResponse.json({ connected: true, error: "Failed to refresh token" });
      }

      const { access_token } = await tokenRes.json();
      const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";

      // Query account budget via Google Ads API
      const queryRes = await fetch(
        `${GOOGLE_ADS_BASE_URL}/customers/${user.googleCustomerId}/googleAds:searchStream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
            "developer-token": developerToken,
          },
          body: JSON.stringify({
            query: `SELECT account_budget.amount_served_micros, account_budget.approved_spending_limit_micros FROM account_budget WHERE account_budget.status = 'APPROVED' LIMIT 1`,
          }),
        }
      );

      if (!queryRes.ok) {
        // Fallback: just report connected, no budget info
        return NextResponse.json({ connected: true, platform: "google", balance: null });
      }

      const queryData = await queryRes.json();
      const budgetRow = queryData?.[0]?.results?.[0]?.accountBudget;

      return NextResponse.json({
        connected: true,
        platform: "google",
        amountSpent: budgetRow?.amountServedMicros ? parseInt(budgetRow.amountServedMicros) / 1_000_000 : null,
        spendingLimit: budgetRow?.approvedSpendingLimitMicros ? parseInt(budgetRow.approvedSpendingLimitMicros) / 1_000_000 : null,
        balance: budgetRow?.approvedSpendingLimitMicros && budgetRow?.amountServedMicros
          ? (parseInt(budgetRow.approvedSpendingLimitMicros) - parseInt(budgetRow.amountServedMicros)) / 1_000_000
          : null,
        currency: "USD",
      });
    }

    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  } catch (error) {
    console.error("Balance check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check balance" },
      { status: 500 }
    );
  }
}
