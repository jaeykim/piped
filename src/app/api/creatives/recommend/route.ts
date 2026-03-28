import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { recommendAdStrategy } from "@/lib/services/ad-recommender";
import type { SiteAnalysis } from "@/types/analysis";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { projectId, language } = await request.json();

    const projectSnap = await adminDb.doc(`projects/${projectId}`).get();
    if (!projectSnap.exists || projectSnap.data()?.ownerId !== uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const analysisSnap = await adminDb.doc(`projects/${projectId}/analysis/result`).get();
    if (!analysisSnap.exists) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 400 });
    }

    const analysis = analysisSnap.data() as SiteAnalysis;
    const recommendations = await recommendAdStrategy(analysis, language);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recommendation failed" },
      { status: 500 }
    );
  }
}
