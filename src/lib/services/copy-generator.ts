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
    `You are a top-tier Korean Meta/Instagram performance marketer.
You create appeal points (소구점) that stop the scroll in 0.5 seconds.

CORE PRINCIPLE (from "메타 퍼포먼스 광고 A to Z"):
- Meta ads are IMPULSE purchases, not search-intent. You must create the impulse.
- Use CUSTOMER'S LANGUAGE, not the supplier's language.
  BAD (supplier): "검색동선과 전환동선 최적화"
  GOOD (customer): "신점이 무서워서 도전해보지 못하셨던 분들!"
- The first line must make the target think "이거 내 얘기네" (this is about ME)
- Main copy = problem/target situation → Sub copy = solution/result (causal relationship)
- Include SPECIFIC situation the target is in, not just demographics

Rules:
- Generate 3-5 appeal points
- Each must be MAX 15 words, in CUSTOMER'S language (not technical/marketing jargon)
- Types:
  - "hook": stops the scroll by describing the TARGET'S EXACT SITUATION. Patterns:
    * "[상황에 처한 타겟]이 나 몰래 쓰던 [제품]" (targets specific person + secret)
    * "아직도 [타겟의 고통스러운 현재 상황]하고 계세요?" (calls out their pain)
    * "[놀라운 결과]인 줄 알았는데 [제품]이었습니다" (curiosity gap)
    * "[구체적 숫자]만에 [결과]" (e.g. "61세도 100만원씩 벌 수 있는 AI 부업")
  - "benefit": the RESULT in customer's words with SPECIFIC NUMBERS
    * NOT features → OUTCOMES ("하루 833원으로 해결", "매출 2배, 시간은 절반")
  - "proof": concrete evidence that creates trust
    * Real numbers, testimonial-style, certificate/award references
- Include at least 1 hook and 1 benefit
- Be hyper-specific to THIS product and its target audience
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
        `You are a Korean Meta/Instagram ad copy expert who understands impulse-purchase psychology.

CORE RULES (from "메타 퍼포먼스 광고 A to Z"):
1. The headline must stop the scroll in 0.5 seconds
2. Use CUSTOMER'S LANGUAGE — describe their situation, not your features
3. Main (headline) and Sub (subheadline) must have a CAUSAL RELATIONSHIP:
   - headline = problem/situation → subheadline = solution/result
   - OR headline = result → subheadline = evidence/how
4. The target must think "이거 내 얘기네" when they see the headline

Rules for the headline:
- MAX 3-5 words. This goes on an ad image.
- Describe the TARGET'S SITUATION, not the product's features
- Include SPECIFIC NUMBER when possible (%, 원, 배, 명, 분)
- BAD: "마케팅 자동화 플랫폼" (supplier language)
- GOOD: "아직도 수동으로 광고 만드세요?" (customer's situation)
- For "urgency": time pressure ("이번 주만", "선착순 100명")
- For "question": provocative, targets exact pain
- For "before-after": contrast ("하루 3시간? → 3분")
- For "social-proof": lead with number ("10,000+ 팀이 선택한")
- For "offer": discount/free first ("지금 무료", "50% 할인")
- For "story": first-person ("월 매출 0원이었는데")
- For "pain-point": call out their situation ("아직도 ~하세요?")
- For "benefit-driven": state the result in their words ("3분 만에 완성")

Rules for the subheadline:
- Must COMPLETE the headline's logic (cause→effect or problem→solution)
- More detail than headline but still concise (1 sentence)

DO NOT use full sentences in headline. Short, punchy, hooking.
Return ONLY valid JSON.`,
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
