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

  // Subject-specific base scenes — MUST include product context
  const subjectScenes: Record<CreativeSubject, string> = {
    "graphic-card": `A visually rich graphic design composition for a ${industry} ad about "${product}". NOT a plain colored background — include relevant visual elements that represent the product/service: ${
      industry.includes("뷰티") || industry.includes("beauty") || industry.includes("cosmetic")
        ? "cosmetic products, skincare bottles, beauty tools, flower petals, soft glowing skin texture"
        : industry.includes("교육") || industry.includes("education") || industry.includes("learn")
        ? "books, graduation caps, study elements, bright academic environment, learning icons"
        : industry.includes("음식") || industry.includes("food") || industry.includes("restaurant")
        ? "appetizing food photography, fresh ingredients, warm plating, restaurant ambiance"
        : industry.includes("피트니스") || industry.includes("fitness") || industry.includes("health")
        ? "workout equipment, healthy lifestyle elements, energy, vitality"
        : industry.includes("tech") || industry.includes("SaaS") || industry.includes("software") || industry.includes("마케팅") || industry.includes("marketing")
        ? "floating UI elements, dashboard fragments, data visualization shapes, modern tech iconography, app screens, digital workflow visuals"
        : industry.includes("fashion") || industry.includes("패션")
        ? "fabric textures, fashion accessories, stylish lifestyle elements, elegant composition"
        : `relevant visual elements for ${industry}: product imagery, iconography, and contextual objects that represent ${product}`
    }. Use ${colors} as the primary color palette. The composition should be VISUALLY INTERESTING — not an empty background. Place visual elements on the lower half or sides, leaving the upper portion slightly cleaner (with a subtle gradient overlay) for text that will be added separately. Bright, modern, eye-catching Korean social media ad style. No text, no words, no letters, no numbers on the image.`,
    "product-ui": `A modern device (MacBook Pro 2024 or iPhone 15 Pro) displaying a realistic ${industry} interface for ${product}. The screen should show a SPECIFIC, relevant UI: ${
      analysis.keyFeatures[0] ? `a screen related to "${analysis.keyFeatures[0]}"` : "a clean, data-rich dashboard"
    }. Device at 10° tilt with realistic shadow. Background: bright gradient using ${colors}, with subtle ${industry}-related decorative elements around the device (floating icons, small UI fragments). The device takes up 40-50% of the frame. Bright, premium, inviting. No text, no words.`,
    "person-product": `A ${audience} in their late 20s, beaming with a genuine smile, in a bright ${industry}-relevant environment. They're naturally interacting with ${
      industry.includes("뷰티") || industry.includes("beauty") ? "beauty products, applying skincare, or showing glowing skin"
        : industry.includes("food") || industry.includes("음식") ? "delicious food, cooking, or enjoying a meal"
        : `a laptop or phone showing ${product}`
    }. The person takes up 50-60% of the frame, positioned on one side with the ${industry} context visible. Shot on 85mm, f/2.8, warm natural light. Authentic, warm, high-energy Instagram ad feel. No text, no words.`,
    "animal-mascot": `The CUTEST ${["orange tabby cat with big round eyes", "fluffy golden retriever puppy", "smiling corgi with tongue out", "round-faced british shorthair"][Math.floor(Math.random() * 4)]} surrounded by ${industry}-related items (${
      industry.includes("뷰티") || industry.includes("beauty") ? "tiny skincare bottles, flower petals, soft pink setting"
        : industry.includes("tech") || industry.includes("SaaS") ? "a tiny laptop, colorful sticky notes, a mini keyboard"
        : `miniature ${industry} props and items`
    }). Bright, cheerful setting with ${colors} color accents. Eye-level, 85mm, f/2.8, pin-sharp focus on eyes, warm golden light. Irresistibly cute + contextually relevant. No text, no words.`,
  };

  // Concept-specific mood — always BRIGHT AND HOOKING
  const conceptMods: Record<CreativeConcept, string> = {
    "benefit-driven": `ENERGY: Bright, positive, showing the RESULT of using ${product}. ${subject === "graphic-card" ? `Show the OUTCOME visually — what does success look like in ${industry}? Include visual representations of the benefit (upward trending elements, glowing/highlighted product shots, before→after contrast in the visual composition). Use ${colors} boldly. The image should make someone instantly understand the value of ${product}. NOT an empty background — rich with relevant ${industry} visual elements.` : subject === "person-product" ? "The person is GLOWING — big smile, confident posture, showing positive results on their device. Bright warm light." : subject === "animal-mascot" ? "The animal is in a VICTORY POSE — proud and smug, surrounded by success indicators. Bright setting." : `The product screen shows specific ${industry} results — real-looking UI with positive metrics. Bright background.`}`,
    "pain-point": `ENERGY: Show the PROBLEM then hint at the SOLUTION with ${product}. ${subject === "graphic-card" ? `Create a visual CONTRAST — show elements representing the common frustration in ${industry} (cluttered, chaotic, stressful visual elements) transitioning to clean, organized, satisfying elements representing ${product}'s solution. Use a split or gradient composition: the 'problem' side uses muted/gray tones, the 'solution' side uses bright ${colors}. Include actual ${industry}-relevant visual objects that the target audience (${audience}) will instantly recognize as their daily struggle. NOT a plain gradient — visually RICH with contextual elements.` : subject === "person-product" ? `The person shows relief — 'finally!' gesture. Environment has hints of previous ${industry} chaos (messy desk, old tools) but foreground is clean with ${product} visible.` : subject === "animal-mascot" ? `The animal sitting triumphantly among conquered ${industry} chaos — tangled cables, scattered papers — but their space is now clean and organized.` : `Clean organized ${industry} interface contrasting with a blurred chaotic background.`}`,
    "social-proof": `ENERGY: Trust and credibility for ${product}. ${subject === "graphic-card" ? `Show visual evidence of ${product}'s credibility — include elements like star rating visuals, user avatar grids, trust badges, review card shapes, number/stat graphics. The composition should feel like a premium editorial feature about ${product}. Bright, clean, with ${colors} accents. Include recognizable ${industry} context. NOT plain white — include trust-building visual elements.` : subject === "person-product" ? "Warm, inviting expression — recommending to a friend. Bright, premium environment." : subject === "animal-mascot" ? "Confident animal with trust elements — tiny badge, clean premium setting." : "Product in editorial setting with trust indicators."}`,
    "offer": `ENERGY: Exciting opportunity with ${product}! ${subject === "graphic-card" ? `HIGH ENERGY visual for a ${industry} offer — use bold ${colors} at maximum saturation. Include exciting visual elements: sparkle/burst effects, gift/deal imagery relevant to ${industry}, dynamic diagonal composition. Show a visual representation of what the user GETS (product imagery, feature previews, value visualization). The image should create URGENCY and DESIRE. Visually RICH, not plain.` : subject === "person-product" ? "THRILLED expression, pointing at something amazing. Vivid, exciting colors." : subject === "animal-mascot" ? "OVERJOYED animal with festive energy." : "Product with maximum visual energy."}`,
    "how-it-works": `ENERGY: Simple and clear with ${product}. ${subject === "graphic-card" ? `Show a visual PROCESS or FLOW related to how ${product} works in ${industry}. Include step-by-step visual elements: numbered circles, flow arrows, process diagrams, before→after mini-previews. Each visual step should represent a real feature of ${product} (${analysis.keyFeatures.slice(0, 3).join(", ")}). Clean, bright, with ${colors} accents. The viewer should instantly understand the simplicity of using ${product}. Visually INFORMATIVE, not empty.` : subject === "person-product" ? "Delighted expression of discovery. Clean bright environment, casually using device." : subject === "animal-mascot" ? "Curious head-tilted expression, looking at screen with fascinated eyes." : "Product at its simplest — clean 1-2-3 flow."}`,
    "before-after": `ENERGY: Dramatic transformation with ${product}. ${subject === "graphic-card" ? `Split composition showing BEFORE (left: muted, chaotic, old-school ${industry} imagery) and AFTER (right: bright, clean, modern with ${colors}). Strong visual contrast. Include ${industry}-specific elements that ${audience} will recognize. The transformation should be dramatic and instantly visible.` : subject === "person-product" ? `Person showing transformation — stressed/tired on one side, confident/happy on the other. Split or time-lapse feel.` : subject === "animal-mascot" ? `Animal going from exhausted/messy to energized/polished. Dramatic glow-up.` : `Product screen showing before (basic/cluttered) and after (polished/organized). Clean split.`}`,
    comparison: `ENERGY: Clear advantage of ${product} vs alternatives. ${subject === "graphic-card" ? `Side-by-side comparison layout: left side shows "the old way" (cluttered, slow, expensive in ${industry}), right side shows ${product}'s way (clean, fast, affordable). Use ${colors} for the winning side. Include specific ${industry} visual elements. Make the advantage OBVIOUS at a glance.` : subject === "person-product" ? `Person looking frustrated at one option, then relieved/happy looking at ${product}. Clear preference.` : subject === "animal-mascot" ? `Animal pushing away the old option, hugging ${product}. Cute but clear preference.` : `Two screens side by side — competitor (cluttered) vs ${product} (clean, modern).`}`,
    urgency: `ENERGY: Act NOW for ${product}! ${subject === "graphic-card" ? `HIGH URGENCY visual — bold countdown/timer elements, "limited" badges, flash sale energy. Use BOLD ${colors} at maximum impact. Dynamic composition with diagonal lines suggesting speed. Include ${industry}-relevant value props. The viewer should feel they'll MISS OUT if they don't act.` : subject === "person-product" ? `Person with urgent, excited expression — checking phone/watch, pointing at something time-sensitive.` : subject === "animal-mascot" ? `Animal in a rush — running, clock ticking, excited energy.` : `Product with urgency overlays — countdown, limited badges, flash energy.`}`,
    story: `ENERGY: Authentic success story with ${product}. ${subject === "graphic-card" ? `Visual storytelling layout — show a JOURNEY from problem to solution in ${industry}. Include relatable ${audience} visual elements: a messy desk → organized workspace, small numbers → big numbers. Warm, human, aspirational. Use ${colors} for the success elements. Should feel like a real testimonial, not a generic ad.` : subject === "person-product" ? `Person in a candid, authentic moment — real office/workspace, genuine smile. Not stock-photo perfect. Warm lighting.` : subject === "animal-mascot" ? `Animal character going on a mini adventure — from lost/confused to triumphant. Storybook feel.` : `Product showing a journey — from simple start to impressive results. Clean progression.`}`,
    question: `ENERGY: Thought-provoking hook about ${product}. ${subject === "graphic-card" ? `Visual that makes people STOP and THINK about ${industry}. Include a visual representation of the question — confused elements, question marks, a reveal moment. Use ${colors} dramatically. The composition should create curiosity — show part of the answer but not all. The viewer should feel compelled to learn more.` : subject === "person-product" ? `Person with curious/puzzled expression, finger on chin, looking at something off-screen. Inviting body language.` : subject === "animal-mascot" ? `Animal with head tilted, big curious eyes, question mark energy. Adorable and intriguing.` : `Product partially revealed — teaser composition that creates curiosity.`}`,
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
): Promise<{ hookText: string; imagePrompt: string }> {
  const compositionTemplate = getCompositionTemplate(concept, subject, analysis);

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `You create image prompts for Meta ads. Your users have ZERO marketing experience.

RULES:
1. The image must be BRIGHT, WARM, and ENERGETIC.
2. The image must be VISUALLY RICH and RELEVANT to the product. NOT a plain colored background or generic stock photo. Include visual elements that represent the specific product, industry, and features.
3. The upper portion should have slightly less visual density (for text overlay), but the overall image must be engaging on its own.
4. Think of the best Meta ads you've seen — they always show SOMETHING related to the product, not empty space.

MOOD MAPPING from marketing copy:
- Time savings → person ENJOYING free time, bright relaxed setting, "I have all this extra time now"
- Cost savings → person looking THRILLED at results, vibrant confident setting
- Simplicity → clean bright space, "wow that was easy" delight, lots of white and light
- Growth → upward energy, celebration, bright ambitious setting, golden hour
- Automation → freedom, leisure, sun-drenched setting, "while I relax, it works for me"
- Security → warm trust, calm confidence, well-lit, premium but approachable

PROMPT STRUCTURE: [Subject] → [Big expression/emotion] → [Bright setting] → [Warm lighting: always 3500-5000K, always directional, always named] → [Camera: lens mm, aperture] → [One scroll-stopping detail]

ALWAYS: End with "No text, words, letters, numbers, or watermarks in the image."
ALWAYS: 4-8 sentences, every sentence = something VISIBLE.
NEVER: Dark/moody, corporate-cold, dim lighting, muted colors, serious expressions.`,
    messages: [{
      role: "user",
      content: `Product: ${analysis.productName} (${analysis.industry})
Target: ${analysis.targetAudience.join(", ")}
Features: ${analysis.keyFeatures.join(", ")}
Brand colors: ${analysis.brandColors.join(", ") || "#4F46E5"}
Copy: "${userCopy}"
Concept: ${concept}
Subject: ${subject}
Language for hook: ${language || "English"}

BASE COMPOSITION (refine this, don't replace entirely):
${compositionTemplate}

Respond in this exact format:
HOOK: [Attention-grabbing headline in ${language || "English"}, 8-20 words. For Korean: use conversational question format like "아직도 ~하고 계세요?" or bold claim like "~하는 법". For English: use benefit-driven statement. Must include a SPECIFIC number or concrete outcome when possible. NOT a vague tagline — a real benefit that makes someone stop scrolling.]
IMAGE: [4-8 sentence image prompt. Start with the composition base above, then ADD specific details based on the copy's emotion. Include exact lighting, camera specs, and one unique visual element that stops scrolling.]`
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const hook = text.match(/HOOK:\s*(.+)/i)?.[1]?.trim() || userCopy;
  const image = text.match(/IMAGE:\s*([\s\S]+)/i)?.[1]?.trim() || compositionTemplate;

  return { hookText: hook, imagePrompt: image };
}

export interface GeneratedImage {
  imageData: string;
  mimeType: string;
  prompt: string;
  hookText: string;
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

  // Stage 1: Claude generates hook + image prompt
  let hookText: string;
  let imagePrompt: string;

  try {
    const result = await generateAdPrompt(analysis, request.concept, subject, userCopy, request.language, !!screenshotPart);
    hookText = result.hookText;
    imagePrompt = result.imagePrompt;
  } catch (e) {
    console.error("Claude failed:", e);
    hookText = userCopy;
    imagePrompt = getCompositionTemplate(request.concept, subject, analysis);
  }

  // Ensure no-text instruction
  if (!imagePrompt.toLowerCase().includes("no text")) {
    imagePrompt += " No text, words, letters, numbers, or watermarks in the image.";
  }

  // Stage 2: Generate image
  const { aspectRatio } = sizeConfig[request.size];
  // Imagen for photos (person, animal), Gemini for design (product-ui, graphic-card)
  const useImagen = subject === "person-product" || subject === "animal-mascot";

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
        parts.push({ text: imagePrompt + (screenshotPart ? " Use the attached screenshot as the product interface displayed on the device screen." : "") });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [{ role: "user", parts }],
          config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio } },
        });
        const rp = response.candidates?.[0]?.content?.parts;
        if (!rp) throw new Error("No Gemini output");
        const ip = rp.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
        if (!ip?.inlineData?.data || !ip.inlineData.mimeType) throw new Error("No image");
        imageData = ip.inlineData.data;
        mimeType = ip.inlineData.mimeType;
      }

      return { imageData, mimeType, prompt: imagePrompt, hookText };
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
