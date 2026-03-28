import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Get all links for this influencer
    const linksSnap = await adminDb
      .collection("affiliateLinks")
      .where("influencerId", "==", uid)
      .get();

    interface LinkData {
      id: string;
      earnings: number;
      clicks: number;
      conversions: number;
      programId: string;
    }
    const links: LinkData[] = linksSnap.docs.map((d) => ({
      id: d.id,
      earnings: 0,
      clicks: 0,
      conversions: 0,
      programId: "",
      ...d.data(),
    }));

    // Calculate totals
    let totalEarnings = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    links.forEach((link) => {
      totalEarnings += link.earnings || 0;
      totalClicks += link.clicks || 0;
      totalConversions += link.conversions || 0;
    });

    // Get program details for each link
    const programIds = [...new Set(links.map((l) => l.programId))];
    const programs: Record<string, unknown> = {};
    for (const pid of programIds) {
      const pSnap = await adminDb.doc(`affiliatePrograms/${pid}`).get();
      if (pSnap.exists) {
        programs[pid] = { id: pSnap.id, ...pSnap.data() };
      }
    }

    return NextResponse.json({
      totalEarnings,
      totalClicks,
      totalConversions,
      links: links.map((l) => ({
        ...l,
        program: programs[(l as { programId: string }).programId],
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
