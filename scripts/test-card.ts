import { generateGraphicCard } from "../src/lib/services/card-generator";
import fs from "fs";

async function test() {
  // Test 1: Pain-point dark — like Stylec/환사장 ads
  const r1 = await generateGraphicCard({
    headline: "아직도 피부 관리에\n시간 낭비하고 계세요?",
    subheadline: "AI가 당신의 피부 타입을 분석하고\n맞춤 루틴을 제공합니다",
    cta: "무료로 시작하기 →",
    productName: "Glowbook",
    brandColor: "#E91E63",
    size: "1080x1080",
    style: "dark",
    tags: ["피부 분석", "맞춤 루틴", "AI 추천"],
  });
  fs.writeFileSync("/tmp/card-v2-dark.png", Buffer.from(r1.data, "base64"));

  // Test 2: Social proof light — like obudyoga ad
  const r2 = await generateGraphicCard({
    headline: "10,000명이 선택한\n피부 관리 솔루션",
    subheadline: "당신의 피부도 달라질 수 있습니다",
    cta: "지금 바로 체험하기 →",
    productName: "Glowbook",
    brandColor: "#E91E63",
    size: "1080x1080",
    style: "light",
    tags: ["★ 4.9 평점", "10,000+ 사용자", "무료 체험"],
  });
  fs.writeFileSync("/tmp/card-v2-light.png", Buffer.from(r2.data, "base64"));

  // Test 3: Benefit gradient — like WHOTAG/헬로맥스 ad
  const r3 = await generateGraphicCard({
    headline: "URL 하나로 마케팅\n자동화 완성",
    subheadline: "카피, 이미지, 캠페인까지\nAI가 한번에 만들어드립니다",
    cta: "3분만에 시작하기 →",
    productName: "Piped",
    brandColor: "#4F46E5",
    size: "1080x1080",
    style: "gradient",
    tags: ["AI 카피", "광고 이미지", "자동 캠페인", "제휴 프로그램"],
  });
  fs.writeFileSync("/tmp/card-v2-gradient.png", Buffer.from(r3.data, "base64"));

  // Test 4: Offer dark — like Stylec "월 30만원" ad
  const r4 = await generateGraphicCard({
    headline: "지금 시작하면\n첫 달 무료!",
    subheadline: "마케팅 자동화 파이프라인을\n무료로 체험해보세요",
    cta: "무료로 시작 →",
    productName: "Piped",
    brandColor: "#4F46E5",
    size: "1080x1080",
    style: "dark",
    tags: ["첫 달 무료", "카드 등록 불필요"],
  });
  fs.writeFileSync("/tmp/card-v2-offer.png", Buffer.from(r4.data, "base64"));

  console.log("All 4 cards saved to /tmp/card-v2-*.png");
}

test().catch(console.error);
