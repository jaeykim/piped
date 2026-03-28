import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { crawlUrl } from "@/lib/services/crawler";
import { analyzeWebsite } from "@/lib/services/analyzer";
import { requireCredits, deductCredits } from "@/lib/services/credits";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Check credits
    const creditCheck = await requireCredits(uid, "crawl");
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.error }, { status: 402 });
    }

    const body = await request.json();
    const { url, projectId } = body;

    if (!url || !projectId) {
      return NextResponse.json(
        { error: "url and projectId are required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const projectRef = adminDb.doc(`projects/${projectId}`);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists || projectSnap.data()?.ownerId !== uid) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update status to crawling
    await projectRef.update({
      status: "crawling",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Crawl the URL
    const crawlResult = await crawlUrl(url);

    // Analyze with Claude
    const analysis = await analyzeWebsite(crawlResult);

    // Save analysis to Firestore
    await adminDb.doc(`projects/${projectId}/analysis/result`).set({
      ...analysis,
      analyzedAt: FieldValue.serverTimestamp(),
    });

    // Update project status
    await projectRef.update({
      name: analysis.productName || crawlResult.title || url,
      status: "analyzed",
      pipelineStage: "copy",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Deduct credits
    await deductCredits(uid, creditCheck.cost, "crawl", `Site analysis for ${url}`);

    return NextResponse.json({
      success: true,
      analysis: {
        productName: analysis.productName,
        valueProposition: analysis.valueProposition,
        targetAudience: analysis.targetAudience,
        keyFeatures: analysis.keyFeatures,
        tone: analysis.tone,
        industry: analysis.industry,
        brandColors: analysis.brandColors,
      },
    });
  } catch (error) {
    console.error("Crawl error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Crawl failed" },
      { status: 500 }
    );
  }
}
