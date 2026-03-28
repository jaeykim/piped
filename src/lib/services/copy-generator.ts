import Anthropic from "@anthropic-ai/sdk";
import { buildHeadlinePrompt } from "@/lib/prompts/headlines";
import { buildDescriptionPrompt } from "@/lib/prompts/descriptions";
import { buildAdCopyPrompt } from "@/lib/prompts/ad-copy";
import { buildSocialPrompt } from "@/lib/prompts/social";
import type { SiteAnalysis } from "@/types/analysis";
import type { CopyType } from "@/types/copy";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GeneratedCopy {
  type: CopyType;
  content: string;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

function parseJson(text: string): unknown {
  const match = text.match(/[\[{][\s\S]*[\]}]/);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[0]);
}

export async function generateAllCopy(
  analysis: SiteAnalysis
): Promise<GeneratedCopy[]> {
  const results: GeneratedCopy[] = [];

  // Run all prompts in parallel
  const [headlineRes, descRes, adRes, socialRes] = await Promise.all([
    callClaude(
      ...Object.values(buildHeadlinePrompt(analysis)) as [string, string]
    ),
    callClaude(
      ...Object.values(buildDescriptionPrompt(analysis)) as [string, string]
    ),
    callClaude(
      ...Object.values(buildAdCopyPrompt(analysis)) as [string, string]
    ),
    callClaude(
      ...Object.values(buildSocialPrompt(analysis)) as [string, string]
    ),
  ]);

  // Parse headlines
  const headlines = parseJson(headlineRes) as string[];
  headlines.forEach((h) =>
    results.push({ type: "headline", content: h })
  );

  // Parse descriptions
  const descriptions = parseJson(descRes) as {
    short: string[];
    long: string[];
  };
  descriptions.short.forEach((d) =>
    results.push({ type: "description_short", content: d })
  );
  descriptions.long.forEach((d) =>
    results.push({ type: "description_long", content: d })
  );

  // Parse ad copy
  const ads = parseJson(adRes) as {
    meta: { primaryText: string; headline: string; description: string }[];
    google: {
      headline1: string;
      headline2: string;
      headline3: string;
      description1: string;
      description2: string;
    }[];
  };
  ads.meta.forEach((ad) =>
    results.push({
      type: "ad_meta",
      content: JSON.stringify(ad),
    })
  );
  ads.google.forEach((ad) =>
    results.push({
      type: "ad_google",
      content: JSON.stringify(ad),
    })
  );

  // Parse social posts
  const socials = parseJson(socialRes) as string[];
  socials.forEach((s) =>
    results.push({ type: "social", content: s })
  );

  // Add CTAs
  results.push(
    { type: "cta", content: "Get Started Free" },
    { type: "cta", content: "Try It Now" },
    { type: "cta", content: `Start Using ${analysis.productName}` }
  );

  return results;
}
