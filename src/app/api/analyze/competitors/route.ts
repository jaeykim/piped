import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { SiteAnalysis } from "@/types/analysis";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 60;

/**
 * Analyze competitors based on site analysis data.
 * POST /api/analyze/competitors
 * Body: { projectId }
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

    const { projectId } = await request.json();

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

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are a competitive intelligence analyst specializing in digital marketing. Return ONLY valid JSON with no markdown.`,
      messages: [{
        role: "user",
        content: `Analyze the competitive landscape for this product and identify key competitors and their ad strategies.

Product: ${analysis.productName}
What it does: ${analysis.valueProposition}
Industry: ${analysis.industry}
Target audience: ${analysis.targetAudience.join(", ")}
Key features: ${analysis.keyFeatures.join(", ")}

Return a JSON object:
{
  "competitors": [
    {
      "name": "Competitor name",
      "url": "competitor website URL",
      "positioning": "How they position themselves (1 sentence)",
      "adStrategy": "Their likely ad strategy based on industry knowledge",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"]
    }
  ],
  "ourAdvantages": ["What makes ${analysis.productName} different from competitors"],
  "recommendedAngles": [
    {
      "angle": "Ad angle name",
      "description": "Why this angle works against competitors",
      "example": "Example ad headline"
    }
  ],
  "marketInsight": "One paragraph market overview"
}

Include 3-5 competitors and 3 recommended ad angles. Be specific and actionable.`
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);

    // Fetch OG images from competitor URLs
    const competitorsWithImages = await Promise.all(
      (result.competitors || []).map(async (comp: { name: string; url: string; positioning: string; adStrategy: string; strengths: string[]; weaknesses: string[] }) => {
        if (!comp.url) return comp;
        try {
          const pageRes = await fetch(comp.url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; MaktMakrBot/1.0)" },
            signal: AbortSignal.timeout(5000),
          });
          if (!pageRes.ok) return comp;
          const html = await pageRes.text();
          // Extract OG image
          const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i);
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          return {
            ...comp,
            ogImage: ogMatch?.[1] || null,
            favicon: faviconMatch?.[1] ? new URL(faviconMatch[1], comp.url).href : null,
            title: titleMatch?.[1]?.trim() || comp.name,
          };
        } catch {
          return comp;
        }
      })
    );

    result.competitors = competitorsWithImages;

    // Generate sample ad templates based on recommended angles + our product
    const sampleTemplates = (result.recommendedAngles || []).map((angle: { angle: string; description: string; example: string }, i: number) => ({
      id: `template-${i}`,
      angle: angle.angle,
      headline: angle.example,
      description: angle.description,
      concept: i === 0 ? "benefit-driven" : i === 1 ? "comparison" : "pain-point",
      productImage: analysis.screenshots?.[0] || analysis.logoUrl || null,
      productName: analysis.productName,
      brandColor: analysis.brandColors?.[0] || "#4F46E5",
    }));
    result.sampleTemplates = sampleTemplates;

    // Caching dropped during the Postgres migration — competitor analysis
    // is regenerated on demand. Re-add a JSONB column on SiteAnalysis if
    // we need persistence again.

    return NextResponse.json(result);
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Competitor analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
