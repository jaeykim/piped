import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import type { SiteAnalysis } from "@/types/analysis";
import type { CreativeSize, CreativePlatform, CreativeConcept, CreativeSubject } from "@/types/creative";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ImageRequest {
  size: CreativeSize;
  platform: CreativePlatform;
  concept: CreativeConcept;
  subject?: CreativeSubject;
  overlayText?: string;
  websiteUrl?: string;
  language?: string;
  country?: string;
  styleRef?: string; // AD_STYLE_REFERENCES id
}

const sizeConfig: Record<CreativeSize, { aspectRatio: string }> = {
  "1080x1080": { aspectRatio: "1:1" },
  "1200x628": { aspectRatio: "16:9" },
  "1080x1920": { aspectRatio: "9:16" },
  "1200x1200": { aspectRatio: "1:1" },
};

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const mime = (res.headers.get("content-type") || "image/png").split(";")[0];
    if (mime.includes("svg")) return null;
    return { data: Buffer.from(await res.arrayBuffer()).toString("base64"), mimeType: mime };
  } catch { return null; }
}

async function captureWebsiteScreenshot(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&strategy=DESKTOP`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.lighthouseResult?.audits?.["final-screenshot"]?.details?.data;
    if (!d || typeof d !== "string") return null;
    const [h, b] = d.split(",");
    return { data: b, mimeType: h?.match(/data:([^;]+)/)?.[1] || "image/jpeg" };
  } catch { return null; }
}

// ─── Real Meta Ad Composition Templates ───
// Based on Meta Ad Library analysis of Asana, Monday.com, Stripe, Webflow,
// Shopify, Jones Road, Magic Spoon, HubSpot, Notion, Linear campaigns.

function getCompositionTemplate(concept: CreativeConcept, subject: CreativeSubject, analysis: SiteAnalysis): string {
  const product = analysis.productName;
  const industry = analysis.industry;
  const audience = analysis.targetAudience[0] || "professionals";
  const colors = analysis.brandColors.join(", ") || "#4F46E5, white";

  // Subject-specific base scenes — fill the frame, minimal empty space
  const subjectScenes: Record<CreativeSubject, string> = {
    "graphic-card": `A FULL-FRAME graphic design composition for a ${industry} ad about "${product}". The entire image must be FILLED with visual elements — no empty space, no plain backgrounds. Include: ${
      industry.includes("뷰티") || industry.includes("beauty") || industry.includes("cosmetic")
        ? "cosmetic products, skincare bottles arranged beautifully, flower petals scattered, soft glowing textures"
        : industry.includes("교육") || industry.includes("education") || industry.includes("learn")
        ? "books stacked, study materials, bright academic icons, learning atmosphere"
        : industry.includes("음식") || industry.includes("food") || industry.includes("restaurant")
        ? "appetizing food close-up filling the frame, fresh ingredients, warm lighting"
        : industry.includes("피트니스") || industry.includes("fitness") || industry.includes("health")
        ? "workout equipment close-up, energy, vitality elements filling the frame"
        : industry.includes("tech") || industry.includes("SaaS") || industry.includes("software") || industry.includes("마케팅") || industry.includes("marketing")
        ? "floating UI cards, dashboard fragments, data charts, app screens, digital elements filling every corner"
        : industry.includes("fashion") || industry.includes("패션")
        ? "fabric textures filling the frame, fashion accessories, elegant close-up composition"
        : `${industry} visual elements filling the entire frame: product imagery, objects representing ${product}`
    }. Use ${colors} as palette. The ENTIRE frame must be filled — use layered elements, overlapping objects, depth. Think premium magazine ad layout. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO CHARACTERS of any language in the image.`,
    "product-ui": `A modern device (MacBook Pro 2024 or iPhone 15 Pro) FILLING 70-80% of the frame, displaying a realistic ${industry} interface for ${product}. The screen shows: ${
      analysis.keyFeatures[0] ? `UI related to "${analysis.keyFeatures[0]}"` : "a clean, data-rich dashboard"
    }. Device slightly tilted (5°) with soft shadow. Background: BRIGHT ${colors} gradient, warm natural light from a window, MINIMAL empty space around the device — the device should DOMINATE the composition. Premium, clean, well-lit environment. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS outside the device screen.`,
    "person-product": `A RICH, visually DENSE Korean Meta/Instagram ad photo for ${product} (${industry}).
Must look like a REAL top-performing Korean Instagram ad — packed with visual interest, dynamic, NOT centered or symmetrical.

PRODUCT (hero, LOWER-RIGHT or CENTER-RIGHT, ~40% of frame): ${
      industry.includes("뷰티") || industry.includes("beauty") || industry.includes("cosmetic")
        ? "Multiple skincare/beauty products (3-5 pieces) — bottles, serums, creams at different angles and sizes. Flower petals, water droplets, texture swatches scattered. One hero product LARGER than the rest. Premium flat-lay or angled product photography"
        : industry.includes("건기식") || industry.includes("supplement") || industry.includes("vitamin")
        ? "Supplement bottles and packaging (2-4 items) at different angles, some opened showing pills/capsules. Fresh fruits, herbs, citrus slices scattered. One main product LARGER and sharper. Natural health feel"
        : industry.includes("food") || industry.includes("음식")
        ? "Appetizing food beautifully styled — main dish large, supporting ingredients scattered. Steam, sauce drizzle, fresh garnishes. Overhead or 45-degree food photography angle"
        : industry.includes("피트니스") || industry.includes("fitness")
        ? "Fitness products dynamically arranged — dumbbells, bands, supplement, water bottle at DYNAMIC ANGLES (not flat). One hero product larger. Energetic, kinetic feel"
        : industry.includes("tech") || industry.includes("SaaS") || industry.includes("software")
        ? "Laptop showing product UI (angled 15-20°) with scattered desk props — coffee, sticky notes, phone, plant. The screen should be clearly visible. Warm office/cafe light from window"
        : industry.includes("fashion") || industry.includes("패션")
        ? "Fashion items flat-lay or styled — multiple pieces layered, accessories, shoes. One hero piece larger. Magazine editorial feel"
        : `${industry} products arranged DYNAMICALLY with supporting props — one hero product larger, others supporting`
    }.

PERSON (MANDATORY — the image MUST contain a visible human person):
A REAL-LOOKING ${audience} in late 20s, ~30-40% of frame.
CRITICAL POSITIONING: The person's FACE must be in the CENTER of the image (vertically at 40-60% from top, horizontally at center or center-right). The TOP 30% of the image MUST be empty/simple background — NO face, NO head, NO important content in the top 30%. Think of it as: the person is standing/sitting and we see them from chest/waist up, with empty space ABOVE their head for text. ${
      industry.includes("뷰티") || industry.includes("beauty") ? "Glowing skin, hands near face or holding product"
        : industry.includes("건기식") || industry.includes("supplement") ? "Holding product, casual healthy smile"
        : industry.includes("피트니스") || industry.includes("fitness") ? "Athletic, energetic pose with products"
        : industry.includes("fashion") || industry.includes("패션") ? "An actual person WEARING clothes, visible from waist up"
        : industry.includes("tech") || industry.includes("SaaS") || industry.includes("software") ? "Sitting at desk, friendly expression"
        : "Casually presenting product, natural expression"
    }. Leave CLEAR EMPTY SPACE above the person's head (top 30% of image = background only).

BACKGROUND: BRIGHT, WARM, and TEXTURED — NEVER dark or moody.
- BRIGHT overall tone — think DAYLIGHT flooding in, NOT evening or dim
- Use LIGHT warm tones: cream, beige, soft pink, light ${analysis.brandColors[0] || "#F5F5F0"}
- Real surface texture: white/light marble, blonde/natural wood, light pastel wall
- Warm props scattered: green leaves, flower petals, small accessories
- BRIGHT directional lighting (5000K+), cheerful and clean. The overall image should feel like a sunny morning, NOT a moody evening

COMPOSITION: Person in center, empty space on top for text.
- TOP 30%: MUST be EMPTY — only background color/texture, no person, no head, no face
- CENTER (35-65%): Person's face and upper body here
- BOTTOM (65-100%): Products, props, lower body
- The person should look natural with HEADROOM above them — like a photo with space above the head for a title
- Everything BRIGHT and warm — cheerful and inviting

STYLE: Real Korean Instagram ad — bright, warm, editorial. Think 올리브영/무신사/마켓컬리 level ads. BRIGHT warm tones, rich saturated colors, premium but approachable.
CRITICAL: ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WATERMARKS, NO CHARACTERS of ANY language anywhere in the image.`,
    "animal-mascot": `A photorealistic close-up portrait of the CUTEST ${["orange tabby cat with big round eyes", "fluffy golden retriever puppy", "smiling corgi with tongue out", "round-faced british shorthair"][Math.floor(Math.random() * 4)]} surrounded by ${industry}-related items (${
      industry.includes("뷰티") || industry.includes("beauty") ? "tiny skincare bottles, flower petals, pink setting"
        : industry.includes("tech") || industry.includes("SaaS") ? "a tiny laptop, colorful sticky notes, mini keyboard"
        : industry.includes("교육") || industry.includes("education") ? "tiny books, pencils, colorful building blocks"
        : industry.includes("피트니스") || industry.includes("fitness") ? "tiny dumbbells, yoga mat, running shoes"
        : `miniature ${industry} props`
    }). Animal FILLS 60% of frame. Bright, cheerful, pastel color accents. Eye-level, 85mm, f/2.8, warm golden light. Plain blurred background. No signs, no screens, no monitors, no UI elements, no color codes. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WRITING, NO CHARACTERS, NO HASHTAGS, NO CODES of any kind. Pure photography only.`,
  };

  // Concept-specific mood — always BRIGHT AND HOOKING
  const conceptMods: Record<CreativeConcept, string> = {
    "benefit-driven": `ENERGY: Bright, positive, showing the RESULT of using ${product}. ${subject === "graphic-card" ? `Show the OUTCOME visually — what does success look like in ${industry}? Include visual representations of the benefit (upward trending elements, glowing/highlighted product shots, before→after contrast in the visual composition). Use ${colors} boldly. The image should make someone instantly understand the value of ${product}. NOT an empty background — rich with relevant ${industry} visual elements.` : subject === "person-product" ? "Product packshot is the HERO — glowing, premium. Person in background or to the side, small, radiating confidence and satisfaction. Clean background." : subject === "animal-mascot" ? "The animal is in a VICTORY POSE — proud and smug, surrounded by success indicators. Bright setting." : `The product screen shows specific ${industry} results — real-looking UI with positive metrics. Bright background.`}`,
    "pain-point": `ENERGY: Show the PROBLEM then hint at the SOLUTION with ${product}. ${subject === "graphic-card" ? `Create a visual CONTRAST — show elements representing the common frustration in ${industry} (cluttered, chaotic, stressful visual elements) transitioning to clean, organized, satisfying elements representing ${product}'s solution. Use a split or gradient composition: the 'problem' side uses muted/gray tones, the 'solution' side uses bright ${colors}. Include actual ${industry}-relevant visual objects that the target audience (${audience}) will instantly recognize as their daily struggle. NOT a plain gradient — visually RICH with contextual elements.` : subject === "person-product" ? `Product as the SOLUTION — large, clean, prominent. Person small in background showing relief. Clean solid background with subtle contrast.` : subject === "animal-mascot" ? `The animal sitting proudly in a clean, bright space with scattered colorful props. No cables, no screens, no devices.` : `Clean organized ${industry} interface contrasting with a blurred chaotic background.`}`,
    "social-proof": `ENERGY: Trust and credibility for ${product}. ${subject === "graphic-card" ? `Show visual evidence of ${product}'s credibility — include elements like star rating visuals, user avatar grids, trust badges, review card shapes, number/stat graphics. The composition should feel like a premium editorial feature about ${product}. Bright, clean, with ${colors} accents. Include recognizable ${industry} context. NOT plain white — include trust-building visual elements.` : subject === "person-product" ? "Product front and center, premium. Person MUST be visible — warm smile, recommending gesture, face clearly shown. BRIGHT warm setting. Trust-building, testimonial feel." : subject === "animal-mascot" ? "Confident animal with trust elements — tiny badge, clean premium setting." : "Product in editorial setting with trust indicators."}`,
    "offer": `ENERGY: Exciting opportunity with ${product}! ${subject === "graphic-card" ? `HIGH ENERGY visual for a ${industry} offer — use bold ${colors} at maximum saturation. Include exciting visual elements: sparkle/burst effects, gift/deal imagery relevant to ${industry}, dynamic diagonal composition. Show a visual representation of what the user GETS (product imagery, feature previews, value visualization). The image should create URGENCY and DESIRE. Visually RICH, not plain.` : subject === "person-product" ? "Product LARGE and exciting — deal energy. Person small, thrilled, hands presenting the product. Vivid colors." : subject === "animal-mascot" ? "OVERJOYED animal with festive energy." : "Product with maximum visual energy."}`,
    "how-it-works": `ENERGY: Simple and clear with ${product}. ${subject === "graphic-card" ? `Show a visual PROCESS or FLOW related to how ${product} works in ${industry}. Include step-by-step visual elements: numbered circles, flow arrows, process diagrams, before→after mini-previews. Each visual step should represent a real feature of ${product} (${analysis.keyFeatures.slice(0, 3).join(", ")}). Clean, bright, with ${colors} accents. The viewer should instantly understand the simplicity of using ${product}. Visually INFORMATIVE, not empty.` : subject === "person-product" ? "Product shown in clear steps/stages — the hero. Person small, casually using it, delighted. Clean graphic layout." : subject === "animal-mascot" ? "Curious head-tilted expression, bright cheerful setting. No screens or devices." : "Product at its simplest — clean 1-2-3 flow."}`,
    "before-after": `ENERGY: Dramatic transformation with ${product}. ${subject === "graphic-card" ? `Split composition showing BEFORE (left: muted, chaotic, old-school ${industry} imagery) and AFTER (right: bright, clean, modern with ${colors}). Strong visual contrast. Include ${industry}-specific elements that ${audience} will recognize. The transformation should be dramatic and instantly visible.` : subject === "person-product" ? `Product as transformation hero — large in center. Small person before (tired) and after (happy) framing the product. Dramatic visual contrast.` : subject === "animal-mascot" ? `Animal going from exhausted/messy to energized/polished. Dramatic glow-up.` : `Product screen showing before (basic/cluttered) and after (polished/organized). Clean split.`}`,
    comparison: `ENERGY: Clear advantage of ${product} vs alternatives. ${subject === "graphic-card" ? `Side-by-side comparison layout: left side shows "the old way" (cluttered, slow, expensive in ${industry}), right side shows ${product}'s way (clean, fast, affordable). Use ${colors} for the winning side. Include specific ${industry} visual elements. Make the advantage OBVIOUS at a glance.` : subject === "person-product" ? `Product large and prominent as the clear winner. Person small, pointing at or choosing the product. Clean comparison feel.` : subject === "animal-mascot" ? `Animal looking happy and proud, surrounded by bright colorful props. No text, no screens.` : `Two screens side by side — competitor (cluttered) vs ${product} (clean, modern).`}`,
    urgency: `ENERGY: Act NOW for ${product}! ${subject === "graphic-card" ? `HIGH URGENCY visual — bold countdown/timer elements, "limited" badges, flash sale energy. Use BOLD ${colors} at maximum impact. Dynamic composition with diagonal lines suggesting speed. Include ${industry}-relevant value props. The viewer should feel they'll MISS OUT if they don't act.` : subject === "person-product" ? `Product LARGE with urgency energy. Person small, excited, grabbing or reaching for the product. Bold dynamic colors.` : subject === "animal-mascot" ? `Animal in a rush — running, clock ticking, excited energy.` : `Product with urgency overlays — countdown, limited badges, flash energy.`}`,
    story: `ENERGY: Authentic success story with ${product}. ${subject === "graphic-card" ? `Visual storytelling layout — show a JOURNEY from problem to solution in ${industry}. Include relatable ${audience} visual elements: a messy desk → organized workspace, small numbers → big numbers. Warm, human, aspirational. Use ${colors} for the success elements. Should feel like a real testimonial, not a generic ad.` : subject === "person-product" ? `Product in a warm, authentic setting — the hero. Person small, candid, relatable — using or holding the product naturally. Editorial feel.` : subject === "animal-mascot" ? `Animal character going on a mini adventure — from lost/confused to triumphant. Storybook feel.` : `Product showing a journey — from simple start to impressive results. Clean progression.`}`,
    question: `ENERGY: Thought-provoking hook about ${product}. ${subject === "graphic-card" ? `Visual that makes people STOP and THINK about ${industry}. Include a visual representation of the question — confused elements, question marks, a reveal moment. Use ${colors} dramatically. The composition should create curiosity — show part of the answer but not all. The viewer should feel compelled to learn more.` : subject === "person-product" ? `Product partially revealed — teaser. Person small, curious expression, looking at the product. Creates intrigue.` : subject === "animal-mascot" ? `Animal with head tilted, big curious eyes, question mark energy. Adorable and intriguing.` : `Product partially revealed — teaser composition that creates curiosity.`}`,
  };

  return `${subjectScenes[subject]}\n\n${conceptMods[concept]}`;
}

async function generateAdPrompt(
  analysis: SiteAnalysis,
  concept: CreativeConcept,
  subject: CreativeSubject,
  userCopy: string,
  language?: string,
  hasScreenshot?: boolean,
): Promise<{ hookText: string; subText: string; imagePrompt: string }> {
  const compositionTemplate = getCompositionTemplate(concept, subject, analysis);

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: `You are a Korean Meta ad copywriter who creates scroll-stopping ad headlines and image prompts.

## METHODOLOGY (Based on 200억 매출 실전 콘텐츠 기획법)

### Step 1: Identify TRIGGER SITUATION
Find the specific moment the target experiences pain/desire. NOT abstract emotions — concrete scenes.
- BAD: "다이어트 걱정인 사람"
- GOOD: "매일 아침 체중계 올라갈 때마다 한숨 나오는 순간"
- BAD: "영어를 배우고 싶은 사람"
- GOOD: "해외에서 외국인이 말 걸었는데 웃으면서 고개만 끄덕인 순간"

### Step 2: Convert SUPPLIER LANGUAGE → CUSTOMER LANGUAGE
- BAD (supplier): "아미노산이 함유되어 있어서 근육 합성에 도움"
- GOOD (customer): "1시간 운동하고 5시간 운동한 효과"
- BAD: "체계적인 커리큘럼과 전문 강사진"
- GOOD: "퇴근 후 2시간, 3개월이면 이직 포트폴리오 완성"
- BAD: "특허받은 3중 필터 시스템 탑재"
- GOOD: "수돗물 틀어서 바로 마셔도 되는 물"

### Step 3: Design MAIN + SUB copy with CAUSAL RELATIONSHIP
The main hook and subheadline must have a cause-effect or problem-solution relationship:
- Main targets emotion → Sub provides logic/proof
- Main declares result → Sub gives evidence
- Main asks question → Sub reveals answer

### Hook Writing Patterns (18종 포맷):
1. Before/After: "~했던 사람이 ~로 바뀐 비결"
2. Question/Challenge: "아직도 ~하고 계세요?" / "~인데 왜 ~하지 않으세요?"
3. Data/Numbers: specific numbers + concrete outcomes ("3개월 만에 매출 5배")
4. Loss Aversion: "~안 하면 매달 ~만원 버리는 겁니다"
5. Social Proof: "~명이 선택한" / actual customer quote
6. Native/Viral: looks like community post, memo, or tip — not an ad

### RULES FOR HOOKS:
- Must feel like "이거 내 얘기네" — target should recognize their exact situation
- Use CUSTOMER language, not feature specs
- Include a SPECIFIC number or concrete outcome when possible
- For Korean: 8-25 words. Conversational, punchy. End with question or bold claim.
- For English: 8-20 words. Benefit-driven, specific.

### RULES FOR IMAGE PROMPTS:
1. BRIGHT, WARM, ENERGETIC — never dark/moody/corporate-cold
2. Visually RICH and relevant to the product — not empty space
3. Upper portion slightly less dense for text overlay
4. End with "No text, words, letters, numbers, or watermarks in the image."
5. 4-8 sentences, every sentence = something VISIBLE
6. Include: lighting (3500-5000K, directional), camera specs (lens mm, aperture), one scroll-stopping detail
7. CRITICAL for person-product subject: The image MUST describe a visible human person with their FACE clearly shown. The person is what differentiates person-product from graphic-card. Always include a sentence describing the person's appearance, expression, and position.`,
    messages: [{
      role: "user",
      content: `Product: ${analysis.productName} (${analysis.industry})
Target: ${analysis.targetAudience.join(", ")}
Features: ${analysis.keyFeatures.join(", ")}
Value Proposition: ${analysis.valueProposition}
Brand colors: ${analysis.brandColors.join(", ") || "#4F46E5"}
Copy/Appeal: "${userCopy}"
Concept: ${concept}
Subject: ${subject}
Language: ${language || "English"}

BASE COMPOSITION (refine, don't replace):
${compositionTemplate}

Respond in this exact format:
HOOK: [Main headline — trigger situation + customer language. Must make the target think "이거 내 얘기네"]
SUB: [Subheadline — solution/proof/evidence that has CAUSAL RELATIONSHIP with the hook. 1 sentence.]
IMAGE: [4-8 sentence image prompt based on the composition above. Bright, warm, scroll-stopping.]`
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const hook = text.match(/HOOK:\s*(.+)/i)?.[1]?.trim() || userCopy;
  const sub = text.match(/SUB:\s*(.+)/i)?.[1]?.trim() || "";
  const image = text.match(/IMAGE:\s*([\s\S]+)/i)?.[1]?.trim() || compositionTemplate;

  return { hookText: hook, subText: sub, imagePrompt: image };
}

export interface GeneratedImage {
  imageData: string;
  mimeType: string;
  prompt: string;
  hookText: string;
  subText?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateImage(
  analysis: SiteAnalysis,
  request: ImageRequest,
  maxRetries = 3
): Promise<GeneratedImage> {
  const userCopy = request.overlayText || analysis.valueProposition || analysis.productName;
  const subject = request.subject || "product-ui";

  // Fetch screenshot + logo
  const [screenshotResult, logoResult] = await Promise.all([
    (async () => {
      if (request.websiteUrl) { const r = await captureWebsiteScreenshot(request.websiteUrl); if (r) return r; }
      return analysis.screenshots?.[0] ? fetchImageAsBase64(analysis.screenshots[0]) : null;
    })(),
    analysis.logoUrl ? fetchImageAsBase64(analysis.logoUrl) : Promise.resolve(null),
  ]);

  const screenshotPart = screenshotResult ? { inlineData: screenshotResult } : null;
  const logoPart = logoResult ? { inlineData: logoResult } : null;

  // Stage 1: Claude generates hook + sub + image prompt
  let hookText: string;
  let subText: string = "";
  let imagePrompt: string;

  try {
    const result = await generateAdPrompt(analysis, request.concept, subject, userCopy, request.language, !!screenshotPart);
    hookText = result.hookText;
    subText = result.subText || "";
    imagePrompt = result.imagePrompt;
  } catch (e) {
    console.error("Claude failed:", e);
    hookText = userCopy;
    imagePrompt = getCompositionTemplate(request.concept, subject, analysis);
  }

  // Inject style reference if selected
  if (request.styleRef) {
    const { AD_STYLE_REFERENCES, buildStyleReferencePrompt } = await import("./style-references");
    const style = AD_STYLE_REFERENCES.find((s) => s.id === request.styleRef);
    if (style) {
      const stylePrompt = buildStyleReferencePrompt(
        style,
        analysis.productName,
        analysis.valueProposition,
        analysis.industry,
        analysis.brandColors,
      );
      imagePrompt = `${stylePrompt}\n\nAdditional creative direction: ${imagePrompt}`;
    }
  }

  // Enforce strict no-text instruction — prepend AND append
  imagePrompt = "⚠️ ABSOLUTE RULE: DO NOT render ANY text, letters, words, numbers, characters, logos with text, watermarks, labels, price tags, or written content of ANY language in the image. The image must be PURELY VISUAL — no readable content whatsoever. If you feel the urge to add text, replace it with a decorative visual element instead.\n\n" + imagePrompt + "\n\nREMINDER: ZERO text in the image. No exceptions.";

  // Stage 2: Generate image
  const { aspectRatio } = sizeConfig[request.size];
  // All subjects use Gemini for composed ad designs
  const useImagen = false;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      let imageData: string;
      let mimeType: string;

      if (useImagen) {
        const response = await ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: imagePrompt,
          config: { numberOfImages: 1, aspectRatio },
        });
        const g = response.generatedImages?.[0];
        if (!g?.image?.imageBytes || !g.image.mimeType) throw new Error("No Imagen output");
        imageData = g.image.imageBytes;
        mimeType = g.image.mimeType;
      } else {
        const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
        if (screenshotPart) parts.push(screenshotPart);
        if (logoPart) parts.push(logoPart);
        parts.push({ text: imagePrompt + (screenshotPart ? " Use the attached screenshot as visual reference for the product interface displayed on the device screen. Do NOT copy any text from the screenshot — only use the layout and color scheme as reference." : "") });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [
            { role: "user", parts: [{ text: "You are an image generator that NEVER includes any text, letters, numbers, words, characters, watermarks, or written content of any language in the generated images. Every image you generate must be 100% text-free — purely visual elements only." }] },
            { role: "model", parts: [{ text: "Understood. I will generate images that contain absolutely zero text, letters, numbers, words, characters, or written content in any language. All images will be purely visual." }] },
            { role: "user", parts },
          ],
          config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio } },
        });
        const rp = response.candidates?.[0]?.content?.parts;
        if (!rp) throw new Error("No Gemini output");
        const ip = rp.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
        if (!ip?.inlineData?.data || !ip.inlineData.mimeType) throw new Error("No image");
        imageData = ip.inlineData.data;
        mimeType = ip.inlineData.mimeType;
      }

      return { imageData, mimeType, prompt: imagePrompt, hookText, subText };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if ((msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) && attempt < maxRetries - 1) {
        await sleep(parseInt(msg.match(/(\d+)/)?.[1] || "60") * 1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
