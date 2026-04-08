import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

// Owner endpoint: approve/reject/mark paid payout requests
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const { payoutId, action } = await request.json();
    if (!payoutId || !["approve", "reject", "paid"].includes(action)) {
      return NextResponse.json(
        { error: "payoutId and action required" },
        { status: 400 }
      );
    }

    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
    });
    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    const statusMap = {
      approve: "approved",
      reject: "rejected",
      paid: "paid",
    } as const;

    await prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: statusMap[action as keyof typeof statusMap],
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      payoutId,
      status: statusMap[action as keyof typeof statusMap],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

// GET: List all payout requests (for owners)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const payouts = await prisma.payoutRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        influencer: { select: { displayName: true } },
      },
    });

    return NextResponse.json({
      payouts: payouts.map((p) => ({
        id: p.id,
        influencerId: p.influencerId,
        amount: p.amount,
        status: p.status,
        paymentMethod: p.paymentMethod,
        paymentDetails: p.paymentDetails,
        note: p.note,
        createdAt: p.createdAt,
        processedAt: p.processedAt,
        influencerName: p.influencer?.displayName ?? "Unknown",
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
