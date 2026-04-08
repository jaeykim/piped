import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

const MIN_PAYOUT = 10;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const [payouts, links] = await Promise.all([
      prisma.payoutRequest.findMany({
        where: { influencerId: uid },
        orderBy: { createdAt: "desc" },
      }),
      prisma.affiliateLink.findMany({
        where: { influencerId: uid },
        select: { earnings: true },
      }),
    ]);

    const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);
    const paidOrPending = payouts
      .filter((p) => p.status !== "rejected")
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payouts,
      totalEarnings,
      availableBalance: totalEarnings - paidOrPending,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
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

    const { amount, paymentMethod, paymentDetails } = await request.json();

    if (!amount || amount < MIN_PAYOUT) {
      return NextResponse.json(
        { error: `최소 출금 금액은 $${MIN_PAYOUT}입니다` },
        { status: 400 }
      );
    }

    const [links, openPayouts] = await Promise.all([
      prisma.affiliateLink.findMany({
        where: { influencerId: uid },
        select: { earnings: true },
      }),
      prisma.payoutRequest.findMany({
        where: {
          influencerId: uid,
          status: { in: ["pending", "approved", "paid"] },
        },
        select: { amount: true },
      }),
    ]);

    const totalEarnings = links.reduce((s, l) => s + l.earnings, 0);
    const alreadyPaid = openPayouts.reduce((s, p) => s + p.amount, 0);
    const available = totalEarnings - alreadyPaid;

    if (amount > available) {
      return NextResponse.json(
        { error: `잔액이 부족합니다. 출금 가능: $${available.toFixed(2)}` },
        { status: 400 }
      );
    }

    const payout = await prisma.payoutRequest.create({
      data: {
        influencerId: uid,
        amount,
        status: "pending",
        paymentMethod: paymentMethod || "bank_transfer",
        paymentDetails: paymentDetails || "",
      },
    });

    return NextResponse.json({ success: true, payoutId: payout.id, amount });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payout request failed" },
      { status: 500 }
    );
  }
}
