import type { SiteAnalysis } from "@/types/analysis";

export function buildAdCopyPrompt(analysis: SiteAnalysis, language?: string) {
  const langRule = language ? `\nWrite ALL ad copy in ${language}.` : "";
  return {
    systemPrompt:
      "You are a performance marketing expert who writes high-converting ad copy. Return ONLY valid JSON.",
    userPrompt: `Create ad copy for this product:

Product: ${analysis.productName}
Value Proposition: ${analysis.valueProposition}
Key Features: ${analysis.keyFeatures.join(", ")}
Target Audience: ${analysis.targetAudience.join(", ")}
Tone: ${analysis.tone}

Generate ads for each platform as JSON:
{
  "meta": [
    {
      "primaryText": "Main ad text (max 125 chars)",
      "headline": "Ad headline (max 40 chars)",
      "description": "Link description (max 30 chars)"
    }
  ],
  "google": [
    {
      "headline1": "First headline (max 30 chars)",
      "headline2": "Second headline (max 30 chars)",
      "headline3": "Third headline (max 30 chars)",
      "description1": "Description line 1 (max 90 chars)",
      "description2": "Description line 2 (max 90 chars)"
    }
  ]
}

Generate 3 variations for Meta and 3 for Google. Each variation should use a different angle (benefit, feature, social proof, urgency).${langRule}`,
  };
}
