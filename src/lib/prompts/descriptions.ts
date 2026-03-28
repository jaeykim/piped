import type { SiteAnalysis } from "@/types/analysis";

export function buildDescriptionPrompt(analysis: SiteAnalysis) {
  return {
    systemPrompt:
      "You are a world-class copywriter. Return ONLY valid JSON with no markdown.",
    userPrompt: `Write marketing descriptions for this product:

Product: ${analysis.productName}
Value Proposition: ${analysis.valueProposition}
Key Features: ${analysis.keyFeatures.join(", ")}
Target Audience: ${analysis.targetAudience.join(", ")}
Tone: ${analysis.tone}

Generate the following as a JSON object:
{
  "short": ["3 short descriptions (1-2 sentences, under 150 chars each)"],
  "long": ["2 long descriptions (2-3 sentences, around 250 chars each)"]
}

Make each description unique in angle: feature-focused, benefit-focused, emotion-focused.`,
  };
}
