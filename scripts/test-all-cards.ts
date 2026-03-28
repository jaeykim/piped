import { generateGraphicCard } from "../src/lib/services/card-generator";
import fs from "fs";

const styles = ["light", "dark", "gradient"] as const;

const cases = [
  // Short Korean headline
  { name: "short-ko", headline: "지금 시작하세요", subheadline: "무료로 체험해보세요", cta: "시작하기 →", tags: ["무료", "간편"] },
  // Long Korean headline (common pain-point style)
  { name: "long-ko", headline: "아직도 수동으로 마케팅하느라 시간 낭비하고 계세요?", subheadline: "AI가 카피부터 광고 이미지, 캠페인까지 자동으로 만들어드립니다", cta: "무료로 시작하기 →", tags: ["AI 카피", "광고 이미지", "자동 캠페인"] },
  // Very long Korean headline
  { name: "vlong-ko", headline: "신규 노출은 많은데 구매 전환은 안 나오시나요? 이제 AI가 해결해드립니다", subheadline: "패션/뷰티 광고주님! 퍼포먼스 마케팅 자동화로 ROAS 3배 향상", cta: "지금 효율 높이기 →", tags: ["패션/뷰티", "ROAS 3배", "자동화", "무료 체험"] },
  // English headline
  { name: "short-en", headline: "Ship Faster.\nMarket Smarter.", subheadline: "AI handles your marketing so you can code.", cta: "Start Free →", tags: ["AI Copy", "Ad Creatives", "Campaigns"] },
  // Numbers/stats heavy
  { name: "stats", headline: "10,000+ 팀이 선택한\n마케팅 자동화", subheadline: "평균 ROAS 4.2배 · 설정 3분 · 월 300만원 절약", cta: "무료 체험 →", tags: ["★ 4.9", "10,000+", "3분 설정"] },
  // Minimal (no sub, no tags)
  { name: "minimal", headline: "URL 하나로 끝.", subheadline: "", cta: "시작하기", tags: [] },
  // Emoji/special chars
  { name: "emoji", headline: "🚀 런칭 특가!\n첫 달 완전 무료", subheadline: "지금 가입하면 프리미엄 기능 30일 무료", cta: "무료로 시작 🎉", tags: ["🔥 특가", "30일 무료"] },
];

async function run() {
  fs.mkdirSync("/tmp/card-tests", { recursive: true });

  for (const style of styles) {
    for (const c of cases) {
      const result = await generateGraphicCard({
        headline: c.headline,
        subheadline: c.subheadline || undefined,
        cta: c.cta,
        productName: "Piped",
        brandColor: "#4F46E5",
        size: "1080x1080",
        style,
        tags: c.tags.length > 0 ? c.tags : undefined,
      });
      const path = `/tmp/card-tests/${style}-${c.name}.png`;
      fs.writeFileSync(path, Buffer.from(result.data, "base64"));
    }
  }

  // Also test different sizes
  for (const size of ["1080x1080", "1200x628", "1080x1920"]) {
    const result = await generateGraphicCard({
      headline: "아직도 수동으로 마케팅하고 계세요?",
      subheadline: "AI가 전부 만들어드립니다",
      cta: "무료로 시작 →",
      productName: "Piped",
      brandColor: "#E91E63",
      size,
      style: "dark",
      tags: ["AI 카피", "광고 이미지"],
    });
    fs.writeFileSync(`/tmp/card-tests/size-${size.replace("x", "_")}.png`, Buffer.from(result.data, "base64"));
  }

  console.log("All tests saved to /tmp/card-tests/");
  console.log("Files:", fs.readdirSync("/tmp/card-tests/").length);
}

run().catch(console.error);
