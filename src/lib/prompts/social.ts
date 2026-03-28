import type { SiteAnalysis } from "@/types/analysis";

export function buildSocialPrompt(analysis: SiteAnalysis) {
  return {
    systemPrompt:
      "You are a social media strategist who creates viral, engaging posts. Return ONLY a JSON array of strings.",
    userPrompt: `Write social media posts to promote this product:

Product: ${analysis.productName}
Value Proposition: ${analysis.valueProposition}
Target Audience: ${analysis.targetAudience.join(", ")}
Tone: ${analysis.tone}
Industry: ${analysis.industry}

Generate 4 social media posts as a JSON array:
["post1", "post2", "post3", "post4"]

Requirements:
- Each post should be under 280 characters (Twitter-friendly)
- Include a mix: launch announcement, feature highlight, testimonial-style, question/engagement
- Match the brand tone
- Don't include hashtags in the copy itself`,
  };
}
