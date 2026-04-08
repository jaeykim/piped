import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/services/image-generator";
import type { ImageRequest } from "@/lib/services/image-generator";
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

    const { projectId, requests: customRequests } = await request.json();
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
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

    const analysis: SiteAnalysis = {
      extractedText: project.analysis.extractedText,
      metaTags: {
        title: project.analysis.metaTitle,
        description: project.analysis.metaDescription,
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

    const requests: ImageRequest[] = (customRequests || [
      { size: "1080x1080", platform: "instagram", concept: "product-hero" },
      { size: "1200x628", platform: "facebook", concept: "urgency" },
    ]).map((r: ImageRequest) => ({ ...r, websiteUrl }));

    // Replace existing creatives
    await prisma.creative.deleteMany({ where: { projectId } });

    const results: {
      imageDataUrl: string;
      prompt: string;
      size: string;
      platform: string;
      concept: string;
      overlayText: string;
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
          concept: req.concept,
          overlayText: req.overlayText || "",
          status: "ready",
        });
      } catch (error) {
        console.error(`Failed to generate ${req.platform} ${req.size}:`, error);
        results.push({
          imageDataUrl: "",
          prompt: "",
          size: req.size,
          platform: req.platform,
          concept: req.concept,
          overlayText: req.overlayText || "",
          status: "failed",
        });
      }
    }

    // Bulk insert via $transaction so we can collect IDs back
    const created = await prisma.$transaction(
      results.map((c) =>
        prisma.creative.create({
          data: {
            projectId,
            imageUrl: "",
            prompt: c.prompt,
            size: c.size,
            platform: c.platform,
            concept: c.concept,
            overlayText: c.overlayText,
            status: c.status,
          },
        })
      )
    );

    await prisma.project.update({
      where: { id: projectId },
      data: { pipelineStage: "campaigns" },
    });

    return NextResponse.json({
      success: true,
      creatives: created.map((c, i) => ({
        id: c.id,
        imageDataUrl: results[i].imageDataUrl,
        size: results[i].size,
        platform: results[i].platform,
        status: results[i].status,
      })),
    });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("Creative generation error:", message, error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { error: "Creative generation failed. Please try again." },
      { status: 500 }
    );
  }
}
