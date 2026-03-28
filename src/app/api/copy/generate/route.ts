import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { generateAllCopy } from "@/lib/services/copy-generator";
import { requireCredits, deductCredits } from "@/lib/services/credits";
import { FieldValue } from "firebase-admin/firestore";
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

    // Check credits
    const creditCheck = await requireCredits(uid, "copy-generate");
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.error }, { status: 402 });
    }

    const { projectId, language, country } = await request.json();
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const projectSnap = await adminDb.doc(`projects/${projectId}`).get();
    if (!projectSnap.exists || projectSnap.data()?.ownerId !== uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get analysis
    const analysisSnap = await adminDb
      .doc(`projects/${projectId}/analysis/result`)
      .get();
    if (!analysisSnap.exists) {
      return NextResponse.json(
        { error: "Analysis not found. Crawl the URL first." },
        { status: 400 }
      );
    }

    const analysis = analysisSnap.data() as SiteAnalysis;

    // Generate copy
    const copyItems = await generateAllCopy(analysis, language);

    // Save to Firestore
    const batch = adminDb.batch();
    const copyCollection = adminDb.collection(
      `projects/${projectId}/copyVariants`
    );

    // Delete existing variants first
    const existing = await copyCollection.get();
    existing.docs.forEach((d) => batch.delete(d.ref));

    // Write new variants
    copyItems.forEach((item) => {
      const ref = copyCollection.doc();
      batch.set(ref, {
        type: item.type,
        content: item.content,
        isEdited: false,
        isFavorited: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    // Update project stage + save language/country preference
    const projectUpdate: Record<string, unknown> = {
      pipelineStage: "creatives",
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (language) projectUpdate.language = language;
    if (country) projectUpdate.country = country;
    batch.update(adminDb.doc(`projects/${projectId}`), projectUpdate);

    await batch.commit();

    // Deduct credits after successful generation
    const creditsRemaining = await deductCredits(uid, creditCheck.cost, "copy-generate", `Copy generation for project ${projectId}`);

    return NextResponse.json({
      success: true,
      count: copyItems.length,
      types: [...new Set(copyItems.map((c) => c.type))],
      creditsRemaining,
    });
  } catch (error) {
    console.error("Copy generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
