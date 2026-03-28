import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { generateImage } from "@/lib/services/image-generator";
import { generateGraphicCard, generateCardWithImage } from "@/lib/services/card-generator";
import { selectCopyTrio } from "@/lib/services/copy-generator";
import { requireCredits, deductCredits } from "@/lib/services/credits";
import { FieldValue } from "firebase-admin/firestore";
import type { SiteAnalysis } from "@/types/analysis";
import type { CreativeSize, CreativePlatform, CreativeConcept } from "@/types/creative";
import sharp from "sharp";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

const sizeConfig: Record<string, { aspectRatio: string }> = {
  "1080x1080": { aspectRatio: "1:1" },
  "1200x628": { aspectRatio: "16:9" },
  "1080x1920": { aspectRatio: "9:16" },
  "1200x1200": { aspectRatio: "1:1" },
};

export const maxDuration = 120;

// All standard ad sizes grouped by aspect ratio
const FORMAT_GROUPS: Record<string, { sizes: { w: number; h: number; label: string; platform: string }[] }> = {
  "1:1": {
    sizes: [
      { w: 1080, h: 1080, label: "Instagram Feed", platform: "instagram" },
      { w: 1200, h: 1200, label: "Facebook Feed", platform: "facebook" },
    ],
  },
  "16:9": {
    sizes: [
      { w: 1200, h: 628, label: "Facebook Link", platform: "facebook" },
      { w: 1920, h: 1080, label: "Google Display", platform: "google_display" },
    ],
  },
  "9:16": {
    sizes: [
      { w: 1080, h: 1920, label: "Stories / Reels", platform: "instagram" },
    ],
  },
};

async function deriveFormats(
  baseImageB64: string,
  baseMimeType: string,
  primarySize: string
): Promise<{ size: string; label: string; platform: string; imageB64: string }[]> {
  const baseBuffer = Buffer.from(baseImageB64, "base64");
  const [pw, ph] = primarySize.split("x").map(Number);

  const results: { size: string; label: string; platform: string; imageB64: string }[] = [];

  for (const group of Object.values(FORMAT_GROUPS)) {
    for (const fmt of group.sizes) {
      const sizeKey = `${fmt.w}x${fmt.h}`;
      if (sizeKey === primarySize) {
        // Primary size — use original
        results.push({ size: sizeKey, label: fmt.label, platform: fmt.platform, imageB64: baseImageB64 });
        continue;
      }

      try {
        const derived = await sharp(baseBuffer)
          .resize(fmt.w, fmt.h, { fit: "cover", position: "attention" })
          .png()
          .toBuffer();
        results.push({ size: sizeKey, label: fmt.label, platform: fmt.platform, imageB64: derived.toString("base64") });
      } catch {
        // Skip failed derivations
      }
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { projectId, size, platform, concept, subject, overlayText, language, country } = await request.json();

    // Check credits (graphic-card is cheaper than AI photo)
    const creditAction = subject === "graphic-card" ? "creative-graphic" : "creative-ai";
    const creditCheck = await requireCredits(uid, creditAction);
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.error }, { status: 402 });
    }

    const projectSnap = await adminDb.doc(`projects/${projectId}`).get();
    if (!projectSnap.exists || projectSnap.data()?.ownerId !== uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const analysisSnap = await adminDb
      .doc(`projects/${projectId}/analysis/result`)
      .get();
    if (!analysisSnap.exists) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 400 });
    }

    const analysis = analysisSnap.data() as SiteAnalysis;
    const websiteUrl = projectSnap.data()?.url;

    // Smart Copy Trio: auto-select best headline + subheadline + CTA
    let copyTrio = { headline: "", subheadline: "", cta: "" };
    try {
      const copySnap = await adminDb
        .collection(`projects/${projectId}/copyVariants`)
        .get();
      if (!copySnap.empty) {
        const variants = copySnap.docs.map((d) => ({
          type: d.data().type as string,
          content: (d.data().editedContent || d.data().content) as string,
        }));
        copyTrio = await selectCopyTrio(variants, concept, language);
      }
    } catch (e) {
      console.error("Smart copy trio failed:", e);
    }

    // Use overlayText if provided, otherwise use the smart headline
    const finalOverlay = overlayText || copyTrio.headline;

    let result: { imageData: string; mimeType: string; prompt: string; hookText: string };

    if (subject === "graphic-card") {
      const autoTags = analysis.keyFeatures.filter((f) => f.length <= 12).slice(0, 4);
      const cardStyle = concept === "offer" || concept === "pain-point" ? "dark" as const
        : concept === "social-proof" ? "light" as const
        : "gradient" as const;

      // Auto-detect highlight words (numbers, product name, key terms)
      const headlineText = copyTrio.headline || finalOverlay;
      const highlightWords: string[] = [];
      // Highlight numbers with units (e.g., "3분", "50%", "10,000+")
      const numberMatches = headlineText.match(/[\d,]+[%배분초만원개+]*/g);
      if (numberMatches) highlightWords.push(...numberMatches.slice(0, 2));
      // Highlight product name if it appears
      if (headlineText.includes(analysis.productName)) highlightWords.push(analysis.productName);

      // Auto badge based on concept
      const autoBadge = concept === "offer" ? "혜택" :
        concept === "social-proof" ? "인기" :
        concept === "how-it-works" ? "간편" :
        undefined;

      const cardConfig = {
        headline: headlineText,
        highlightWords: highlightWords.length > 0 ? highlightWords : undefined,
        subheadline: copyTrio.subheadline,
        cta: copyTrio.cta || "자세히 보기 →",
        badge: autoBadge,
        productName: analysis.productName,
        brandColor: analysis.brandColors[0] || "#4F46E5",
        size,
        style: cardStyle,
        tags: autoTags.length > 0 ? autoTags : undefined,
      };

      let cardData: string;

      // Step 2: Generate illustration with Imagen → sandwich between bg and text
      try {
        const [cw, ch] = (size as string).split("x").map(Number);
        const illustSize = Math.round(cw * 0.38);

        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const illustBrief = await claude.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: "You write SHORT image prompts for Imagen 4. One sentence. Single subject, white background, photorealistic.",
          messages: [{
            role: "user",
            content: `Product: ${analysis.productName}
What it does: ${analysis.valueProposition}
Features: ${analysis.keyFeatures.slice(0, 3).join(", ")}
Industry: ${analysis.industry}

Write a 1-sentence prompt for an image representing this product's core benefit. Be SPECIFIC to "${analysis.productName}". White background, single subject, no text.`,
          }],
        });

        const illustPrompt = (illustBrief.content[0].type === "text" ? illustBrief.content[0].text : "").trim();

        if (illustPrompt) {
          const illustRes = await ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: illustPrompt.includes("no text") ? illustPrompt : illustPrompt + " White background, no text.",
            config: { numberOfImages: 1, aspectRatio: "1:1" },
          });

          const imgBytes = illustRes.generatedImages?.[0]?.image?.imageBytes;
          if (imgBytes) {
            // Use generateCardWithImage: bg → image → text (correct layer order)
            const imgBuffer = Buffer.from(imgBytes, "base64");
            const composited = await generateCardWithImage(cardConfig, imgBuffer, {
              top: ch - illustSize - Math.round(ch * 0.08),
              left: cw - illustSize - Math.round(cw * 0.03),
              width: illustSize,
              height: illustSize,
            });
            cardData = composited.data;
          } else {
            cardData = (await generateGraphicCard(cardConfig)).data;
          }
        } else {
          cardData = (await generateGraphicCard(cardConfig)).data;
        }
      } catch (e) {
        console.error("Illustration failed, using plain card:", e);
        cardData = (await generateGraphicCard(cardConfig)).data;
      }

      result = {
        imageData: cardData,
        mimeType: "image/png",
        prompt: "graphic-card",
        hookText: copyTrio.headline || finalOverlay,
      };
    } else {
      // AI image generation for other subjects
      result = await generateImage(analysis, {
        size: size as CreativeSize,
        platform: platform as CreativePlatform,
        concept: concept as CreativeConcept,
        subject,
        overlayText: finalOverlay,
        websiteUrl,
        language,
        country,
      });
    }

    // Derive all formats from the single base image
    const formats = await deriveFormats(result.imageData, result.mimeType, size);

    // Save primary to Firestore
    const ref = await adminDb
      .collection(`projects/${projectId}/creatives`)
      .add({
        imageUrl: "",
        prompt: result.prompt,
        size,
        platform,
        concept,
        overlayText: result.hookText,
        status: "ready",
        createdAt: FieldValue.serverTimestamp(),
      });

    // Deduct credits after successful generation
    const creditsRemaining = await deductCredits(uid, creditCheck.cost, creditAction, `Creative ${concept} ${subject}`);

    return NextResponse.json({
      id: ref.id,
      baseImage: `data:${result.mimeType};base64,${result.imageData}`,
      hookText: result.hookText,
      copyTrio,
      productName: analysis.productName,
      brandColor: analysis.brandColors[0] || "#4F46E5",
      isComplete: subject === "graphic-card",
      creditsRemaining,
      size,
      platform,
      formats: formats.map((f) => ({
        size: f.size,
        label: f.label,
        platform: f.platform,
        baseImage: `data:image/png;base64,${f.imageB64}`,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 3).join(" | ") : "";
    console.error("Generate-one error:", message, stack);
    return NextResponse.json(
      { error: message, detail: stack },
      { status: 500 }
    );
  }
}
