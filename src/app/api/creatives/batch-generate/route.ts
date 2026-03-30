import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const maxDuration = 300; // 5 minutes for batch

/**
 * Batch generate creatives — calls generate-one internally for each variant.
 * POST /api/creatives/batch-generate
 * Body: { projectId, variants: [{ concept, subject, overlayText?, size?, platform? }], language, country }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { projectId, variants, language, country } = await request.json();

    if (!projectId || !variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "projectId and variants required" }, { status: 400 });
    }

    const maxVariants = 5;
    const batch = variants.slice(0, maxVariants);

    // Credits are deducted per-variant inside generate-one, no upfront check needed here

    // Get the internal URL for generate-one
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Generate all variants in parallel
    const results = await Promise.allSettled(
      batch.map(async (variant: { concept: string; subject: string; overlayText?: string; size?: string; platform?: string }) => {
        const res = await fetch(`${baseUrl}/api/creatives/generate-one`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            concept: variant.concept,
            subject: variant.subject,
            overlayText: variant.overlayText || "",
            size: variant.size || "1080x1080",
            platform: variant.platform || "instagram",
            language: language || "한국어",
            country: country || "대한민국",
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Generation failed");
        }

        return res.json();
      })
    );

    // Collect results
    const successes = results
      .filter((r): r is PromiseFulfilledResult<Record<string, unknown>> => r.status === "fulfilled")
      .map((r) => r.value);

    const failures = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r, i) => ({ index: i, error: r.reason?.message || "Failed" }));

    // Create A/B test group if multiple successes
    if (successes.length > 1) {
      const abGroupId = `ab_${Date.now()}`;
      await adminDb.collection(`projects/${projectId}/abTests`).add({
        groupId: abGroupId,
        creativeIds: successes.map((s) => s.id),
        variants: batch.map((v: { concept: string; subject: string }, i: number) => ({
          concept: v.concept,
          subject: v.subject,
          creativeId: successes[i]?.id || null,
        })),
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      total: batch.length,
      succeeded: successes.length,
      failed: failures.length,
      results: successes,
      failures,
    });
  } catch (error) {
    console.error("Batch generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch generation failed" },
      { status: 500 }
    );
  }
}
