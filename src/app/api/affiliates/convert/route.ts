import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { refCode, conversionValue = 0, eventType = "signup" } = await request.json();

    const code = refCode || request.cookies.get("piped_ref")?.value;
    if (!code) {
      return NextResponse.json({ error: "No referral code" }, { status: 400 });
    }

    const link = await prisma.affiliateLink.findUnique({
      where: { code },
      include: { program: true },
    });
    if (!link) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }
    if (!link.program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    let commission = 0;
    if (link.program.commissionType === "percentage") {
      commission =
        Math.round(((conversionValue * link.program.commissionValue) / 100) * 100) /
        100;
    } else {
      commission = link.program.commissionValue;
    }

    await prisma.$transaction([
      prisma.affiliateEvent.create({
        data: {
          linkId: link.id,
          programId: link.programId,
          influencerId: link.influencerId,
          type: "conversion",
          conversionValue,
          commission,
          eventType,
        },
      }),
      prisma.affiliateLink.update({
        where: { id: link.id },
        data: {
          conversions: { increment: 1 },
          earnings: { increment: commission },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      commission,
      influencerId: link.influencerId,
      programId: link.programId,
    });
  } catch (error) {
    console.error("Conversion tracking error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversion tracking failed" },
      { status: 500 }
    );
  }
}
