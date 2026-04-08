import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

const META_API_VERSION = "v21.0";

// GET /api/meta/ad-accounts
// Lists every Meta ad account the connected user has access to. Used by
// the Settings dropdown so users can pick which one MaktMakr should
// publish campaigns into.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.uid } });
    if (!user?.metaAccessToken) {
      return NextResponse.json(
        { connected: false, accounts: [] },
        { status: 200 }
      );
    }

    const res = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/me/adaccounts?fields=account_id,name,currency,account_status,amount_spent,balance&limit=100&access_token=${user.metaAccessToken}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          connected: true,
          accounts: [],
          error:
            err.error?.message || `Meta API error: ${res.status}`,
        },
        { status: 200 }
      );
    }
    const json = await res.json();
    interface RawAdAccount {
      account_id: string;
      name?: string;
      currency?: string;
      account_status?: number;
      amount_spent?: string;
      balance?: string;
    }
    const accounts = (json.data || []).map((a: RawAdAccount) => ({
      id: a.account_id,
      name: a.name || a.account_id,
      currency: a.currency || "USD",
      // Meta status codes: 1 = ACTIVE, 2 = DISABLED, 3 = UNSETTLED, ...
      status: a.account_status,
      amountSpent: a.amount_spent
        ? parseInt(a.amount_spent) / 100
        : 0,
      balance: a.balance ? parseInt(a.balance) / 100 : 0,
    }));

    return NextResponse.json({
      connected: true,
      accounts,
      currentAdAccountId: user.metaAdAccountId,
    });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "fetch failed" },
      { status: 500 }
    );
  }
}

// POST /api/meta/ad-accounts
// Body: { adAccountId: "..." } — switches the active ad account.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const { adAccountId } = await request.json();
    if (!adAccountId || typeof adAccountId !== "string") {
      return NextResponse.json(
        { error: "adAccountId required" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: decoded.uid },
      data: { metaAdAccountId: adAccountId },
    });

    return NextResponse.json({ success: true, adAccountId });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "update failed" },
      { status: 500 }
    );
  }
}
