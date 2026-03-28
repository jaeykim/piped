import Anthropic from "@anthropic-ai/sdk";
import type { SiteAnalysis } from "@/types/analysis";
import type { CreativeConcept, CreativeSubject } from "@/types/creative";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AdRecommendation {
  concept: CreativeConcept;
  subject: CreativeSubject;
  reason: string;
}

export async function recommendAdStrategy(
  analysis: SiteAnalysis,
  language?: string,
): Promise<AdRecommendation[]> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    system: `You analyze products and recommend Meta ad creative strategies. Return ONLY valid JSON array.`,
    messages: [{
      role: "user",
      content: `Analyze this product and recommend the TOP 3 ad creative combinations.

Product: ${analysis.productName}
What it does: ${analysis.valueProposition}
Industry: ${analysis.industry}
Target audience: ${analysis.targetAudience.join(", ")}
Key features: ${analysis.keyFeatures.join(", ")}
Brand tone: ${analysis.tone}

Available concepts:
- "benefit-driven": Show the core benefit directly
- "pain-point": Address the audience's problem, then offer the solution
- "social-proof": Use numbers, reviews, ratings to build trust
- "offer": Highlight free trial, discount, or limited offer
- "how-it-works": Visualize how simple the product is to use

Available subjects (visual style):
- "graphic-card": Bold background color + large text overlay (most common Korean Meta ad style)
- "product-ui": Device mockup showing the product interface
- "person-product": Real person using the product
- "animal-mascot": Cute animal character for approachable branding

Return a JSON array of exactly 3 recommendations, ranked by expected performance:
[
  {"concept": "...", "subject": "...", "reason": "${language === "한국어" || language === "ko" ? "한국어로 이유 설명 (1문장)" : "One sentence reason in English"}"},
  ...
]

Pick combinations that make sense for this specific product and audience. Consider:
- B2B/SaaS → graphic-card or product-ui usually works best
- DTC/consumer → person-product works well
- If the product is data-heavy → social-proof + product-ui
- If the product is new/unknown → pain-point + graphic-card
- If there's a free tier/trial → offer + graphic-card`
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    return JSON.parse(match[0]) as AdRecommendation[];
  } catch {
    return [];
  }
}
