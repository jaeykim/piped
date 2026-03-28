import type { SiteAnalysis } from "@/types/analysis";
import type { CreativeConcept, CreativeSubject } from "@/types/creative";

/**
 * Real Meta ad visual templates extracted from high-performing campaigns.
 * Each returns a CONCRETE Imagen prompt (for person/animal) or Gemini prompt (for product).
 *
 * Sources: Meta Ad Library analysis of Shopify, Monday.com, Notion, HubSpot,
 * Slack, Linear, Ramp, Stripe, Calm, Headspace campaigns.
 */

interface TemplateContext {
  product: string;
  industry: string;
  audience: string;
  features: string;
  colors: string;
  value: string;
}

function ctx(analysis: SiteAnalysis): TemplateContext {
  return {
    product: analysis.productName,
    industry: analysis.industry,
    audience: analysis.targetAudience.slice(0, 2).join(" and "),
    features: analysis.keyFeatures.slice(0, 3).join(", "),
    colors: analysis.brandColors.slice(0, 2).join(" and ") || "#4F46E5 and #ffffff",
    value: analysis.valueProposition,
  };
}

// ─── IMAGEN prompts (person/animal) — must be SHORT and vivid ───

const PERSON_TEMPLATES: Record<CreativeConcept, (c: TemplateContext) => string> = {
  "product-hero": (c) =>
    `Professional advertising photo: A confident ${["young woman", "young man", "female entrepreneur", "male developer"][Math.floor(Math.random() * 4)]} in modern business casual, photographed from chest up, looking directly at camera with a warm confident smile. They're in a beautifully lit modern office with soft bokeh background in ${c.colors} tones. Clean, editorial style like a Shopify merchant success story ad. Dramatic cinematic lighting from the left, shallow depth of field. 1080x1080 square crop, centered subject. No text.`,

  "before-after": (c) =>
    `Split-screen advertising photo: On the LEFT, a ${["young professional", "startup founder", "marketer"][Math.floor(Math.random() * 3)]} looking stressed and frustrated at a messy desk with papers scattered, blue-gray desaturated color grading. On the RIGHT, the SAME person now looking relaxed and confident in a clean modern workspace, warm golden-hour lighting, vibrant colors. Clear visual split down the middle. Professional ad photography, like a Monday.com before/after campaign. No text.`,

  "social-proof": (c) =>
    `Professional headshot-style advertising photo: A ${["smiling woman", "confident man", "happy professional"][Math.floor(Math.random() * 3)]} photographed in natural light, warm tones, looking slightly off-camera with a genuine satisfied expression — like they just achieved something great. Soft blurred background in warm neutral tones. Shot like a customer testimonial photo for ${c.industry} brand. Portrait orientation crop, subject on left third. Professional, authentic, NOT stock-photo. No text.`,

  urgency: (c) =>
    `Dynamic advertising photo: A ${["focused young professional", "energetic entrepreneur", "determined marketer"][Math.floor(Math.random() * 3)]} captured mid-action — typing on laptop with intense focus, or reaching forward with urgency and excitement. Dramatic lighting with warm/orange accent light from one side. Modern workspace, slightly motion-blurred background suggesting speed. High-energy, editorial advertising style like a tech startup launch ad. No text.`,

  lifestyle: (c) =>
    `Lifestyle advertising photo: A ${["creative professional", "relaxed entrepreneur", "happy freelancer"][Math.floor(Math.random() * 3)]} in an aspirational setting — beautiful sunlit cafe, rooftop terrace, or minimalist home office. They're casually glancing at their laptop with a content, peaceful expression. Warm golden-hour lighting, plants and coffee nearby, shallow depth of field. The mood is "I've got everything under control." Like a Calm or Notion lifestyle ad. No text.`,

  "problem-solution": (c) =>
    `Advertising photo with narrative: A ${["professional woman", "startup founder", "team lead"][Math.floor(Math.random() * 3)]} having an "aha moment" — eyes lighting up, slight smile breaking through, finger pointing at their laptop screen. Clean modern workspace, soft natural lighting. The expression captures the exact moment of discovering a solution. Like a HubSpot or Zapier "eureka" ad moment. Warm, authentic, professional. No text.`,
};

const ANIMAL_TEMPLATES: Record<CreativeConcept, (c: TemplateContext) => string> = {
  "product-hero": (c) => {
    const animal = ["orange tabby cat", "golden retriever", "corgi", "british shorthair cat", "shiba inu"][Math.floor(Math.random() * 5)];
    return `Adorable advertising photo: A ${animal} sitting upright at a clean modern desk, looking directly at camera with big curious eyes. Soft ring-light reflection visible in eyes. Clean minimalist workspace background with ${c.colors} color accents. Professional pet photography with shallow depth of field, warm studio lighting. The animal looks like a tiny CEO. Cute, shareable, high-end ad quality. 1080x1080. No text.`;
  },

  "before-after": (c) => {
    const animal = ["cat", "golden retriever", "corgi"][Math.floor(Math.random() * 3)];
    return `Humorous split advertising photo: LEFT side — a ${animal} looking confused and overwhelmed surrounded by scattered papers and tangled cables, desaturated blue-gray tones. RIGHT side — the SAME ${animal} looking smug and satisfied at a perfectly organized desk, warm golden lighting, everything neat. Clear split composition. Professional pet photography, like a viral SaaS ad. No text.`;
  },

  "social-proof": (c) => {
    const animal = ["cat wearing tiny glasses", "golden retriever in a bow tie", "corgi with a headset"][Math.floor(Math.random() * 3)];
    return `Charming advertising photo: A ${animal}, sitting confidently, looking at camera with a proud expression. Clean bright background with warm white tones. Shot like an endorsement photo — as if this animal is the world's cutest brand ambassador. Professional lighting, pin-sharp focus on the face, soft background blur. The vibe is "even this ${animal.split(" ")[0]} approves." No text.`;
  },

  urgency: (c) => {
    const animal = ["cat", "dog", "corgi"][Math.floor(Math.random() * 3)];
    return `Action advertising photo: A ${animal} in an alert, excited pose — ears perked up, body leaning forward, wide eyes full of anticipation. Dynamic angle shot from slightly below. Dramatic lighting with warm accent. The energy says "something amazing is about to happen." Fast shutter freeze, sharp detail. Professional advertising quality. No text.`;
  },

  lifestyle: (c) => {
    const animal = ["cat curled up", "golden retriever lying", "corgi napping"][Math.floor(Math.random() * 3)];
    return `Cozy lifestyle advertising photo: A ${animal} on a plush blanket next to an open laptop in a warm, sunlit living room. Plants, a coffee mug, and soft throws nearby. Golden hour light streaming through windows. The mood is pure comfort and contentment — "the good life." Shallow depth of field, warm color grading. Like a premium lifestyle brand ad. No text.`;
  },

  "problem-solution": (c) => {
    const animal = ["cat", "golden retriever", "corgi"][Math.floor(Math.random() * 3)];
    return `Narrative advertising photo: A ${animal} that was tangled in yarn/cables (visible in background) now sitting free and proud next to a clean workspace. The ${animal} has a triumphant, satisfied expression. Warm lighting, clean modern setting. The contrast between the mess behind and the clean present tells a story. Professional pet photography, ad quality. No text.`;
  },
};

// ─── GEMINI prompts (product) — can reference screenshots ───

const PRODUCT_TEMPLATES: Record<CreativeConcept, (c: TemplateContext, hasScreenshot: boolean) => string> = {
  "product-hero": (c, hasScreenshot) =>
    `Create a premium SaaS product advertisement visual. ${hasScreenshot ? "Use the attached website screenshot as the product interface displayed on" : "Show a clean, modern dashboard UI inside"} a MacBook Pro 2024, floating at 12° angle with a long soft shadow beneath. Background: rich dark gradient from #0f172a (top-left) to #1e3a5f (bottom-right). Soft radial glow in ${c.colors} behind the laptop (15% opacity, large radius). Subtle grain texture across the entire background (6% opacity). The laptop takes up 55% of the frame, positioned in the right-center. Left side is clean gradient for text overlay. Style reference: Linear.app or Vercel product launch ads. No text, no words, no letters on the image.`,

  "before-after": (c, hasScreenshot) =>
    `Create a before/after SaaS advertisement visual. Diagonal split at 15° angle dividing the frame. LEFT 45%: desaturated, chaotic — show a messy spreadsheet interface, cluttered tabs, red error indicators, tangled workflow lines. Color: gray (#94a3b8) with slight red tint. RIGHT 55%: clean, organized — ${hasScreenshot ? "the attached website screenshot in" : "a clean modern dashboard inside"} a floating device frame with subtle green glow (#22c55e at 10%). Background transitions from near-black on left to brand gradient (${c.colors}) on right. Smooth gradient divider, not a hard line. Style: Monday.com comparison ads. No text on the image.`,

  "social-proof": (c, hasScreenshot) =>
    `Create a social-proof SaaS advertisement visual. Clean warm-white (#fafaf9) background with subtle gradient. Center: a floating card element (white, 20px radius, soft shadow 0 20px 60px rgba(0,0,0,0.08)) with golden star icons (★★★★★) and small colorful avatar circles suggesting users. ${hasScreenshot ? "The attached website screenshot appears small in the bottom-right at 8° angle, partially cropped." : "A small device mockup in the bottom-right corner."} Scattered subtle trust elements: small badge shapes, check icons. Light, editorial, trustworthy feeling. Style: G2 Leader or Trustpilot featured ads. No text.`,

  urgency: (c, hasScreenshot) =>
    `Create an urgency-driven SaaS advertisement visual. Bold, energetic background: dark-to-vibrant gradient using ${c.colors}. A floating countdown-style element: rounded dark panel with subtle inner glow. ${hasScreenshot ? "The attached website screenshot in a small device frame" : "A product UI mockup"} positioned off-center with a pulsing brand-color halo glow. Rotated small badge element (-3°) in contrasting warm color (coral or amber). 2-3 soft bokeh light dots for depth. Grain texture (6%). High energy but not chaotic — like a Product Hunt launch day ad. No text.`,

  lifestyle: (c, hasScreenshot) =>
    `Create an aspirational lifestyle advertisement visual for a tech product. Warm, beautiful scene: a clean modern workspace with a laptop ${hasScreenshot ? "showing the attached screenshot" : "with a clean UI visible"}, a ceramic coffee mug, a small potted plant, soft notebook. Golden-hour warm lighting from a window (left side). Soft depth of field — foreground items slightly blurred, laptop in focus. Color palette: warm neutrals with ${c.colors} accents. The mood is productive serenity. Style reference: Notion or Superhuman lifestyle ads. No people, no animals — just the beautiful workspace. No text.`,

  "problem-solution": (c, hasScreenshot) =>
    `Create a problem-to-solution SaaS advertisement visual. Composition flows from top-left (problem) to bottom-right (solution) in a Z-pattern. PROBLEM area (top-left 40%): near-black (#1e1e2e) with red-orange glow, showing tangled connection lines, error-state UI fragments, chaos indicators. SOLUTION area (bottom-right 60%): brand gradient (${c.colors}), clean — ${hasScreenshot ? "the attached website screenshot in a device mockup" : "a clean dashboard mockup"} with subtle green glow. Smooth curved divider between zones. Style: Zapier or ClickUp "stop the chaos" ads. No text.`,
};

export function getImagenPrompt(
  analysis: SiteAnalysis,
  concept: CreativeConcept,
  subject: CreativeSubject
): string {
  const c = ctx(analysis);

  if (subject === "person") {
    return PERSON_TEMPLATES[concept](c) + ` The photo should relate to the ${c.industry} industry.`;
  }
  if (subject === "animal") {
    return ANIMAL_TEMPLATES[concept](c);
  }

  // Product — this shouldn't be called for product (uses Gemini), but fallback
  return PRODUCT_TEMPLATES[concept](c, false);
}

export function getGeminiPrompt(
  analysis: SiteAnalysis,
  concept: CreativeConcept,
  hasScreenshot: boolean
): string {
  const c = ctx(analysis);
  return PRODUCT_TEMPLATES[concept](c, hasScreenshot);
}
