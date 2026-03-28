/**
 * Korean Meta ad style graphic card generator.
 * Supports split rendering: background-only → image composite → text overlay
 */

import sharp from "sharp";
import path from "path";

// Ensure fontconfig can find our bundled Korean fonts (Noto Sans KR)
const fontsDir = path.join(process.cwd(), "fonts");
if (!process.env.FONTCONFIG_PATH) {
  process.env.FONTCONFIG_PATH = fontsDir;
}
if (!process.env.FONTCONFIG_FILE) {
  process.env.FONTCONFIG_FILE = path.join(fontsDir, "fonts.conf");
}

export interface CardConfig {
  headline: string;
  highlightWords?: string[];  // Words in headline to highlight with brand color background
  subheadline?: string;
  cta?: string;
  badge?: string;             // e.g. "출시특가", "기간 한정", "무료 체험"
  productName: string;
  brandColor: string;
  size: string;
  style: "light" | "dark" | "gradient";
  tags?: string[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) || 79,
    g: parseInt(h.substring(2, 4), 16) || 70,
    b: parseInt(h.substring(4, 6), 16) || 229,
  };
}

function lighten(r: number, g: number, b: number, amt: number): string {
  return `rgb(${Math.min(255, r + Math.round((255 - r) * amt))},${Math.min(255, g + Math.round((255 - g) * amt))},${Math.min(255, b + Math.round((255 - b) * amt))})`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Conservative Korean wrap — uses wider char estimate to prevent overflow
function wrapText(text: string, fontSize: number, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }
    // Use 0.95 for Korean (wider chars), 0.6 for Latin
    const isCJK = /[\u3000-\u9fff\uac00-\ud7af]/.test(para);
    const charW = fontSize * (isCJK ? 0.95 : 0.6);
    const maxChars = Math.floor(maxW / charW);

    const words = para.split(" ");
    let cur = "";
    for (const word of words) {
      const test = cur ? cur + " " + word : word;
      if (test.length > maxChars && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    // If single word exceeds max, break by chars
    if (cur && cur.length > maxChars) {
      let charCur = "";
      for (const ch of cur) {
        if ((charCur.length + 1) * (fontSize * 0.95) > maxW && charCur) {
          lines.push(charCur); charCur = ch;
        } else { charCur += ch; }
      }
      if (charCur) lines.push(charCur);
    } else if (cur) {
      lines.push(cur);
    }
  }
  return lines;
}

// Auto-shrink headline to fit max lines
function fitHeadline(text: string, baseSize: number, maxW: number, maxLines: number): { size: number; lines: string[] } {
  let size = baseSize;
  let lines: string[] = [];
  for (let i = 0; i < 8; i++) {
    lines = wrapText(text, size, maxW);
    if (lines.length <= maxLines) break;
    size = Math.round(size * 0.88);
  }
  return { size, lines };
}

function buildBgSvg(w: number, h: number, r: number, g: number, b: number, style: string, isPortrait: boolean): string {
  const isDark = style === "dark";
  let bg = "";
  if (style === "dark") {
    bg = `<rect width="${w}" height="${h}" fill="#1a1a2e"/>
      <rect width="${w}" height="${h}" fill="url(#bgGrad)" opacity="0.6"/>
      <circle cx="${w * 0.92}" cy="${h * 0.12}" r="${w * 0.2}" fill="rgb(${r},${g},${b})" opacity="0.18"/>
      <circle cx="${w * 0.85}" cy="${h * 0.75}" r="${w * 0.25}" fill="rgb(${r},${g},${b})" opacity="0.08"/>
      <circle cx="${w * 0.05}" cy="${h * 0.85}" r="${w * 0.12}" fill="rgb(${r},${g},${b})" opacity="0.1"/>`;
  } else if (style === "gradient") {
    bg = `<rect width="${w}" height="${h}" fill="${lighten(r, g, b, 0.82)}"/>
      <rect width="${w}" height="${h}" fill="url(#bgGrad)" opacity="0.18"/>
      <circle cx="${w * 0.88}" cy="${h * 0.75}" r="${w * 0.22}" fill="rgb(${r},${g},${b})" opacity="0.1"/>`;
  } else {
    bg = `<rect width="${w}" height="${h}" fill="#F5F5F5"/>
      <rect width="${w}" height="${h}" fill="url(#bgGrad)" opacity="0.1"/>
      <circle cx="${w * 0.88}" cy="${h * 0.75}" r="${w * 0.2}" fill="rgb(${r},${g},${b})" opacity="0.07"/>`;
  }

  let deco = "";
  if (isPortrait) {
    const midY = h * 0.5;
    deco = `<circle cx="${w * 0.8}" cy="${midY + h * 0.15}" r="${w * 0.2}" fill="rgb(${r},${g},${b})" opacity="${isDark ? 0.12 : 0.06}"/>
      <circle cx="${w * 0.15}" cy="${midY + h * 0.3}" r="${w * 0.1}" fill="rgb(${r},${g},${b})" opacity="${isDark ? 0.08 : 0.04}"/>
      <circle cx="${w * 0.5}" cy="${h * 0.85}" r="${w * 0.15}" fill="rgb(${r},${g},${b})" opacity="${isDark ? 0.1 : 0.05}"/>`;
  }

  const bottomBar = `<rect x="0" y="${h - Math.round(w * 0.03)}" width="${w}" height="${Math.round(w * 0.03)}" fill="rgb(${r},${g},${b})" opacity="${isDark ? 0.3 : 0.12}"/>`;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bgGrad" x1="0" y1="0" x2="${w}" y2="${h}">
      <stop offset="0%" stop-color="rgb(${r},${g},${b})"/>
      <stop offset="100%" stop-color="rgb(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)})"/>
    </linearGradient></defs>
    ${bg}${deco}${bottomBar}
  </svg>`;
}

function buildTextSvg(w: number, h: number, config: CardConfig, r: number, g: number, b: number): string {
  const isLandscape = w > h;
  const ref = Math.min(w, h);
  const pad = Math.round(ref * 0.07);
  const isDark = config.style === "dark";

  const baseHeadSize = Math.round(ref * (isLandscape ? 0.12 : 0.075));
  const subSize = Math.round(ref * (isLandscape ? 0.055 : 0.034));
  const ctaSize = Math.round(ref * (isLandscape ? 0.05 : 0.03));
  const badgeSize = Math.round(ref * 0.022);
  const tagSize = Math.round(ref * 0.028);

  const textColor = isDark ? "#FFFFFF" : "#1a1a2e";
  const subColor = isDark ? "rgba(255,255,255,0.75)" : "rgba(26,26,46,0.55)";
  const tagBg = isDark ? "rgba(255,255,255,0.12)" : `rgba(${r},${g},${b},0.1)`;
  const tagText = isDark ? "rgba(255,255,255,0.9)" : `rgb(${r},${g},${b})`;
  const maxTextW = w - pad * 2;

  // Badge (top, above headline) — e.g. "출시특가", "기간 한정"
  let badgeSvgTop = "";
  let y = pad;
  if (config.badge) {
    const bSize = Math.round(ref * 0.024);
    const bPad = bSize * 0.6;
    const bW = config.badge.length * bSize * 0.8 + bPad * 2;
    const bH = bSize * 2;
    badgeSvgTop = `
      <rect x="${pad}" y="${y}" width="${bW}" height="${bH}" rx="${bH / 2}" fill="rgb(${r},${g},${b})"/>
      <text x="${pad + bPad}" y="${y + bH / 2 + bSize * 0.35}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="700" font-size="${bSize}" fill="#FFFFFF">${esc(config.badge)}</text>`;
    y += bH + ref * 0.015;
  }

  // Headline — auto-fit to max 4 lines, with highlight support
  const { size: headSize, lines: headLines } = fitHeadline(config.headline, baseHeadSize, maxTextW, 4);
  const lineH = headSize * 1.15;
  const highlights = config.highlightWords || [];

  const headSvg = headLines.map((line, i) => {
    const ly = y + headSize + i * lineH;

    // Check if any highlight word is in this line
    let highlightSvg = "";
    for (const hw of highlights) {
      const idx = line.indexOf(hw);
      if (idx >= 0) {
        // Calculate approximate position of the highlight word
        const isCJK = /[\u3000-\u9fff\uac00-\ud7af]/.test(hw);
        const charW = headSize * (isCJK ? 0.95 : 0.6);
        const beforeW = idx * charW;
        const wordW = hw.length * charW;
        const hlX = pad + beforeW;
        const hlY = ly - headSize * 0.85;
        const hlH = headSize * 1.1;
        const hlPad = headSize * 0.1;
        // Highlight rectangle behind the word
        highlightSvg += `<rect x="${hlX - hlPad}" y="${hlY}" width="${wordW + hlPad * 2}" height="${hlH}" rx="4" fill="rgb(${r},${g},${b})" opacity="${isDark ? 0.4 : 0.2}"/>`;
      }
    }

    return `${highlightSvg}<text x="${pad}" y="${ly}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="900" font-size="${headSize}" fill="${textColor}" letter-spacing="-0.01em">${esc(line)}</text>`;
  }).join("");
  y += headLines.length * lineH + headSize * 0.2;

  // Accent bar
  const accent = `<rect x="${pad}" y="${y}" width="${w * 0.08}" height="${Math.round(ref * 0.005)}" rx="2" fill="rgb(${r},${g},${b})" opacity="${isDark ? 0.7 : 0.5}"/>`;
  y += ref * 0.025;

  // Subheadline
  let subSvg = "";
  if (config.subheadline) {
    const subLines = wrapText(config.subheadline, subSize, maxTextW);
    subSvg = subLines.slice(0, 3).map((line, i) => {
      return `<text x="${pad}" y="${y + subSize + i * (subSize * 1.4)}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="500" font-size="${subSize}" fill="${subColor}">${esc(line)}</text>`;
    }).join("");
    y += subLines.slice(0, 3).length * (subSize * 1.4) + subSize * 0.3;
  }

  // Tags
  let tagsSvg = "";
  const tags = config.tags || [];
  if (tags.length > 0) {
    y += ref * 0.015;
    let tx = pad;
    const tagH = tagSize * 2.2;
    const tagGap = ref * 0.012;
    const tagPad = tagSize * 0.8;

    for (const tag of tags.slice(0, 4)) {
      const tw = tag.length * tagSize * 0.75 + tagPad * 2;
      if (tx + tw > w - pad) { tx = pad; y += tagH + tagGap; }
      tagsSvg += `<rect x="${tx}" y="${y}" width="${tw}" height="${tagH}" rx="${tagH / 2}" fill="${tagBg}"/>
        <text x="${tx + tagPad}" y="${y + tagH / 2 + tagSize * 0.35}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="600" font-size="${tagSize}" fill="${tagText}">${esc(tag)}</text>`;
      tx += tw + tagGap;
    }
    y += tagH + ref * 0.015;
  }

  // CTA
  let ctaSvg = "";
  if (config.cta) {
    y += ref * 0.02;
    const ctaW = config.cta.length * ctaSize * 0.85 + ctaSize * 4;
    const ctaH = ctaSize * 2.8;
    ctaSvg = `<rect x="${pad}" y="${y}" width="${ctaW}" height="${ctaH}" rx="${ctaH / 2}" fill="rgb(${r},${g},${b})"/>
      <text x="${pad + ctaW / 2}" y="${y + ctaH / 2 + ctaSize * 0.35}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="700" font-size="${ctaSize}" fill="#FFFFFF" text-anchor="middle">${esc(config.cta)}</text>`;
  }

  // Brand badge — bottom right
  const bw = config.productName.length * badgeSize * 0.7 + 16;
  const bh = badgeSize * 2;
  const bx = w - pad - bw;
  const by = h - pad - bh;
  const brandSvg = `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}"/>
    <text x="${bx + 8}" y="${by + bh / 2 + badgeSize * 0.35}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="600" font-size="${badgeSize}" fill="${isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)"}">${esc(config.productName)}</text>`;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${badgeSvgTop}${headSvg}${accent}${subSvg}${tagsSvg}${ctaSvg}${brandSvg}
  </svg>`;
}

// ─── Public API ───

/** Generate background only (for compositing with an image underneath text) */
export async function generateCardBackground(config: CardConfig): Promise<Buffer> {
  const [w, h] = config.size.split("x").map(Number);
  const { r, g, b } = hexToRgb(config.brandColor);
  const isPortrait = h > w * 1.3;
  const bgSvg = buildBgSvg(w, h, r, g, b, config.style, isPortrait);
  return sharp(Buffer.from(bgSvg)).png().toBuffer();
}

/** Generate text overlay only (transparent background, for compositing on top) */
export async function generateCardTextOverlay(config: CardConfig): Promise<Buffer> {
  const [w, h] = config.size.split("x").map(Number);
  const { r, g, b } = hexToRgb(config.brandColor);
  const textSvg = buildTextSvg(w, h, config, r, g, b);
  return sharp(Buffer.from(textSvg)).png().toBuffer();
}

/** Generate complete card (background + text, no image layer) */
export async function generateGraphicCard(config: CardConfig): Promise<{ data: string; mimeType: string }> {
  const bgBuffer = await generateCardBackground(config);
  const textBuffer = await generateCardTextOverlay(config);

  const result = await sharp(bgBuffer)
    .composite([{ input: textBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return { data: result.toString("base64"), mimeType: "image/png" };
}

/** Generate card with image sandwiched: background → image → text */
export async function generateCardWithImage(
  config: CardConfig,
  imageBuffer: Buffer,
  imagePosition: { top: number; left: number; width: number; height: number }
): Promise<{ data: string; mimeType: string }> {
  const bgBuffer = await generateCardBackground(config);
  const textBuffer = await generateCardTextOverlay(config);

  // Resize the image to fit
  const resizedImg = await sharp(imageBuffer)
    .resize(imagePosition.width, imagePosition.height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const result = await sharp(bgBuffer)
    .composite([
      { input: resizedImg, top: imagePosition.top, left: imagePosition.left },
      { input: textBuffer, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  return { data: result.toString("base64"), mimeType: "image/png" };
}
