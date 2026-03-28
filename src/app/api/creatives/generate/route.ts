import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  generateImage,
  getDefaultImageRequests,
} from "@/lib/services/image-generator";
import { FieldValue } from "firebase-admin/firestore";
import type { SiteAnalysis } from "@/types/analysis";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { projectId } = await request.json();
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
        { error: "Analysis not found" },
        { status: 400 }
      );
    }

    const analysis = analysisSnap.data() as SiteAnalysis;
    const requests = getDefaultImageRequests();

    // Delete existing creatives first
    const existingCreatives = await adminDb
      .collection(`projects/${projectId}/creatives`)
      .get();
    const deleteBatch = adminDb.batch();
    existingCreatives.docs.forEach((d) => deleteBatch.delete(d.ref));
    if (!existingCreatives.empty) await deleteBatch.commit();

    // Generate images sequentially to avoid rate limits
    const results: {
      imageDataUrl: string;
      prompt: string;
      size: string;
      platform: string;
      status: "ready" | "failed";
    }[] = [];

    for (const req of requests) {
      try {
        const result = await generateImage(analysis, req);
        results.push({
          imageDataUrl: `data:${result.mimeType};base64,${result.imageData}`,
          prompt: result.prompt,
          size: req.size,
          platform: req.platform,
          status: "ready",
        });
      } catch (error) {
        console.error(`Failed to generate ${req.platform} ${req.size}:`, error);
        results.push({
          imageDataUrl: "",
          prompt: "",
          size: req.size,
          platform: req.platform,
          status: "failed",
        });
      }
    }

    // Save creative metadata to Firestore (without the large base64 data)
    const batch = adminDb.batch();
    const creativesCollection = adminDb.collection(
      `projects/${projectId}/creatives`
    );

    const creativeIds: string[] = [];
    results.forEach((c) => {
      const ref = creativesCollection.doc();
      creativeIds.push(ref.id);
      batch.set(ref, {
        imageUrl: "",
        prompt: c.prompt,
        size: c.size,
        platform: c.platform,
        status: c.status,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    // Update project pipeline stage
    batch.update(adminDb.doc(`projects/${projectId}`), {
      pipelineStage: "campaigns",
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      creatives: results.map((c, i) => ({
        id: creativeIds[i],
        imageDataUrl: c.imageDataUrl,
        size: c.size,
        platform: c.platform,
        status: c.status,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("Creative generation error:", message, stack);
    return NextResponse.json(
      { error: message, detail: stack?.split("\n").slice(0, 3).join(" | ") },
      { status: 500 }
    );
  }
}
