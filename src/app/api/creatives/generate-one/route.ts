import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/storage";
import { generateImage } from "@/lib/services/image-generator";
import { generateGraphicCard, generateCardWithImage, generateCardOnImage, generateCardOnImageNoText, generateGraphicCardNoText } from "@/lib/services/card-generator";
import { selectCopyTrio } from "@/lib/services/copy-generator";
import { requireCredits, deductCredits } from "@/lib/services/credits";
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

    const { projectId, size, platform, concept, subject, overlayText, userImage, language, country, appealPoints, ctaText, styleRef } = await request.json();

    // Check credits (graphic-card is cheaper than AI photo)
    const creditAction = subject === "graphic-card" ? "creative-graphic" : "creative-ai";
    const creditCheck = await requireCredits(uid, creditAction);
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.error }, { status: 402 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { analysis: true },
    });
    if (!project || project.ownerId !== uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!project.analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 400 });
    }

    // Re-shape the Prisma row into the SiteAnalysis interface the
    // generators expect.
    const analysis: SiteAnalysis = {
      extractedText: project.analysis.extractedText,
      metaTags: {
        title: project.analysis.metaTitle,
        description: project.analysis.metaDescription,
        ogImage: project.analysis.ogImage ?? undefined,
        ogTitle: project.analysis.ogTitle ?? undefined,
        ogDescription: project.analysis.ogDescription ?? undefined,
        keywords: project.analysis.keywords ?? undefined,
      },
      productName: project.analysis.productName,
      valueProposition: project.analysis.valueProposition,
      targetAudience: project.analysis.targetAudience,
      keyFeatures: project.analysis.keyFeatures,
      tone: project.analysis.tone,
      industry: project.analysis.industry,
      brandColors: project.analysis.brandColors,
      logoUrl: project.analysis.logoUrl ?? undefined,
      screenshots: project.analysis.screenshots,
      analyzedAt: project.analysis.analyzedAt,
    };
    const websiteUrl = project.url;

    // Smart Copy Trio: auto-select best headline + subheadline + CTA (with timeout)
    let copyTrio = { headline: analysis.valueProposition || analysis.productName, subheadline: "", cta: "자세히 보기 →" };
    try {
      const copyRows = await prisma.copyVariant.findMany({
        where: { projectId },
      });
      if (copyRows.length > 0) {
        const variants = copyRows.map((d) => ({
          type: d.type as string,
          content: d.editedContent || d.content,
        }));
        // Race with 15s timeout to prevent hanging
        const trioPromise = selectCopyTrio(variants, concept, language);
        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Copy trio timeout")), 15000));
        copyTrio = await Promise.race([trioPromise, timeoutPromise]);
      }
    } catch (e) {
      console.error("Smart copy trio failed (using fallback):", e);
    }

    // Override copy trio with user-selected appeal points / CTA
    if (appealPoints?.length) {
      const primary = appealPoints.find((a: { role: string }) => a.role === "primary");
      const secondary = appealPoints.find((a: { role: string }) => a.role === "secondary");
      if (primary?.text) copyTrio.headline = primary.text;
      if (secondary?.text) copyTrio.subheadline = secondary.text;
    }
    if (ctaText) {
      copyTrio.cta = ctaText;
    }

    // Use overlayText if provided, otherwise use the smart headline
    const finalOverlay = overlayText || copyTrio.headline;

    let result: { imageData: string; mimeType: string; prompt: string; hookText: string };

    if (subject === "graphic-card") {
      const autoTags = analysis.keyFeatures.filter((f) => f.length <= 12).slice(0, 4);
      // ZET-inspired style selection based on concept
      const styleMap: Record<string, "light" | "dark" | "gradient" | "bold" | "review"> = {
        "benefit-driven": "gradient",
        "pain-point": "dark",
        "social-proof": "light",
        "offer": "bold",
        "how-it-works": "light",
        "before-after": "dark",
        "comparison": "light",
        "urgency": "bold",
        "story": "review",
        "question": "gradient",
      };
      const cardStyle = styleMap[concept] || "gradient";

      // No top banner — keep the design clean. The headline IS the hook.

      // Auto-detect highlight words — only highlight numbers with units (3+ chars)
      const headlineText = copyTrio.headline || finalOverlay;
      const highlightWords: string[] = [];
      const numberMatches = headlineText.match(/\d[\d,]*\s*[%배분초만원개+]+/g);
      if (numberMatches) {
        highlightWords.push(...numberMatches.filter((m: string) => m.length >= 2).slice(0, 1));
      }

      // Auto badge based on concept (ZET-style Korean ad patterns)
      const badgeMap: Record<string, string> = {
        "offer": "혜택",
        "social-proof": "인기",
        "how-it-works": "간편",
        "before-after": "변화",
        "comparison": "비교",
        "urgency": "긴급",
        "story": "후기",
        "question": "궁금",
        "benefit-driven": "추천",
        "pain-point": "해결",
      };
      const autoBadge = badgeMap[concept];

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

      // Step 2: Try to add image to the card (user upload > screenshot > fallback)
      try {
        const [cw, ch] = (size as string).split("x").map(Number);
        let screenshotBuffer: Buffer | null = null;

        // Priority 1: User uploaded image
        if (userImage) {
          const base64 = userImage.split(",")[1];
          if (base64) screenshotBuffer = Buffer.from(base64, "base64");
        }

        // Priority 2: Website screenshot
        if (!screenshotBuffer && websiteUrl) {
          const ssRes = await fetch(
            `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(websiteUrl)}&category=PERFORMANCE&strategy=DESKTOP`,
            { signal: AbortSignal.timeout(12000) }
          );
          if (ssRes.ok) {
            const ssJson = await ssRes.json();
            const dataUri = ssJson?.lighthouseResult?.audits?.["final-screenshot"]?.details?.data;
            if (dataUri && typeof dataUri === "string") {
              screenshotBuffer = Buffer.from(dataUri.split(",")[1], "base64");
            }
          }
        }
        // Fallback to ogImage
        if (!screenshotBuffer && analysis.screenshots?.[0]) {
          const ogRes = await fetch(analysis.screenshots[0], { signal: AbortSignal.timeout(5000) });
          if (ogRes.ok) {
            const ogMime = (ogRes.headers.get("content-type") || "").split(";")[0];
            if (!ogMime.includes("svg")) {
              screenshotBuffer = Buffer.from(await ogRes.arrayBuffer());
            }
          }
        }

        // Try to get an image for full-bleed background
        let imageBuffer: Buffer | null = screenshotBuffer;

        // If no screenshot, generate a background image with Gemini
        if (!imageBuffer) {
          try {
            const bgPrompt = `A beautiful, professional photo for a ${analysis.industry} advertisement. ${
              analysis.industry.includes("tech") || analysis.industry.includes("SaaS") || analysis.industry.includes("마케팅")
                ? "A person working on a laptop in a bright modern office, warm lighting, lifestyle feel"
                : analysis.industry.includes("뷰티") || analysis.industry.includes("beauty")
                ? "Beautiful skincare products on a clean surface, soft natural lighting, premium feel"
                : analysis.industry.includes("음식") || analysis.industry.includes("food")
                ? "Appetizing food beautifully plated, close-up, warm natural lighting"
                : `A professional, inviting scene related to ${analysis.industry}`
            }. Fill the entire frame edge-to-edge. Bright, warm, high quality. Korean Instagram ad aesthetic. ABSOLUTELY NO TEXT or LETTERS of any kind.`;
            const bgResponse = await ai.models.generateImages({
              model: "imagen-4.0-generate-001",
              prompt: bgPrompt,
              config: { numberOfImages: 1, aspectRatio: "1:1" },
            });
            const bgImg = bgResponse.generatedImages?.[0]?.image?.imageBytes;
            if (bgImg) imageBuffer = Buffer.from(bgImg, "base64");
          } catch (e) {
            console.error("BG image generation failed:", e);
          }
        }

        if (imageBuffer) {
          // FULL-BLEED: image fills entire card, gradient overlay, NO text (frontend renders text)
          const composited = await generateCardOnImageNoText(cardConfig, imageBuffer);
          cardData = composited.data;
        } else {
          cardData = (await generateGraphicCardNoText(cardConfig)).data;
        }
      } catch (e) {
        console.error("Screenshot mockup failed:", e);
        cardData = (await generateGraphicCardNoText(cardConfig)).data;
      }

      result = {
        imageData: cardData,
        mimeType: "image/png",
        prompt: "graphic-card",
        hookText: copyTrio.headline || finalOverlay,
      };
      // graphic-card now returns text-free background; frontend handles text overlay
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
        styleRef,
      });
    }

    // Derive all formats from the single base image
    const formats = await deriveFormats(result.imageData, result.mimeType, size);

    // Save image to local disk and serve via /uploads route
    let storageUrl = "";
    try {
      const saved = await saveImage({
        ownerId: uid,
        projectId,
        data: result.imageData,
        extension: "png",
      });
      storageUrl = saved.url;
    } catch (e) {
      console.error("Storage upload failed:", e);
    }

    // Pick text overlay style based on concept × subject × industry
    const industry = analysis.industry?.toLowerCase() || "";
    let textStyle = "split-text-top";
    if (subject === "graphic-card") {
      if (concept === "benefit-driven" || concept === "social-proof") textStyle = "split-text-top";
      else if (concept === "offer" || concept === "urgency") textStyle = "bold-strip";
      else if (concept === "pain-point" || concept === "comparison") textStyle = "dark-premium";
      else if (concept === "how-it-works" || concept === "question") textStyle = "highlight-keyword";
      else textStyle = "split-text-top";
    } else if (subject === "product-ui") {
      textStyle = "dark-premium";
    } else if (subject === "person-product") {
      textStyle = "split-text-top";
    }

    const created = await prisma.creative.create({
      data: {
        projectId,
        imageUrl: storageUrl,
        prompt: result.prompt,
        size,
        platform,
        concept,
        subject: subject || "product-ui",
        overlayText: result.hookText,
        status: "ready",
      },
    });

    // Deduct credits after successful generation
    const creditsRemaining = await deductCredits(uid, creditCheck.cost, creditAction, `Creative ${concept} ${subject}`);

    // Badge for all subjects (Korean ad style decorative badges)
    const badgeMap: Record<string, string> = {
      "offer": "혜택",
      "social-proof": "인기",
      "how-it-works": "간편",
      "before-after": "변화",
      "comparison": "비교",
      "urgency": "긴급",
      "story": "후기",
      "question": "궁금",
      "benefit-driven": "추천",
      "pain-point": "해결",
    };

    return NextResponse.json({
      id: created.id,
      baseImage: `data:${result.mimeType};base64,${result.imageData}`,
      hookText: result.hookText,
      copyTrio: {
        ...copyTrio,
        // Use Claude-generated sub text (ad-strategy methodology) if available
        subheadline: (result as { subText?: string }).subText || copyTrio.subheadline,
      },
      productName: analysis.productName,
      brandColor: analysis.brandColors[0] || "#4F46E5",
      badge: badgeMap[concept] || "",
      isComplete: false,
      textStyle,
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
    console.error("Generate-one error:", message, error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { error: "Creative generation failed. Please try again." },
      { status: 500 }
    );
  }
}
