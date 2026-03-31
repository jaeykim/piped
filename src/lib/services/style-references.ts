/**
 * Ad style reference system — categorized templates for Gemini style transfer.
 * Users pick a style, and we send the style description + product info to Gemini.
 */

export interface AdStyleReference {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  emoji: string;
  category: "person" | "data" | "product" | "text" | "review" | "promo";
  // Detailed visual prompt for Gemini
  geminiPrompt: string;
  // Layout description
  layout: {
    top: string;    // what goes at top 20%
    middle: string; // what goes in middle 50%
    bottom: string; // what goes at bottom 30%
  };
  // Color scheme
  colors: {
    background: string;
    accent: string;
    text: string;
  };
  // Example hook pattern
  hookPattern: string;
}

export const AD_STYLE_REFERENCES: AdStyleReference[] = [
  {
    id: "person-hook",
    name: "사람 + 후킹 문구",
    nameEn: "Person + Hook",
    description: "실제 인물이 제품을 사용하는 모습 + 상단에 강렬한 후킹 문구",
    descriptionEn: "Real person using the product + bold hook text on top",
    emoji: "🧑‍💼",
    category: "person",
    geminiPrompt: `Create a Korean-style Meta/Instagram ad image.
LAYOUT:
- TOP 25%: Bold hook text area (dark semi-transparent overlay band for text readability)
- MIDDLE 50%: Real person (Korean, professional, natural pose) using a laptop/phone showing the product. Natural office or café setting. Warm lighting, slightly desaturated.
- BOTTOM 25%: Info strip with subheadline + CTA on yellow (#FFE500) banner.
STYLE: Clean, modern Korean ad aesthetic. NOT stock photo — candid, editorial feel.
Key words should have bright yellow highlight behind them.
No actual text in the image — leave clean spaces where text will be overlaid.`,
    layout: { top: "후킹 문구 (굵은 텍스트, 노란 하이라이트)", middle: "인물 + 제품 사용 장면", bottom: "설명 + CTA 배너" },
    colors: { background: "#F5F5F0", accent: "#FFE500", text: "#1a1a2e" },
    hookPattern: "[대상]이 나 몰래 쓰던 [제품]",
  },
  {
    id: "data-chart",
    name: "데이터/차트 강조",
    nameEn: "Data & Charts",
    description: "성과 차트, 숫자, 그래프로 신뢰감 구축",
    descriptionEn: "Performance charts, numbers, and graphs for credibility",
    emoji: "📊",
    category: "data",
    geminiPrompt: `Create a Korean-style Meta/Instagram ad image.
LAYOUT:
- TOP 20%: Clean header with product name/logo area
- MIDDLE 60%: Professional-looking bar chart or line graph showing upward trend. Modern, clean data visualization with brand color accents. Numbers visible on chart (like 1129, 1145, 1155 etc). Dark or navy background for the chart area.
- BOTTOM 20%: Version number or key metric highlight strip.
STYLE: Tech/SaaS aesthetic. Dark theme with bright accent colors. Professional, trustworthy. Think Bloomberg or enterprise dashboard screenshot turned into an ad.
No actual text in the image — leave clean spaces where text will be overlaid.`,
    layout: { top: "제품명/로고", middle: "성과 차트 (상승 그래프)", bottom: "핵심 지표 강조" },
    colors: { background: "#1a1a2e", accent: "#6366F1", text: "#FFFFFF" },
    hookPattern: "[숫자]% 성장, [제품]으로",
  },
  {
    id: "product-closeup",
    name: "제품 클로즈업",
    nameEn: "Product Close-up",
    description: "제품 사진을 크게 보여주고 핵심 특징을 텍스트로 강조",
    descriptionEn: "Large product photo with key feature text overlay",
    emoji: "📦",
    category: "product",
    geminiPrompt: `Create a Korean-style Meta/Instagram ad image.
LAYOUT:
- TOP 20%: Badge/label area (e.g. "추천", "인기")
- MIDDLE 60%: Large, beautiful product shot. Clean white or light gradient background. Product centered, slightly angled (10-15°). Soft shadow. Premium feel.
- BOTTOM 20%: Feature tags area (rounded pill-shaped badges listing key features).
STYLE: Clean e-commerce aesthetic. White/light background. Product is hero. Minimal decoration. Think Apple product page meets Korean cosmetics ad.
No actual text in the image — leave clean spaces where text will be overlaid.`,
    layout: { top: "뱃지 (추천/인기/신상)", middle: "제품 사진 클로즈업", bottom: "특징 태그" },
    colors: { background: "#FFFFFF", accent: "#E53E3E", text: "#1a1a2e" },
    hookPattern: "[특징] 하나로 [문제] 해결",
  },
  {
    id: "bold-text",
    name: "텍스트 카드",
    nameEn: "Bold Text Card",
    description: "단색 또는 그래디언트 배경에 큰 텍스트로 메시지 전달",
    descriptionEn: "Solid/gradient background with large text message",
    emoji: "💬",
    category: "text",
    geminiPrompt: `Create a Korean-style Meta/Instagram ad image.
LAYOUT:
- FULL: Bold, vibrant background (brand color or bright gradient like sky blue → white).
- CENTER: Large empty space where bold Korean text will be overlaid (leave this area clean).
- Subtle geometric or abstract decorative elements (circles, waves) at corners. NOT clipart — modern, minimal.
- Small product mockup or icon in bottom-right corner (15-20% of frame).
STYLE: Think modern Korean startup landing page hero section. Bold, confident, minimal. Strong color contrast. The background itself should be visually interesting but not cluttered.
No actual text in the image — leave clean spaces where text will be overlaid.`,
    layout: { top: "후킹 문구 (초대형)", middle: "서브 메시지 + 장식", bottom: "CTA + 제품명" },
    colors: { background: "#4F9CF5", accent: "#FFE500", text: "#FFFFFF" },
    hookPattern: "[연도]년 [카테고리] 트렌드 [키워드]",
  },
  {
    id: "review-testimonial",
    name: "후기/리뷰형",
    nameEn: "Review / Testimonial",
    description: "실제 사용 후기 스타일로 신뢰감과 공감 유도",
    descriptionEn: "Real user review style for trust and empathy",
    emoji: "⭐",
    category: "review",
    geminiPrompt: `Create a Korean-style Meta/Instagram ad image.
LAYOUT:
- TOP 20%: Review/testimonial quote area with quotation mark decoration
- MIDDLE 50%: Before/after split or product usage scene. Warm, authentic feel. NOT perfect — slightly imperfect like a real user photo. Warm cream (#FFF9F0) background tint.
- BOTTOM 30%: Star rating (★★★★★), user name area, and CTA.
STYLE: UGC (User Generated Content) aesthetic. Warm, trustworthy, relatable. Like an Instagram story review. Cream/warm background. Handwritten-feel accents.
No actual text in the image — leave clean spaces where text will be overlaid.`,
    layout: { top: "인용구 (후기 문구)", middle: "사용 전후 또는 사용 장면", bottom: "별점 + CTA" },
    colors: { background: "#FFF9F0", accent: "#F59E0B", text: "#1a1a2e" },
    hookPattern: "[결과]인 줄 알았던 [대상]이 쓰던 [제품]",
  },
  {
    id: "promo-deal",
    name: "프로모션/할인",
    nameEn: "Promo / Deal",
    description: "할인율, 가격, 1+1 등 혜택을 강렬하게 어필",
    descriptionEn: "Highlight discounts, prices, and bundle deals",
    emoji: "🏷️",
    category: "promo",
    geminiPrompt: `Create a Korean-style Meta/Instagram ad image.
LAYOUT:
- TOP 15%: Urgency banner (red strip, "기간 한정" feel)
- MIDDLE 55%: Product displayed prominently with a large price tag or discount badge. Starburst/explosion shape behind the discount number. Bold, energetic composition.
- BOTTOM 30%: Original price with strikethrough → discounted price in large bold red. Yellow (#FFE500) CTA banner.
STYLE: Korean shopping mall ad energy. Bold reds, yellows. High contrast. Exciting, urgent. Multiple visual elements competing for attention (but organized). Flash sale feel.
No actual text in the image — leave clean spaces where text will be overlaid.`,
    layout: { top: "긴급 배너 (기간 한정)", middle: "제품 + 할인 뱃지", bottom: "가격 비교 + CTA" },
    colors: { background: "#FFF5F5", accent: "#E53E3E", text: "#1a1a2e" },
    hookPattern: "지금 바로 [할인율]% 할인",
  },
];

/**
 * Build a Gemini prompt that combines the style reference with product-specific info.
 */
export function buildStyleReferencePrompt(
  style: AdStyleReference,
  productName: string,
  valueProposition: string,
  industry: string,
  brandColors: string[],
): string {
  const brandColor = brandColors[0] || style.colors.accent;
  return `${style.geminiPrompt}

PRODUCT CONTEXT:
- Product: ${productName}
- What it does: ${valueProposition}
- Industry: ${industry}
- Brand color: ${brandColor}

IMPORTANT:
- This is for a ${industry} product called "${productName}"
- Adapt the visual elements to be relevant to ${industry}
- Use ${brandColor} as the primary accent color
- The image should feel like a premium Korean Meta/Instagram ad
- Square format (1:1 ratio), 1080x1080px
- NO text, NO words, NO letters in the image — text will be overlaid separately`;
}
