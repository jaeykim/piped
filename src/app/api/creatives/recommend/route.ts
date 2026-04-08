import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { recommendAdStrategy } from "@/lib/services/ad-recommender";
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

    const { projectId, language } = await request.json();

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
    const recommendations = await recommendAdStrategy(analysis, language);

    return NextResponse.json({ recommendations });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Recommend error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recommendation failed" },
      { status: 500 }
    );
  }
}
