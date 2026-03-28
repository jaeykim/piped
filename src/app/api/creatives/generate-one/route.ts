import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { generateImage } from "@/lib/services/image-generator";
import { FieldValue } from "firebase-admin/firestore";
import type { SiteAnalysis } from "@/types/analysis";
import type { CreativeSize, CreativePlatform } from "@/types/creative";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { projectId, size, platform, style } = await request.json();

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
      return NextResponse.json({ error: "Analysis not found" }, { status: 400 });
    }

    const analysis = analysisSnap.data() as SiteAnalysis;

    const result = await generateImage(analysis, {
      size: size as CreativeSize,
      platform: platform as CreativePlatform,
      style,
    });

    // Save metadata to Firestore (no image data)
    const ref = await adminDb
      .collection(`projects/${projectId}/creatives`)
      .add({
        imageUrl: "",
        prompt: result.prompt,
        size,
        platform,
        status: "ready",
        createdAt: FieldValue.serverTimestamp(),
      });

    // Return base64 image as raw binary to avoid huge JSON
    const buffer = Buffer.from(result.imageData, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "X-Creative-Id": ref.id,
        "X-Creative-Size": size,
        "X-Creative-Platform": platform,
      },
    });
  } catch (error) {
    console.error("Generate-one error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
