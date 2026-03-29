import Anthropic from "@anthropic-ai/sdk";
import { buildAnalysisPrompt } from "@/lib/prompts/analysis";
import type { CrawlResult } from "./crawler";
import type { SiteAnalysis } from "@/types/analysis";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnalysisResult {
  productName: string;
  valueProposition: string;
  targetAudience: string[];
  keyFeatures: string[];
  tone: string;
  industry: string;
  brandColors: string[];
  summary: string;
}

export async function analyzeWebsite(
  crawl: CrawlResult,
  locale?: string
): Promise<SiteAnalysis> {
  const { systemPrompt, userPrompt } = buildAnalysisPrompt(crawl, locale);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse analysis response as JSON");
  }

  const result: AnalysisResult = JSON.parse(jsonMatch[0]);

  return {
    extractedText: crawl.bodyText,
    metaTags: {
      title: crawl.title,
      description: crawl.metaDescription,
      ogImage: crawl.ogImage,
      ogTitle: crawl.ogTitle,
      ogDescription: crawl.ogDescription,
      keywords: crawl.keywords,
    },
    productName: result.productName,
    valueProposition: result.valueProposition,
    targetAudience: result.targetAudience,
    keyFeatures: result.keyFeatures,
    tone: result.tone,
    industry: result.industry,
    brandColors: result.brandColors.length > 0 ? result.brandColors : crawl.colors.slice(0, 3),
    logoUrl: crawl.logoUrl,
    screenshots: crawl.ogImage ? [crawl.ogImage] : [],
    analyzedAt: new Date(),
  };
}
