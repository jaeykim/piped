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
  analysis: SiteAnalysis,
  language?: string
): Promise<GeneratedCopy[]> {
  const results: GeneratedCopy[] = [];

  // Run all prompts in parallel
  const [headlineRes, descRes, adRes, socialRes] = await Promise.all([
    callClaude(
      ...Object.values(buildHeadlinePrompt(analysis, language)) as [string, string]
    ),
    callClaude(
      ...Object.values(buildDescriptionPrompt(analysis, language)) as [string, string]
    ),
    callClaude(
      ...Object.values(buildAdCopyPrompt(analysis, language)) as [string, string]
    ),
    callClaude(
      ...Object.values(buildSocialPrompt(analysis, language)) as [string, string]
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

export interface AppealPoint {
  text: string;
  type: "hook" | "benefit" | "proof";
  role: "primary" | "secondary";
}

export async function generateAppealPoints(
  analysis: SiteAnalysis,
  language?: string
): Promise<AppealPoint[]> {
  const lang = language || "Korean";
  const res = await callClaude(
    `You are a top-tier performance marketer who writes ZET-style appeal points (소구점) for ads.
Each appeal point is a short, punchy statement that captures ONE reason why the target audience should care about the product.

Rules:
- Generate 3-5 appeal points
- Each must be 1 short sentence, MAX 15 words
- Types:
  - "hook": provocative attention grabber that stops the scroll. Use patterns like:
    * "[직업]이 나 몰래 쓰던 [제품]" (e.g. "열 살 원장님이 나 몰래 쓰던 예약 솔루션")
    * "아직도 [고통]하고 계세요?" (e.g. "아직도 수동으로 마케팅하고 계세요?")
    * "[놀라운 사실]인 줄 알았던 [제품명]" (e.g. "빼빠라인인줄 알았던 친구가 나 몰래 먹었던 그 제품")
  - "benefit": clear outcome the user gets with SPECIFIC NUMBERS (e.g. "매일 3시간 절약, 매출은 2배", "하루 833원으로 해결")
  - "proof": social proof or concrete numbers (e.g. "이미 10,000개 팀이 선택", "만족도 4.9")
- Include at least 1 hook and 1 benefit
- Be specific to THIS product — no generic filler
- Write in ${lang}

Return ONLY a JSON array:
[{"text": "...", "type": "hook|benefit|proof"}, ...]`,
    `Product: ${analysis.productName}
Value Proposition: ${analysis.valueProposition || "N/A"}
Key Features: ${(analysis.keyFeatures || []).join(", ") || "N/A"}
Target Audience: ${(analysis.targetAudience || []).join(", ") || "N/A"}
Industry: ${analysis.industry || "N/A"}

Generate appeal points.`
  );

  const parsed = parseJson(res) as { text: string; type: "hook" | "benefit" | "proof" }[];

  return parsed.map((point, i) => ({
    text: point.text,
    type: point.type,
    role: i === 0 ? "primary" as const : "secondary" as const,
  }));
}

export interface CopyTrio {
  headline: string;
  subheadline: string;
  cta: string;
}

export async function selectCopyTrio(
  variants: { type: string; content: string }[],
  concept: string,
  language?: string,
  appealPoints?: AppealPoint[]
): Promise<CopyTrio> {
  const headlines = variants.filter((v) => v.type === "headline").map((v) => v.content);
  const descriptions = variants.filter((v) => ["description_short", "description_long"].includes(v.type)).map((v) => v.content);
  const ctas = variants.filter((v) => v.type === "cta").map((v) => v.content);

  const primaryAppeal = appealPoints?.find((a) => a.role === "primary");
  const secondaryAppeals = appealPoints?.filter((a) => a.role === "secondary") || [];
  const appealSection = appealPoints?.length
    ? `\n\nAppeal Points (소구점) — use these to guide headline/subheadline selection:
Primary: "${primaryAppeal?.text || ""}" (${primaryAppeal?.type || ""})
Secondary: ${secondaryAppeals.map((a) => `"${a.text}" (${a.type})`).join(", ") || "none"}
The headline MUST reflect the primary appeal point's message. The subheadline may incorporate secondary appeal points.`
    : "";

  // If we have enough variants, let Claude pick the best combo
  if (headlines.length > 0 && descriptions.length > 0) {
    try {
      const res = await callClaude(
        `You are a Korean performance marketing expert specializing in Meta/Instagram ads. Pick and ENHANCE the best headline + subheadline + CTA for the given concept. Return ONLY valid JSON.

Rules for the headline (most important):
- MAX 3-5 words. This goes on an ad image.
- Include a SPECIFIC NUMBER when possible (%, 원, 배, 명, 분, 시간)
- For "urgency": add time pressure ("이번 주만", "선착순 100명")
- For "question": make it provocative and curiosity-inducing
- For "before-after": show the contrast ("하루 3시간? → 3분")
- For "social-proof": lead with the number ("10,000+ 팀")
- For "offer": lead with the discount/free ("지금 무료", "50% 할인")
- For "comparison": name the old way vs new ("수동 vs AI")
- For "story": use first-person voice ("월 매출 0원이었는데")
- For "pain-point": start with the pain ("아직도 ~하세요?")
- For "benefit-driven": state the result ("3분 만에 완성")
DO NOT use full sentences. Short, punchy, hooking.`,
        `Pick the best combination for a "${concept}" ad concept${language ? ` in ${language}` : ""}.

Available headlines: ${JSON.stringify(headlines)}
Available descriptions: ${JSON.stringify(descriptions)}
Available CTAs: ${JSON.stringify(ctas)}${appealSection}

You may slightly MODIFY the selected headline to make it punchier (add numbers, shorten, add urgency).
Return JSON: {"headline": "...", "subheadline": "...", "cta": "..."}`
      );
      const match = res.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as CopyTrio;
    } catch {
      // fallback below
    }
  }

  return {
    headline: primaryAppeal?.text || headlines[0] || "Get Started Today",
    subheadline: secondaryAppeals[0]?.text || descriptions[0] || "",
    cta: ctas[0] || "Try Free",
  };
}
