import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { crawlUrl } from "@/lib/services/crawler";
import { analyzeWebsite } from "@/lib/services/analyzer";
import { requireCredits, deductCredits } from "@/lib/services/credits";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const creditCheck = await requireCredits(uid, "crawl");
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.error }, { status: 402 });
    }

    const body = await request.json();
    const { url, projectId, locale } = body;
    if (!url || !projectId) {
      return NextResponse.json(
        { error: "url and projectId are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project || project.ownerId !== uid) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "crawling" },
    });

    const crawlResult = await crawlUrl(url);
    const analysis = await analyzeWebsite(crawlResult, locale);

    await prisma.siteAnalysis.upsert({
      where: { projectId },
      create: {
        projectId,
        rawHtmlUrl: null,
        extractedText: analysis.extractedText ?? "",
        metaTitle: analysis.metaTags?.title ?? "",
        metaDescription: analysis.metaTags?.description ?? "",
        ogImage: analysis.metaTags?.ogImage ?? null,
        ogTitle: analysis.metaTags?.ogTitle ?? null,
        ogDescription: analysis.metaTags?.ogDescription ?? null,
        keywords: analysis.metaTags?.keywords ?? null,
        productName: analysis.productName ?? "",
        valueProposition: analysis.valueProposition ?? "",
        targetAudience: analysis.targetAudience ?? [],
        keyFeatures: analysis.keyFeatures ?? [],
        tone: analysis.tone ?? "",
        industry: analysis.industry ?? "",
        brandColors: analysis.brandColors ?? [],
        logoUrl: analysis.logoUrl ?? null,
        screenshots: analysis.screenshots ?? [],
        analyzedAt: new Date(),
      },
      update: {
        rawHtmlUrl: null,
        extractedText: analysis.extractedText ?? "",
        metaTitle: analysis.metaTags?.title ?? "",
        metaDescription: analysis.metaTags?.description ?? "",
        ogImage: analysis.metaTags?.ogImage ?? null,
        ogTitle: analysis.metaTags?.ogTitle ?? null,
        ogDescription: analysis.metaTags?.ogDescription ?? null,
        keywords: analysis.metaTags?.keywords ?? null,
        productName: analysis.productName ?? "",
        valueProposition: analysis.valueProposition ?? "",
        targetAudience: analysis.targetAudience ?? [],
        keyFeatures: analysis.keyFeatures ?? [],
        tone: analysis.tone ?? "",
        industry: analysis.industry ?? "",
        brandColors: analysis.brandColors ?? [],
        logoUrl: analysis.logoUrl ?? null,
        screenshots: analysis.screenshots ?? [],
        analyzedAt: new Date(),
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: analysis.productName || crawlResult.title || url,
        status: "analyzed",
        pipelineStage: "copy",
      },
    });

    await deductCredits(uid, creditCheck.cost, "crawl", `Site analysis for ${url}`);

    return NextResponse.json({
      success: true,
      analysis: {
        productName: analysis.productName,
        valueProposition: analysis.valueProposition,
        targetAudience: analysis.targetAudience,
        keyFeatures: analysis.keyFeatures,
        tone: analysis.tone,
        industry: analysis.industry,
        brandColors: analysis.brandColors,
      },
    });
  } catch (error) {
    console.error("Crawl error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Crawl failed" },
      { status: 500 }
    );
  }
}
