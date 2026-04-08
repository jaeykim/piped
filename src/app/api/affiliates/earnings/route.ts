import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const links = await prisma.affiliateLink.findMany({
      where: { influencerId: uid },
      include: { program: true },
    });

    const totals = links.reduce(
      (acc, l) => ({
        earnings: acc.earnings + l.earnings,
        clicks: acc.clicks + l.clicks,
        conversions: acc.conversions + l.conversions,
      }),
      { earnings: 0, clicks: 0, conversions: 0 }
    );

    return NextResponse.json({
      totalEarnings: totals.earnings,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      links: links.map((l) => ({
        id: l.id,
        programId: l.programId,
        influencerId: l.influencerId,
        code: l.code,
        destinationUrl: l.destinationUrl,
        clicks: l.clicks,
        conversions: l.conversions,
        earnings: l.earnings,
        createdAt: l.createdAt,
        program: l.program,
      })),
    });
  } catch (error) {
    console.error("Earnings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
