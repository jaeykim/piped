import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { generateAllCopy } from "@/lib/services/copy-generator";
import { requireCredits, deductCredits } from "@/lib/services/credits";
import type { SiteAnalysis } from "@/types/analysis";
import type { CopyType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const creditCheck = await requireCredits(uid, "copy-generate");
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.error }, { status: 402 });
    }

    const { projectId, language } = await request.json();
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
      return NextResponse.json(
        { error: "Analysis not found. Crawl the URL first." },
        { status: 400 }
      );
    }

    // Re-shape Prisma row → SiteAnalysis interface
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

    const copyItems = await generateAllCopy(analysis, language);

    // Replace existing variants atomically
    await prisma.$transaction([
      prisma.copyVariant.deleteMany({ where: { projectId } }),
      prisma.copyVariant.createMany({
        data: copyItems.map((item) => ({
          projectId,
          type: item.type as CopyType,
          content: item.content,
        })),
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { pipelineStage: "creatives" },
      }),
    ]);

    const creditsRemaining = await deductCredits(
      uid,
      creditCheck.cost,
      "copy-generate",
      `Copy generation for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      count: copyItems.length,
      types: [...new Set(copyItems.map((c) => c.type))],
      creditsRemaining,
    });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Copy generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
