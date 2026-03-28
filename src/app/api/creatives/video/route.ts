import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { generateVideoFromImage } from "@/lib/services/video-generator";
import { requireCredits, deductCredits } from "@/lib/services/credits";

export const maxDuration = 300;

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
    const creditCheck = await requireCredits(uid, "video-generate");
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.error }, { status: 402 });
    }

    const { imageBase64, imageMimeType, prompt } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const result = await generateVideoFromImage({
      imageBase64,
      imageMimeType: imageMimeType || "image/png",
      prompt: prompt || "Subtle cinematic motion, gentle camera push-in, soft ambient movement. Professional advertising video.",
      durationSeconds: 5,
    });

    // Deduct credits after success
    const creditsRemaining = await deductCredits(uid, creditCheck.cost, "video-generate", "Video generation");

    if (result.videoUri) {
      return NextResponse.json({ videoUri: result.videoUri, mimeType: result.mimeType, creditsRemaining });
    }
    if (result.videoBytes) {
      return NextResponse.json({ videoBase64: result.videoBytes, mimeType: result.mimeType, creditsRemaining });
    }
    throw new Error("No video output");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Video generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
