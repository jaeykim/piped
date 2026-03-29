import type { CrawlResult } from "@/lib/services/crawler";

const LOCALE_NAMES: Record<string, string> = {
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese",
  en: "English",
};

export function buildAnalysisPrompt(crawl: CrawlResult, locale?: string) {
  const lang = LOCALE_NAMES[locale?.split("-")[0] || ""] || "English";
  const systemPrompt = `You are a marketing strategist and brand analyst. Analyze the website data provided and extract key marketing insights. Return ONLY valid JSON with no markdown formatting. ALL text values in the JSON (productName, valueProposition, targetAudience, keyFeatures, tone, industry, summary) MUST be written in ${lang}.`;

  const subPagesSection =
    crawl.subPages && crawl.subPages.length > 0
      ? `\n\nSub-pages crawled (${crawl.subPages.length} pages):\n${crawl.subPages
          .map(
            (p) =>
              `--- ${p.url} ---\nTitle: ${p.title}\nDescription: ${p.metaDescription}\nHeadings: ${p.headings.slice(0, 5).join(", ")}\nContent: ${p.bodyText.slice(0, 500)}`
          )
          .join("\n\n")}`
      : "";

  const userPrompt = `Analyze this website and ALL its sub-pages to extract marketing-relevant information.

URL: ${crawl.url}
Title: ${crawl.title}
Meta Description: ${crawl.metaDescription}
OG Title: ${crawl.ogTitle || "N/A"}
OG Description: ${crawl.ogDescription || "N/A"}
Keywords: ${crawl.keywords || "N/A"}

Main page headings:
${crawl.headings.join("\n")}

Main page content (excerpt):
${crawl.bodyText.slice(0, 3000)}
${subPagesSection}

Images found: ${crawl.images.length}
Image alt texts: ${crawl.images.map((i) => i.alt).filter(Boolean).join(", ")}

Colors found: ${crawl.colors.join(", ")}

Use ALL the information above — including sub-pages — to build a complete picture of what this product does, its features, pricing, and target audience.

Return a JSON object with these fields:
{
  "productName": "the product/service name",
  "valueProposition": "one clear sentence about what this product does and why it matters",
  "targetAudience": ["audience segment 1", "audience segment 2", "audience segment 3"],
  "keyFeatures": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "tone": "one word describing the brand tone (e.g., professional, playful, minimal, bold, friendly)",
  "industry": "the industry or category this product belongs to",
  "brandColors": ["#hex1", "#hex2", "#hex3"],
  "summary": "A 2-3 sentence marketing brief summarizing what this product is, who it's for, and its main selling points"
}`;

  return { systemPrompt, userPrompt };
}
