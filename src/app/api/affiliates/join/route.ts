import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { programId } = await request.json();

    const program = await prisma.affiliateProgram.findUnique({
      where: { id: programId },
      include: { project: { select: { url: true } } },
    });
    if (!program || program.status !== "active") {
      return NextResponse.json(
        { error: "Program not found or inactive" },
        { status: 404 }
      );
    }

    const existing = await prisma.affiliateLink.findFirst({
      where: { programId, influencerId: uid },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        linkId: existing.id,
        code: existing.code,
        alreadyJoined: true,
      });
    }

    const code = nanoid(8);
    const link = await prisma.affiliateLink.create({
      data: {
        programId,
        influencerId: uid,
        code,
        destinationUrl: program.project?.url || "",
      },
    });

    await prisma.affiliateProgram.update({
      where: { id: programId },
      data: { totalAffiliates: { increment: 1 } },
    });

    return NextResponse.json({ success: true, linkId: link.id, code });
  } catch (error) {
    console.error("Error joining program:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to join" },
      { status: 500 }
    );
  }
}
