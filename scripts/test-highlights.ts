import { generateGraphicCard } from "../src/lib/services/card-generator";
import fs from "fs";

async function test() {
  fs.mkdirSync("/tmp/card-hl", { recursive: true });

  // Test 1: Highlight numbers — like TikTok "2배 증가", Crysbe "공헌이익"
  const r1 = await generateGraphicCard({
    headline: "스파크 애즈로 제품 판매\n2배 증가",
    highlightWords: ["2배"],
    subheadline: "오늘 브랜드 성장을 촉진하세요",
    cta: "틱톡 광고 사용해 보기 →",
    badge: "혜택",
    productName: "TikTok Ads",
    brandColor: "#FF0050",
    size: "1080x1080",
    style: "dark",
    tags: ["스파크 애즈", "제품 판매", "브랜드 성장"],
  });
  fs.writeFileSync("/tmp/card-hl/highlight-dark.png", Buffer.from(r1.data, "base64"));

  // Test 2: Like 셀라나우 — question style with highlight
  const r2 = await generateGraphicCard({
    headline: "3PL 물류센터\n아직도 비싸게\n계약하세요?",
    highlightWords: ["비싸게"],
    subheadline: "전국 200곳+ 3PL을 한번에 비교견적하고\n최대 38% 비용절감하세요!",
    cta: "3PL 비교견적 신청하기 →",
    productName: "셀라나우",
    brandColor: "#00C853",
    size: "1080x1080",
    style: "light",
  });
  fs.writeFileSync("/tmp/card-hl/highlight-light.png", Buffer.from(r2.data, "base64"));

  // Test 3: Like 챌린저스 — book/resource with badge
  const r3 = await generateGraphicCard({
    headline: "딜 커머스 마케팅\n성공사례 모음집 공개",
    highlightWords: ["성공사례"],
    subheadline: "2026년 딜 커머스 캠페인 전략을 확인하세요",
    cta: "모음집 받기 →",
    badge: "기간 한정",
    productName: "챌린저스",
    brandColor: "#FFD600",
    size: "1080x1080",
    style: "gradient",
    tags: ["누적 제휴사 1,015+개", "광고비 후불 결제"],
  });
  fs.writeFileSync("/tmp/card-hl/highlight-gradient.png", Buffer.from(r3.data, "base64"));

  // Test 4: Like ElevenLabs — stat hero
  const r4 = await generateGraphicCard({
    headline: "The #1 voice AI\nplatform",
    subheadline: "Trusted by 1,000,000+ Creators",
    cta: "Start Free →",
    badge: "인기",
    productName: "ElevenLabs",
    brandColor: "#1a1a2e",
    size: "1080x1080",
    style: "dark",
    tags: ["V3.1", "Text to Speech", "Voice Cloning"],
  });
  fs.writeFileSync("/tmp/card-hl/highlight-en.png", Buffer.from(r4.data, "base64"));

  console.log("Saved to /tmp/card-hl/");
}

test().catch(console.error);
