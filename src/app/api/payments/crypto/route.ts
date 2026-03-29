import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const CREDIT_PACKS: Record<string, { credits: number; amount: number }> = {
  starter: { credits: 100, amount: 10 },
  growth: { credits: 500, amount: 40 },
  pro: { credits: 1000, amount: 70 },
};

// Default tokens per chain (USDC)
const CHAIN_TOKENS: Record<string, string> = {
  arbitrum: "cmnahahwb000f1alaigqslp11",   // Arbitrum USDC
  ethereum: "cmnahahm100031alaabvrtdx8",   // Ethereum USDC
  bsc: "cmnahahsz000b1ala04ok60bk",        // BSC USDC
  base: "cmnahahm100031alaabvrtdx8",       // Base — fallback to ETH USDC
};

function getClient() {
  const { BanksiClient } = require("banksi");
  return new BanksiClient();
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { packId, chainId } = await request.json();
    const pack = CREDIT_PACKS[packId];
    if (!pack) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const chain = chainId || "arbitrum";
    const tokenId = CHAIN_TOKENS[chain] || CHAIN_TOKENS.arbitrum;

    const client = getClient();
    const payment = await client.createPayment({
      chainId: chain,
      tokenId,
      amount: pack.amount,
    });

    return NextResponse.json({
      paymentId: payment.paymentId,
      address: payment.address,
      amount: payment.amountExpected,
      token: payment.tokenSymbol,
      chain: payment.chainName,
      expiresAt: payment.expiresAt,
      credits: pack.credits,
      uid,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Crypto payment error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const paymentId = request.nextUrl.searchParams.get("paymentId");
    const credits = parseInt(request.nextUrl.searchParams.get("credits") || "0");

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId required" }, { status: 400 });
    }

    const client = getClient();
    const confirmed = await client.isPaymentConfirmed(paymentId);

    if (confirmed && credits > 0) {
      const { addCredits } = await import("@/lib/services/credits");
      const balance = await addCredits(uid, credits, "credit-purchase", `Crypto payment ${paymentId}`);
      return NextResponse.json({ status: "confirmed", credits, balance });
    }

    const status = await client.verifyPayment(paymentId);
    return NextResponse.json({ status: status.status, confirmed: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    );
  }
}
