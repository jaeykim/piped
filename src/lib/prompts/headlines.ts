import type { SiteAnalysis } from "@/types/analysis";

export function buildHeadlinePrompt(analysis: SiteAnalysis) {
  return {
    systemPrompt:
      "You are a world-class copywriter specializing in conversion-optimized headlines. Return ONLY a JSON array of strings.",
    userPrompt: `Generate 5 compelling headlines for this product:

Product: ${analysis.productName}
Value Proposition: ${analysis.valueProposition}
Target Audience: ${analysis.targetAudience.join(", ")}
Tone: ${analysis.tone}
Industry: ${analysis.industry}

Requirements:
- Each headline should be under 60 characters
- Mix of benefit-driven, curiosity-driven, and action-driven styles
- Avoid cliches and generic phrases
- Match the brand tone: ${analysis.tone}

Return as JSON array: ["headline1", "headline2", ...]`,
  };
}
