/**
 * META AD VISUAL REFERENCE — Definitive Specification for Ad Image Generation
 *
 * Compiled from analysis of real Meta Ad Library examples, performance data,
 * and creative breakdowns from 2025-2026 campaigns across SaaS, DTC, and B2B.
 *
 * Sources: Meta Ad Library, Vaizle, Foreplay, ArtDoesAds, Superside, Madgicx,
 * Pilothouse, AdStellar, Anchour, BestEver, KlientBoost, and others.
 */

// =============================================================================
// 1. AD ANATOMY — THE FIVE COMPONENTS AND THEIR PERFORMANCE WEIGHT
// =============================================================================

export const AD_ANATOMY = {
  /**
   * A Meta ad in-feed has exactly five visual components rendered top-to-bottom:
   *
   * ┌─────────────────────────────────┐
   * │ [profile pic] Brand Name  · Sponsored │  ← Platform chrome (not editable)
   * ├─────────────────────────────────┤
   * │ Primary Text (caption)          │  ← 125 chars visible before "See More"
   * │ ...See More                     │     80% of users NEVER click "See More"
   * ├─────────────────────────────────┤
   * │                                 │
   * │                                 │
   * │        CREATIVE IMAGE           │  ← The image we generate (largest area)
   * │        (or video)               │     ~80% of visible ad real estate
   * │                                 │
   * │                                 │
   * ├─────────────────────────────────┤
   * │ Headline (bold)  [CTA Button]   │  ← 40 char limit; 27 visible on mobile
   * │ Description (gray, small)       │  ← 30 chars; NOT shown on mobile Feed
   * └─────────────────────────────────┘
   */
  components: [
    { name: "primary_text", position: "above_image", charLimit: 125, visibleDefault: true },
    { name: "creative", position: "center", performanceWeight: "60-80%" },
    { name: "headline", position: "below_image_left", charLimit: 40, mobileVisible: 27 },
    { name: "description", position: "below_headline", charLimit: 30, mobileVisible: false },
    { name: "cta_button", position: "below_image_right", options: ["Learn More", "Shop Now", "Sign Up", "Get Offer", "Download", "Book Now"] },
  ],
  performanceWeighting: {
    creative: "60-80%",
    primaryText: "15-20%",
    headline: "10-15%",
    ctaButton: "5-8%",
    description: "2-5%",
  },
  /**
   * The image-to-copy relationship is a DELIBERATE CASCADE:
   * 1. Creative captures attention (pattern interrupt in ~1.7 seconds on mobile)
   * 2. Primary text provides context and hooks interest
   * 3. Headline bridges the visual to the action
   * 4. CTA button finalizes the conversion request
   *
   * The headline should NEVER repeat the primary text. It acts as a
   * "mini value prop" bridging what they SAW (creative) to what they
   * should DO (CTA). Use it for outcome, not description.
   */
} as const;

// =============================================================================
// 2. IMAGE DIMENSIONS AND SAFE ZONES — EXACT PIXEL SPECIFICATIONS
// =============================================================================

export const IMAGE_SPECS = {
  feed: {
    square: {
      dimensions: "1080x1080",
      aspectRatio: "1:1",
      safeZone: { all: 100 }, // 100px from all edges
      notes: "Standard feed format. Works across all placements when cropped.",
    },
    portrait: {
      dimensions: "1080x1350",
      aspectRatio: "4:5",
      safeZone: { top: 250, bottom: 250, sides: 100 },
      notes: "PREFERRED — 31% more vertical screen space than square. Up to 15% higher CTR.",
    },
    landscape: {
      dimensions: "1200x628",
      aspectRatio: "1.91:1",
      safeZone: { top: 60, bottom: 60, sides: 120 },
      notes: "Link preview format. Least effective for feed performance.",
    },
  },
  stories: {
    dimensions: "1080x1920",
    aspectRatio: "9:16",
    safeZone: {
      top: 270,     // 14% — profile icon, close button, timestamp
      bottom: 380,  // 20% — CTA button, swipe-up prompt
      sides: 65,    // 6% each side
    },
  },
  reels: {
    dimensions: "1080x1920",
    aspectRatio: "9:16",
    safeZone: {
      top: 270,     // 14%
      bottom: 670,  // 35% — likes, comments, share, audio info, caption
      sides: 65,    // 6%
    },
  },
  /**
   * CENTER-SQUARE PRODUCTION METHOD (cross-placement safety):
   * Place all critical elements (headline, logo, CTA badge) within a centered
   * 1080x1080 square on a 1080x1920 canvas. The core message survives cropping
   * across Feed, Stories, and Reels without separate asset versions.
   */
  minimumResolution: "600x600",
  maxFileSize: "30MB",
  recommendedFormat: "PNG or JPG",
} as const;

// =============================================================================
// 3. VISUAL COMPOSITION ARCHETYPES — WHAT REAL BRANDS ACTUALLY USE
// =============================================================================

export const COMPOSITION_ARCHETYPES = {

  // ── 3A. PRODUCT HERO ──────────────────────────────────────────────────────
  productHero: {
    description: "Single product center-frame with bold text overlay. The image attracts, the bold text informs, the CTA directs.",
    layout: {
      product: "Center frame, occupying 40-60% of image area",
      textOverlay: "Top or upper-third — large bold headline (6-8 words max)",
      badge: "Optional bottom-left or bottom-right — price, discount, or trust seal",
      background: "Solid color, gradient, or minimal lifestyle context",
    },
    realExamples: [
      {
        brand: "Eden (Semaglutide)",
        image: "Single product vial centered on calming green gradient background",
        textOverlay: "'Is Semaglutide Right for You?' headline above product in white",
        colorScheme: "Green gradient background, white text, clean medical aesthetic",
      },
      {
        brand: "Apple AirPods",
        image: "Split-screen: AirPods case bottom, AirPods Max top. White bg, soft peach accent.",
        textOverlay: "Starting price with 'gift superior sound' tagline, minimal",
        colorScheme: "White + soft peach, minimalist Apple aesthetic",
      },
      {
        brand: "Logitech",
        image: "Bright gradient background highlighting microphone product",
        textOverlay: "Headline adjacent to product — impossible to ignore. Product name in outline font across background.",
        colorScheme: "Bright gradient, bold contrast",
      },
      {
        brand: "GoPro",
        image: "Muted palette suggesting rough environments. Particle effects showing force/motion.",
        textOverlay: "Bold blocky fonts emphasizing sturdiness. Arrow contrasting against design.",
        colorScheme: "Muted/desaturated — rugged environmental feel",
      },
    ],
    performanceData: {
      avgCTR: "1.2%",
      bestFor: "Product launches, e-commerce, feature highlights",
    },
  },

  // ── 3B. PERSON + PRODUCT (TESTIMONIAL/UGC) ────────────────────────────────
  personProduct: {
    description: "Person holding/using product in authentic setting. Looks like organic social, NOT a polished ad.",
    layout: {
      person: "Center or slight off-center, waist-up or chest-up framing",
      product: "Held in hand, visible but secondary to the person — 20-30% of frame",
      background: "Real environment (home, office, coffee shop) — NOT studio white",
      textOverlay: "Minimal or none on the image itself; let the primary text do the work. If text: quote overlay in speech-bubble style or simple caption at top.",
    },
    framing: {
      camera: "Direct-to-camera for connection, or over-shoulder for demos",
      lighting: "Natural window light preferred. Imperfections signal authenticity.",
      movement: "Slight camera shake = handheld feel. Natural transitions (hand across frame, refocus) instead of dissolves/wipes.",
    },
    realExamples: [
      {
        brand: "Jones Road Beauty",
        image: "Real people (not polished models) with before-state visuals showing heavy foundation problems, contrasted against refined results.",
        textOverlay: "Demographic targeting text overlay. Authentic skin texture visible.",
      },
      {
        brand: "Chime",
        image: "Street-interview format: real people's unscripted reactions to product revelation.",
        textOverlay: "Minimal — expression IS the message.",
      },
      {
        brand: "Magic Spoon",
        image: "UGC-style reaction showing unexpected product reveal (silicone bowl, golden spoon, genuine surprise).",
        textOverlay: "Natural lighting, candid expressions dominate.",
        colorScheme: "High saturation, colorful product. Three slogan lines overlaid.",
      },
      {
        brand: "Rhinokey Smartcard",
        image: "Hand delicately holding ultra-thin card against minimalist clean background.",
        textOverlay: "'Ping it. Find it.' bold tagline. Casual language + emoji integration.",
        colorScheme: "Clean, product-focused, urgency elements ('up to 50% OFF')",
      },
    ],
    performanceData: {
      avgCTR: "2.1% (Reels UGC format)",
      bestFor: "Trust building, cold audiences, DTC brands, beauty/wellness",
    },
  },

  // ── 3C. BEFORE/AFTER OR COMPARISON ─────────────────────────────────────────
  beforeAfter: {
    description: "Side-by-side or stacked layout contrasting problem state vs. solution state.",
    layout: {
      left_or_top: "Problem state — messy, cluttered, frustrating (desaturated or warm/harsh)",
      right_or_bottom: "Solution state — clean, organized, satisfying (vibrant, cool/calm)",
      divider: "Clear visual split (line, color shift, or label)",
      textOverlay: "Headline spanning full width, or labels on each side ('Before'/'After')",
    },
    realExamples: [
      {
        brand: "Monday.com",
        image: "Top: messy spreadsheets and clunky workflows. Bottom: clean Monday.com interface. Hand icon grabbing vertical bar, swiping away mess — storyboard effect in static form.",
        textOverlay: "'Your team deserves better' emotional hook. Guilt-based appeal with visual upgrade.",
      },
      {
        brand: "Curology",
        image: "Before-and-after split: gradual improvement (not dramatic). Authentic unfiltered skin texture.",
        textOverlay: "Minimal — the visual contrast IS the message.",
      },
      {
        brand: "Huel",
        image: "Side-by-side: instant noodles vs. Huel meal pots. Nutritional claims displayed alongside competitor.",
        textOverlay: "Direct comparison data overlaid on each side.",
      },
      {
        brand: "Opinly",
        image: "'FREE TO TRY' vs '$400+' competitor pricing — central visual contrast.",
        textOverlay: "'Spy on Your Competitors' bold headline. 'Stop wasting your time' action language.",
      },
    ],
    performanceData: {
      bestFor: "SaaS (workflow tools), skincare, health/nutrition, competitive positioning",
    },
  },

  // ── 3D. STAT/NUMBER HERO ───────────────────────────────────────────────────
  statHero: {
    description: "A single large number or percentage dominates the frame. The stat IS the hook.",
    layout: {
      stat: "Center frame, occupying 40-50% of image area. Large bold typography.",
      supportingText: "Below or beside the stat — context for the number",
      background: "Bold single color or brand color",
      icon: "Optional upward arrows, chart fragments, or directional elements",
    },
    realExamples: [
      {
        brand: "Stripe",
        image: "Large '10.5%' taking almost half the image space. Upward arrow icons.",
        textOverlay: "Percentage shares color with 'revenue growth' text.",
        colorScheme: "Brand purple/blue with white stat text",
      },
      {
        brand: "Webflow",
        image: "Large '80%' in circular graphic against vibrant green.",
        textOverlay: "Message about AI integration necessity. Black CTA button on green.",
        colorScheme: "Vibrant green background, strong contrast",
      },
    ],
    performanceData: {
      bestFor: "SaaS, B2B, fintech — anywhere data proves the value prop",
    },
  },

  // ── 3E. SOCIAL PROOF / PR SCREENSHOT ───────────────────────────────────────
  socialProof: {
    description: "Repurposed media mention, review screenshot, or testimonial quote as the primary visual.",
    layout: {
      source: "Publication logo/header at top — BBC, Forbes, TechCrunch, etc.",
      quote: "Center — the testimonial or headline from the article",
      attribution: "Bottom — name, company, star rating, or 'verified buyer' tag",
      background: "White or light neutral — mimics editorial/article format",
    },
    realExamples: [
      {
        brand: "Allplants",
        image: "BBC-branded header treatment mimicking article format. Reputable source branding integrated.",
        textOverlay: "Discount anchor alongside social proof. 'Talk of the town' positioning.",
      },
      {
        brand: "Pilot",
        image: "PR screenshot repurposing newspaper feature about Olympic athletes.",
        textOverlay: "Credibility markers + cultural moment tie-in as primary visual.",
      },
      {
        brand: "The Spa Dr.",
        image: "Layered newspaper articles with embedded TV/magazine validation logos.",
        textOverlay: "Multiple source attribution creating 'trust funnel'.",
      },
    ],
    performanceData: {
      bestFor: "Cold audiences, trust building, premium positioning",
    },
  },

  // ── 3F. LIFESTYLE/ENVIRONMENT ──────────────────────────────────────────────
  lifestyle: {
    description: "Product shown in its natural context of use. Not a studio shot.",
    layout: {
      environment: "60-70% of frame — the setting tells the story",
      product: "20-30% of frame — shown in use, not isolated",
      person: "Optional — if present, interacting naturally with product",
      textOverlay: "Minimal to none. Product name + one-line slogan maximum.",
    },
    realExamples: [
      {
        brand: "Nike (Gore-Tex)",
        image: "Shoe hitting mud in intended environment. Product durability visible in context.",
        textOverlay: "Product name + post-script slogan only. Photo quality IS the ad.",
      },
      {
        brand: "Cariuma",
        image: "Sneakers in contrasting environment with stylish lighting.",
        textOverlay: "Logo and dual-interpretation slogan only. No additional overlay.",
        colorScheme: "Minimal — photography-driven, not design-driven",
      },
      {
        brand: "Health Zone Massage",
        image: "Calming warm tones, soft candlelight. Serene setting with greenery.",
        textOverlay: "Red banner with bold white 'MASSAGE CENTER' text. 'Find Locations' CTA.",
        colorScheme: "Warm candlelight tones — peace and luxury atmosphere",
      },
    ],
  },

  // ── 3G. BOLD TYPOGRAPHY / MEME STYLE ───────────────────────────────────────
  boldTypography: {
    description: "Text IS the visual. Large bold statement on solid/gradient background.",
    layout: {
      text: "Center frame, occupying 50-70% of space. 1-2 lines maximum.",
      background: "Solid bold color, gradient, or patterned",
      logo: "Small, corner placement (bottom-right typically)",
      product: "Small or absent — the message IS the product",
    },
    realExamples: [
      {
        brand: "Canva",
        image: "Simple gradient background (brand-aligned). Double-simple-sentence slogan.",
        textOverlay: "Platform illustration showing action. Logo aligned with gradient line.",
      },
      {
        brand: "Grammarly",
        image: "Variety of font colors and highlights matching plugin functionality.",
        textOverlay: "Service attributes reflected in the ad design itself.",
      },
    ],
  },
} as const;

// =============================================================================
// 4. TEXT OVERLAY RULES — WHAT GOES ON THE IMAGE VS. IN THE COPY FIELDS
// =============================================================================

export const TEXT_OVERLAY_RULES = {
  /**
   * CRITICAL: While Meta removed the strict 20% text rule in 2021, their
   * algorithm STILL penalizes text-heavy images with higher CPMs and lower
   * delivery. Less text on image = better performance in practice.
   *
   * The old 5x5 grid system: if >5 of 25 grid squares had text, ad was rejected.
   * Now it's a sliding scale — more text = higher cost, lower reach.
   */
  maxTextCoverage: "Under 20% of image area (soft guideline, not hard rule)",
  wordCount: "6-8 words maximum on the image",

  whatGoesONtheImage: [
    "Primary value proposition (one punchy statement)",
    "Discount/offer badge ('50% OFF', 'FREE TRIAL')",
    "Social proof number ('10,000+ customers')",
    "Brand logo (small, consistent placement)",
    "CTA badge if no CTA button below ('Shop Now' overlay)",
  ],

  whatGoesINtheCopyFields: [
    "Detailed explanation of the offer",
    "Feature lists and specifications",
    "Testimonial quotes (long form)",
    "Legal disclaimers and terms",
    "Urgency messaging ('Ends Sunday')",
  ],

  positioning: {
    headline: "Upper third or center — must be readable at mobile scale",
    badge: "Bottom-left or bottom-right corner — price/offer/trust seal",
    logo: "Top-left or bottom-right — small, consistent, not competing with headline",
    safeMargins: "250px top/bottom on 4:5, never in edges that get cropped",
    avoidAreas: "Don't cover the main subject (person's face, product detail)",
  },

  typography: {
    fontStyle: "Clean sans-serif preferred. 1-2 font families maximum.",
    contrast: "High contrast between text and background — always.",
    size: "Must be readable on mobile WITHOUT zooming. Minimum ~40px at 1080px width.",
    weight: "Bold/heavy for headlines. Regular for supporting text.",
    trend2026: "Large, bold, expressive type. Oversized headers conveying confidence.",
  },

  /**
   * Meta's visual recognition system may view images with slightly different
   * text overlays as the SAME image. If the system perceives lack of diversity,
   * it punishes your account with higher CPMs. Change the CONCEPT, not just
   * the text color/position.
   */
} as const;

// =============================================================================
// 5. COLOR STRATEGY — WHAT REAL TOP-PERFORMING ADS USE
// =============================================================================

export const COLOR_STRATEGY = {
  generalPrinciples: {
    contrast: "Bold colors against neutral backgrounds. The ad must POP in a scrolling feed.",
    consistency: "Match brand palette. Random colors drop trust. Consistent colors build recognition.",
    psychology: {
      blue: "Trust, authority, depth. Used by: fintech, SaaS, healthcare.",
      red: "Urgency, passion, desire. Red CTAs outperform green by 21% (Performable study).",
      green: "Nature, health, success, savings. Used by: wellness, eco brands, fintech growth.",
      orange: "Warmth, enthusiasm, joy. Used by: food, retail, friendly brands.",
      purple: "Luxury, royalty. Light shades = tenderness. Used by: premium, beauty.",
      yellow: "Positivity, summer, playfulness. Used by: lifestyle, children's brands.",
      white: "Premium, simplicity, space. Used by: Apple, luxury, medical.",
      black: "Sophistication, power. With neon = catchy tech aesthetic.",
    },
  },

  highPerformingCombinations: [
    { combo: "Deep blue + gold/yellow", effect: "Trust + elegance", industries: "Finance, premium SaaS" },
    { combo: "Sky blue + earthy brown", effect: "Calm + grounded", industries: "Travel, hospitality" },
    { combo: "Navy + red + black", effect: "Authority + urgency", industries: "Tech, education" },
    { combo: "Orange + white + black", effect: "Warm + premium", industries: "Food, retail" },
    { combo: "Grey + green", effect: "Tech meets nature", industries: "Health tech, wellness" },
    { combo: "Black + neon accent", effect: "Modern, catchy", industries: "Tech, gaming, SaaS" },
    { combo: "Pastel palette", effect: "Dreamy, aspirational", industries: "Beauty, bakery, lifestyle" },
    { combo: "Vibrant green + black CTA", effect: "Growth + action", industries: "SaaS, productivity" },
    { combo: "White + soft peach", effect: "Premium minimal", industries: "Apple-style tech, luxury" },
    { combo: "Bold maroon + white text", effect: "Sophisticated contrast", industries: "Enterprise SaaS (Asana)" },
  ],

  colorTemperature: {
    warmLight: {
      kelvin: "2700K-4000K",
      effect: "Inviting, friendly, trustworthy. Skin tones look healthy.",
      bestFor: "Food (3000-4000K), lifestyle, beauty, fashion",
    },
    coolLight: {
      kelvin: "5500K-6500K",
      effect: "Clean, sharp, professional. Metallic finishes pop.",
      bestFor: "Technology, SaaS interfaces, medical, precision products",
    },
    neutral: {
      kelvin: "4000K-5500K",
      effect: "Balanced, natural. Accurate color reproduction.",
      bestFor: "Product photography where exact colors matter",
    },
  },

  trend2026: [
    "Bold saturated colors: neon coral, electric blue, vibrant purple making comeback",
    "Neo-mint + pastel tones for tech-forward optimism",
    "Dark backgrounds + neon typography for attention in feed",
    "Muted/desaturated palettes for premium/luxury positioning",
  ],
} as const;

// =============================================================================
// 6. FORMAT PERFORMANCE DATA
// =============================================================================

export const FORMAT_PERFORMANCE = {
  /**
   * Static images STILL drive 60-70% of Meta conversions.
   * Do NOT abandon them for video only.
   */
  formats: [
    { type: "Single Image (static)", avgCTR: 1.2, conversionShare: "60-70%", bestFor: "Offers, product showcases, bold statements" },
    { type: "Video (under 15s)", avgCTR: 1.8, conversionShare: "Growing", bestFor: "Quick demos, UGC testimonials, hooks" },
    { type: "Video (30-60s)", avgCTR: 1.4, conversionShare: "Moderate", bestFor: "Story-driven narratives, explainers" },
    { type: "Carousel", avgCTR: 1.5, conversionShare: "Strong for e-com", bestFor: "Multi-product, feature tours, step-by-step" },
    { type: "Reels (UGC-style)", avgCTR: 2.1, conversionShare: "Fastest growing", bestFor: "Native feel, cold audiences, brand awareness" },
  ],

  aspectRatioPerformance: {
    "4:5_portrait": "Up to 15% higher CTR than square in Feed. RECOMMENDED default.",
    "1:1_square": "Safe fallback. Works everywhere but optimized nowhere.",
    "9:16_vertical": "Required for Stories/Reels. 90% of Meta inventory will be vertical by end of 2026.",
    "1.91:1_landscape": "Link preview only. Lowest performer in feed.",
  },

  /**
   * Algorithm requirements for 2026:
   * - Vary formats, angles, and lengths (5-10 fundamentally different concepts per week)
   * - Creative iteration (changing the hook) ≠ creative variation (changing the concept)
   * - Healthy CPMr < $20. Rising CPMr signals audience fatigue → need creative refresh.
   * - Meta's Advantage+ auto-tests across audiences, making creative THE dominant lever.
   */
} as const;

// =============================================================================
// 7. THE 3-3-3 CREATIVE TESTING FRAMEWORK (PILOTHOUSE)
// =============================================================================

export const TESTING_FRAMEWORK = {
  /**
   * Three dimensions x three options = 27 combinations.
   * Enough variety for the algorithm, manageable scope.
   */
  dimension1_funnelLevel: [
    "TOF: Introduce problem + category. Assume zero brand awareness.",
    "MOF: Address solution evaluation + differentiation from alternatives.",
    "BOF: Drive conversion with urgency + social proof.",
  ],
  dimension2_angles: [
    "Pain point A (e.g., time savings)",
    "Pain point B (e.g., team collaboration)",
    "Pain point C (e.g., cost reduction)",
  ],
  dimension3_formats: [
    "Static image — bold value statement",
    "Video — storytelling and demonstration",
    "Catalog/DPA — dynamic optimization with multiple SKUs",
  ],
  firstThreeSeconds: {
    textHook: "Large, mobile-readable. Pose a question or make a bold claim.",
    visualHook: "Pattern interrupt — something unexpected in the image.",
    soundHook: "Attention-grabbing audio (for video). But design for sound OFF.",
    vibe: "Overall aesthetic/mood that signals 'this is for you'.",
  },
  testingProtocol: [
    "1. Test 5+ creative variations with equal budget (48-72 hours, 1500+ impressions each)",
    "2. Lock winning creative, test 3-4 primary text hooks",
    "3. Test 2-3 headlines after text is optimized",
    "4. Test CTA buttons only after previous elements show statistical significance",
    "5. Graduate winners to Advantage+ Sales Campaigns after 10-12 purchases per concept",
  ],
} as const;

// =============================================================================
// 8. CREATIVE DIVERSITY REQUIREMENTS FOR 2026
// =============================================================================

export const CREATIVE_DIVERSITY = {
  /**
   * "The brands that win are those that feed the system variety, not volume."
   * — Anchour, Meta Ads 2026 Playbook
   *
   * Launch 5-10 FUNDAMENTALLY DIFFERENT creative concepts weekly.
   * Not minor variations of the same thing.
   */
  requiredArchetypes: [
    "Cinematic founder narrative",
    "Meme-style product comparison (chaotic tone)",
    "Lo-fi UGC testimonial (iPhone quality)",
    "Motion-graphic explainer",
    "Nostalgic throwback style",
    "Bold typography on solid color",
    "Product hero with lifestyle context",
    "Before/after transformation",
    "Social proof / PR screenshot",
    "Stat/number hero",
  ],

  weeklyRotation: {
    launch: "5-10 new ads",
    evaluationPeriod: "7 days untouched",
    action: "Eliminate underperformers, scale winners",
    iteration: "Generate new concepts based on learnings",
  },

  /**
   * CRITICAL: Creative accounts for 60-80% of ad performance.
   * This determines whether your ad costs $2 or $20 per conversion.
   * Creative quality now outweighs targeting precision in Meta's system.
   */
} as const;

// =============================================================================
// 9. UGC-STYLE SPECIFIC COMPOSITION RULES
// =============================================================================

export const UGC_COMPOSITION = {
  /**
   * UGC aesthetic outperforms polished corporate creative consistently.
   * iPhone footage with real customers converts better than $10k production.
   * The sweet spot: intentional but NOT overproduced.
   */
  camera: {
    framing: "Direct-to-camera for connection. Over-shoulder for tutorials. First-person POV for demos.",
    quality: "iPhone quality — good natural lighting but NOT studio-perfect",
    movement: "Slight camera shake = handheld feel. Natural transitions (hand across frame, refocus).",
    avoid: "Dissolves, wipes, fancy transitions, effects, filters — anything that looks 'produced'",
  },

  lighting: {
    primary: "Natural window light. North-facing window for soft, even illumination.",
    avoid: "Studio setups, ring lights (too perfect), harsh overhead fluorescent",
    acceptable: "Slight variations and imperfections — these SIGNAL authenticity",
  },

  background: {
    preferred: ["Home environment", "Coffee shop", "Office desk", "Kitchen counter", "Outdoor natural"],
    avoid: ["Studio white seamless", "Sterile corporate backgrounds", "Obviously staged sets"],
  },

  textOverlay: {
    captions: "Non-negotiable. Match voiceover word-for-word.",
    hookText: "First frame — bold text stating the hook",
    benefits: "Key benefit callouts at natural transition points",
    cta: "Clear CTA in final seconds",
    style: "Simple white text with dark shadow/outline. Or colored brand accent.",
  },

  aspectRatio: {
    feed: "4:5 portrait (default starting point)",
    stories_reels: "9:16 vertical",
    note: "Do NOT repurpose one format across all placements. Crop specifically.",
  },
} as const;

// =============================================================================
// 10. SPECIFIC BRAND PATTERN LIBRARY — REAL ADS RUNNING NOW
// =============================================================================

export const BRAND_PATTERNS = {
  /**
   * These are specific compositional patterns observed in real Meta ads
   * from the Ad Library as of 2025-2026.
   */

  saasProductDemo: {
    brands: ["Asana", "Monday.com", "Slack", "Webflow", "Grammarly"],
    pattern: {
      image: "Interface screenshot or mockup as central element on bold colored background",
      textOverlay: "Bold white headline stating value prop. Logo at bottom.",
      background: "Bold brand color (Asana: maroon, Webflow: green, Slack: brand purple)",
      relationship: "Image shows WHAT the product looks like. Primary text explains WHY you need it. Headline bridges to CTA.",
    },
    asanaExample: {
      background: "Bold maroon",
      center: "Mock interface showing AI functionality",
      text: "Bold white 'AI teammates that give insights'",
      logo: "Bottom placement",
      quality: "Clean and modern, balancing simplicity with sophistication",
    },
  },

  dtcProductShowcase: {
    brands: ["Glossier", "Magic Spoon", "Ritual", "HelloFresh", "Crocs"],
    pattern: {
      image: "Product lineup or hero shot with vibrant saturated colors",
      textOverlay: "Offer badge (discount %) + product descriptors",
      background: "Bright, attention-grabbing — matches product color palette",
      relationship: "Image creates desire. Primary text handles objections. Headline delivers the offer.",
    },
    glossierExample: {
      image: "All 10 shades of blush as product tubs + color drops in palette formation",
      message: "Ease-of-use through dual visual representation",
      colorTreatment: "Actual product pigment colors displayed",
    },
    ritualExample: {
      image: "Gradient treatment imitating pill ingredients, applied directionally",
      badge: "White+yellow gradient for 'non-metallic metallic golden look'",
      copy: "New Year's resolutions + habit-building science wordplay",
    },
  },

  fintech: {
    brands: ["Stripe", "Revolut", "Chime"],
    pattern: {
      image: "Clean stat-driven or product card visual",
      textOverlay: "Large number/percentage OR subtle product motion",
      background: "Brand colors, minimal clutter",
      relationship: "Image establishes credibility with data. Primary text adds context. Headline drives urgency.",
    },
    stripeExample: {
      image: "Sequential animation: logo → headline → phone display. Elements appear one at a time.",
      typography: "One line at a time with gradient highlight on key phrase",
      color: "Brand purple with precise pacing",
    },
  },

  wellnessHealth: {
    brands: ["Curology", "Huel", "Nom Nom", "Nuun Hydration"],
    pattern: {
      image: "Before/after OR ingredient/product transparency",
      textOverlay: "Minimal — the transformation or ingredients ARE the message",
      background: "Clean, often white or light with product accent colors",
      relationship: "Image shows the result. Primary text tells the story. Headline states the promise.",
    },
  },

  premiumMinimalist: {
    brands: ["Apple", "Nike", "Cariuma", "Sony"],
    pattern: {
      image: "Hero product photography in context. Exquisite image quality.",
      textOverlay: "Almost none. Product name + one slogan line maximum.",
      background: "Context is the background — mud for boots, desk for tech, etc.",
      relationship: "Image does ALL the work. Primary text adds aspiration. Headline is a whisper.",
    },
    nikeExample: {
      image: "Shoe hitting mud without issue. Gore-Tex durability visible in context.",
      text: "Product name + post-script slogan only",
      colorScheme: "Photography-driven, not design-driven",
    },
  },
} as const;

// =============================================================================
// 11. IMAGE-TO-COPY RELATIONSHIP RULES
// =============================================================================

export const IMAGE_COPY_RELATIONSHIP = {
  /**
   * The image and the text below it serve DIFFERENT functions.
   * They should NOT repeat each other. They should COMPLEMENT.
   */
  rules: [
    {
      principle: "Image creates the emotional hook. Copy delivers the rational close.",
      example: "Image: person smiling using product. Primary text: '3 weeks to clearer skin — here's how I did it.'",
    },
    {
      principle: "Image shows WHAT. Headline says WHY NOW.",
      example: "Image: product hero with 50% off badge. Headline: 'Last chance — sale ends Sunday.'",
    },
    {
      principle: "Image establishes credibility. Copy handles objections.",
      example: "Image: Forbes/BBC article screenshot. Primary text: 'Join 10,000+ companies already using...'",
    },
    {
      principle: "Image pattern-interrupts. Copy contextualizes the interrupt.",
      example: "Image: shocking before/after. Primary text: 'I didn't believe it either, but...'",
    },
    {
      principle: "Headline bridges creative to CTA. Never repeats primary text.",
      example: "Primary text: story about the problem. Headline: 'Start your free trial' (the answer).",
    },
  ],

  /**
   * PRIMARY TEXT FORMULAS (for the copy above the image):
   *
   * Lead with OUTCOME not setup:
   * - Weak: "Are you struggling with low engagement rates?"
   * - Strong: "Cut ad costs 40% with this targeting adjustment."
   *
   * HEADLINE FORMULAS (bold text below image):
   * - Benefit-driven: "Save 40% on Winter Essentials"
   * - Specificity: "Generate 200+ Leads Monthly"
   * - Question: "Tired of Empty Pipelines?"
   *
   * DESCRIPTION (gray text below headline — often hidden on mobile):
   * - Reserved for: urgency ("50% off ends Sunday"), price callouts, qualifiers
   * - NOT for: redundant messaging or feature lists
   */
} as const;

// =============================================================================
// 12. PROPS, SETTINGS, AND BACKGROUNDS FREQUENCY MAP
// =============================================================================

export const SCENE_ELEMENTS = {
  /**
   * Based on analysis of top-performing ad creatives across categories.
   */
  backgrounds: {
    mostCommon: [
      { type: "Solid bold color", frequency: "Very high", use: "SaaS, tech, bold offers" },
      { type: "Gradient (brand colors)", frequency: "High", use: "SaaS, fintech, modern brands" },
      { type: "Home/office environment", frequency: "High", use: "UGC, lifestyle, remote work" },
      { type: "White/clean studio", frequency: "Medium", use: "Product hero, medical, luxury" },
      { type: "Outdoor natural", frequency: "Medium", use: "Lifestyle, wellness, activewear" },
      { type: "Kitchen/food context", frequency: "Medium", use: "Food/bev, meal kits, supplements" },
      { type: "Abstract patterns", frequency: "Low-medium", use: "Tech, creative tools" },
      { type: "City/urban", frequency: "Low", use: "Fashion, transportation, fintech" },
    ],
  },

  props: {
    mostCommon: [
      "Smartphone (showing app or being held)",
      "Laptop/desktop showing interface",
      "Product packaging (box, bottle, container)",
      "Food/meal in context",
      "Skincare/beauty product in hand",
      "Coffee cup (lifestyle signifier)",
      "Notebook/desk setup",
      "Badge/seal (trust element: FDA, ACE, etc.)",
    ],
  },

  personPresence: {
    /**
     * When to include a person vs. not:
     */
    withPerson: {
      when: "Trust building, testimonial, UGC, lifestyle, emotional hook",
      framing: "Chest-up or waist-up. Direct eye contact preferred for connection.",
      expression: "Genuine (not stock-photo smile). Surprise, satisfaction, confidence.",
      diversity: "Real people, not polished models. Relatable demographics.",
      ratio: "Person occupies 40-60% of frame. Product 15-25%. Background fills rest.",
    },
    withoutPerson: {
      when: "Product hero, stat/data, SaaS interface, bold typography, comparison",
      ratio: "Product/UI occupies 40-60% of frame. Text overlay 15-25%. Background fills rest.",
    },
  },
} as const;

// =============================================================================
// 13. QUICK REFERENCE — DECISION MATRIX FOR AD IMAGE GENERATION
// =============================================================================

export const GENERATION_DECISION_MATRIX = {
  /**
   * Use this to select the right archetype for a given campaign goal:
   */
  byGoal: {
    awareness_cold: ["personProduct (UGC)", "socialProof", "lifestyle"],
    consideration_warm: ["beforeAfter", "statHero", "productHero"],
    conversion_hot: ["productHero (with offer badge)", "boldTypography (urgency)", "beforeAfter"],
  },
  byIndustry: {
    saas: ["statHero", "beforeAfter", "saasProductDemo"],
    dtc_ecommerce: ["productHero", "personProduct", "lifestyle"],
    beauty_wellness: ["personProduct (UGC)", "beforeAfter", "lifestyle"],
    fintech: ["statHero", "socialProof", "premiumMinimalist"],
    food_bev: ["personProduct", "lifestyle", "productHero"],
    b2b_enterprise: ["socialProof", "statHero", "saasProductDemo"],
  },
  byAudience: {
    cold_no_awareness: "UGC/testimonial style — looks organic, builds trust",
    warm_considering: "Comparison/stat — proves why you're better",
    hot_ready_to_buy: "Offer/urgency — bold discount or limited time messaging",
  },
} as const;
