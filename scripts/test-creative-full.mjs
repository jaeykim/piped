// End-to-end creative test — runs the actual Gemini bg image generation
// step before compositing the SVG layers, so the output mirrors what
// production /api/creatives/generate-one produces.
import { config } from "dotenv";
config({ path: ".env.local" });

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const cg = await import("../src/lib/services/card-generator.ts");
const sharp = (await import("sharp")).default;
const { GoogleGenAI } = await import("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
const OUT = "/tmp/creative-full-test";
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

// Realistic test cases mirroring what users would actually generate
const cases = [
  {
    name: "01-saas-ko",
    industry: "마케팅 자동화 SaaS",
    bgPrompt:
      "A person working on a laptop in a bright modern office, warm lighting, lifestyle feel. Fill the entire frame edge-to-edge. Bright, warm, high quality. Korean Instagram ad aesthetic. ABSOLUTELY NO TEXT or LETTERS of any kind.",
    config: {
      headline: "광고 운영, 손 놓고 시작",
      highlightWords: ["손 놓고"],
      subheadline: "MaktMakr가 1시간마다 자동 최적화",
      cta: "메타 연결 → 무료",
      badge: "추천",
      productName: "MaktMakr",
      brandColor: "#6366F1",
      size: "1080x1080",
      style: "gradient",
    },
  },
  {
    name: "02-beauty-ko",
    industry: "K-뷰티 스킨케어",
    bgPrompt:
      "Beautiful skincare products on a clean surface, soft natural lighting, premium feel. Fill the entire frame edge-to-edge. Korean Instagram ad aesthetic. ABSOLUTELY NO TEXT or LETTERS of any kind.",
    config: {
      headline: "5분 만에 글로우업",
      highlightWords: ["5분"],
      subheadline: "K-뷰티 신제품, 한정 수량",
      cta: "지금 만나보기 →",
      badge: "인기",
      productName: "Glowbook",
      brandColor: "#FF69B4",
      size: "1080x1080",
      style: "light",
    },
  },
  {
    name: "03-ecom-en",
    industry: "DTC e-commerce fashion",
    bgPrompt:
      "Stylish person wearing modern streetwear in an urban setting, golden hour lighting, lifestyle photography. Fill the entire frame edge-to-edge. Instagram ad aesthetic. ABSOLUTELY NO TEXT or LETTERS of any kind.",
    config: {
      headline: "30% off this week",
      highlightWords: ["30%"],
      subheadline: "New drop, limited stock — ends Sunday",
      cta: "Shop now →",
      badge: "SALE",
      productName: "Streetly",
      brandColor: "#E91E63",
      size: "1080x1080",
      style: "bold",
    },
  },
  {
    name: "04-pain-point-ko-portrait",
    industry: "AI 마케팅 자동화",
    bgPrompt:
      "A frustrated person looking at multiple computer screens with charts and dashboards in a dim office at night. Cinematic, dramatic. Fill the entire frame edge-to-edge. ABSOLUTELY NO TEXT.",
    config: {
      headline: "광고 매니저 보다가 새벽이에요",
      highlightWords: ["새벽"],
      subheadline: "MaktMakr는 자고 있어도 일합니다",
      cta: "지금 시작하기 →",
      productName: "MaktMakr",
      brandColor: "#1E3A8A",
      size: "1080x1920",
      style: "dark",
    },
  },
];

async function genBg(prompt) {
  const t0 = Date.now();
  const res = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: { numberOfImages: 1, aspectRatio: "1:1" },
  });
  const bytes = res.generatedImages?.[0]?.image?.imageBytes;
  console.log(`    bg gen: ${Date.now() - t0}ms`);
  if (!bytes) throw new Error("Imagen returned no image");
  return Buffer.from(bytes, "base64");
}

for (const c of cases) {
  console.log(`\n[${c.name}] ${c.config.headline}`);
  try {
    let bg = await genBg(c.bgPrompt);
    // Sharp metadata probe (same defensive check as generate-one)
    try {
      const meta = await sharp(bg).metadata();
      if (!meta.format) throw new Error("undecodable");
      console.log(`    bg ok: ${meta.format} ${meta.width}x${meta.height}`);
    } catch (e) {
      console.log(`    bg unusable: ${e.message}, falling back`);
      bg = null;
    }

    let result;
    if (bg) {
      result = await cg.generateCardOnImage(c.config, bg);
    } else {
      result = await cg.generateGraphicCard(c.config);
    }

    const buf = Buffer.from(result.data, "base64");
    const file = path.join(OUT, `${c.name}.png`);
    await writeFile(file, buf);
    console.log(`    ✓ ${file} (${(buf.length / 1024).toFixed(0)}KB)`);
  } catch (e) {
    console.log(`    ✗ failed: ${e.message}`);
  }
}

console.log("\nDone.");
process.exit(0);
