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
  topBanner?: string;         // ZET-style top banner text (red/yellow strip)
  productName: string;
  brandColor: string;
  size: string;
  style: "light" | "dark" | "gradient" | "bold" | "review";
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

// Per-character width estimator for Noto Sans (KR) at the chosen weight.
// Gets us within ~5% of actual glyph widths, which is enough for the
// highlight rect to land where the user expects.
function charWidth(ch: string, fontSize: number): number {
  if (/[\u3000-\u9fff\uac00-\ud7af]/.test(ch)) return fontSize * 0.95; // CJK
  if (/[A-Z]/.test(ch)) return fontSize * 0.66;
  if (/[0-9]/.test(ch)) return fontSize * 0.6;
  if (/[a-z]/.test(ch)) return fontSize * 0.52;
  if (/\s/.test(ch)) return fontSize * 0.3;
  if (/[%$+\-=]/.test(ch)) return fontSize * 0.55;
  return fontSize * 0.5; // punctuation, etc.
}

function stringWidth(s: string, fontSize: number): number {
  let w = 0;
  for (const ch of s) w += charWidth(ch, fontSize);
  return w;
}

// Word-aware wrap. Uses real per-char widths so the resulting lines
// roughly match what the renderer actually draws.
function wrapText(text: string, fontSize: number, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }

    const words = para.split(" ");
    let cur = "";
    for (const word of words) {
      const test = cur ? cur + " " + word : word;
      if (stringWidth(test, fontSize) > maxW && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    // If single word exceeds max, break by chars
    if (cur && stringWidth(cur, fontSize) > maxW) {
      let charCur = "";
      for (const ch of cur) {
        if (stringWidth(charCur + ch, fontSize) > maxW && charCur) {
          lines.push(charCur);
          charCur = ch;
        } else {
          charCur += ch;
        }
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

function buildBgSvg(w: number, h: number, r: number, g: number, b: number, style: string, _isPortrait: boolean): string {
  // Fill the entire frame. Decorative circles live BELOW the headline area
  // (top ~40% of the card) so they don't muddy the most important text.
  const l = (amt: number) => lighten(r, g, b, amt);
  let bg = "";

  if (style === "dark") {
    bg = `<rect width="${w}" height="${h}" fill="#1a1a2e"/>
      <rect width="${w}" height="${h}" fill="url(#bgGrad)" opacity="0.5"/>
      <circle cx="${w * 0.92}" cy="${h * 0.62}" r="${w * 0.32}" fill="rgb(${r},${g},${b})" opacity="0.15"/>
      <circle cx="${w * 0.08}" cy="${h * 0.92}" r="${w * 0.28}" fill="rgb(${r},${g},${b})" opacity="0.1"/>
      <rect x="0" y="${h * 0.6}" width="${w}" height="${h * 0.4}" fill="rgb(${r},${g},${b})" opacity="0.08"/>`;
  } else if (style === "gradient") {
    bg = `<rect width="${w}" height="${h}" fill="${l(0.85)}"/>
      <rect width="${w}" height="${h}" fill="url(#bgGrad)" opacity="0.15"/>
      <circle cx="${w * 0.92}" cy="${h * 0.7}" r="${w * 0.36}" fill="rgb(${r},${g},${b})" opacity="0.1"/>
      <circle cx="${w * 0.08}" cy="${h * 0.95}" r="${w * 0.28}" fill="rgb(${r},${g},${b})" opacity="0.07"/>
      <rect x="0" y="${h * 0.65}" width="${w}" height="${h * 0.35}" fill="rgb(${r},${g},${b})" opacity="0.06" rx="${w * 0.02}"/>`;
  } else if (style === "bold") {
    bg = `<rect width="${w}" height="${h}" fill="rgb(${r},${g},${b})"/>
      <rect width="${w}" height="${h}" fill="url(#bgGrad)" opacity="0.3"/>
      <circle cx="${w * 0.92}" cy="${h * 0.65}" r="${w * 0.32}" fill="rgba(255,255,255,0.07)"/>
      <circle cx="${w * 0.08}" cy="${h * 0.95}" r="${w * 0.26}" fill="rgba(0,0,0,0.1)"/>
      <rect x="0" y="${h * 0.7}" width="${w}" height="${h * 0.3}" fill="rgba(0,0,0,0.12)"/>`;
  } else if (style === "review") {
    bg = `<rect width="${w}" height="${h}" fill="#FFF9F0"/>
      <circle cx="${w * 0.92}" cy="${h * 0.7}" r="${w * 0.28}" fill="rgb(${r},${g},${b})" opacity="0.06"/>
      <circle cx="${w * 0.08}" cy="${h * 0.95}" r="${w * 0.22}" fill="rgb(${r},${g},${b})" opacity="0.05"/>
      <rect x="0" y="${h * 0.65}" width="${w}" height="${h * 0.35}" fill="rgb(${r},${g},${b})" opacity="0.05"/>`;
  } else {
    bg = `<rect width="${w}" height="${h}" fill="#F5F5F5"/>
      <rect width="${w}" height="${h}" fill="url(#bgGrad)" opacity="0.08"/>
      <circle cx="${w * 0.92}" cy="${h * 0.7}" r="${w * 0.32}" fill="rgb(${r},${g},${b})" opacity="0.07"/>
      <rect x="0" y="${h * 0.65}" width="${w}" height="${h * 0.35}" fill="rgb(${r},${g},${b})" opacity="0.05"/>`;
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bgGrad" x1="0" y1="0" x2="${w}" y2="${h}">
      <stop offset="0%" stop-color="rgb(${r},${g},${b})"/>
      <stop offset="100%" stop-color="rgb(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)})"/>
    </linearGradient></defs>
    ${bg}
  </svg>`;
}

function buildTextSvg(w: number, h: number, config: CardConfig, r: number, g: number, b: number): string {
  const isLandscape = w > h;
  const ref = Math.min(w, h);
  const pad = Math.round(ref * 0.06);
  const isDark = config.style === "dark" || config.style === "bold";

  // Bigger text to fill more of the card
  const baseHeadSize = Math.round(ref * (isLandscape ? 0.12 : 0.09));
  const subSize = Math.round(ref * (isLandscape ? 0.05 : 0.038));
  const badgeSize = Math.round(ref * 0.024);

  const textColor = isDark ? "#FFFFFF" : "#1a1a2e";
  const subColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(26,26,46,0.5)";
  const maxTextW = w - pad * 2;

  // CTA banner at the very bottom
  const ctaBannerH = config.cta ? Math.round(ref * 0.08) : 0;

  // ── Calculate total content height first, then vertically center ──
  const { size: headSize, lines: headLines } = fitHeadline(config.headline, baseHeadSize, maxTextW, 3);
  const lineH = headSize * 1.2;
  const headBlockH = headLines.length * lineH;

  const subLines = config.subheadline ? wrapText(config.subheadline, subSize, maxTextW).slice(0, 2) : [];
  const subBlockH = subLines.length > 0 ? subLines.length * (subSize * 1.5) + ref * 0.02 : 0;

  const badgeH = config.badge ? badgeSize * 2.2 + ref * 0.015 : 0;
  const bannerH = config.topBanner ? Math.round(ref * 0.07) : 0;

  const totalContentH = badgeH + headBlockH + subBlockH;
  const availableH = h - bannerH - ctaBannerH - pad * 2;

  // True vertical centering — split the slack evenly above and below.
  let y = bannerH + pad + Math.max(0, Math.round((availableH - totalContentH) / 2));

  // ── Top banner (full width, pinned to top) ──
  let topSvg = "";
  if (config.topBanner) {
    const bannerFs = Math.round(ref * 0.028);
    topSvg = `<rect x="0" y="0" width="${w}" height="${bannerH}" fill="#E53E3E"/>
      <text x="${w / 2}" y="${bannerH / 2 + bannerFs * 0.35}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="900" font-size="${bannerFs}" fill="#FFFFFF" text-anchor="middle">${esc(config.topBanner)}</text>`;
  }

  // ── Badge ──
  let badgeSvg = "";
  if (config.badge && !config.topBanner) {
    const bSize = badgeSize;
    const bPad = bSize * 0.6;
    const bW = config.badge.length * bSize * 0.8 + bPad * 2;
    const bH = bSize * 2;
    badgeSvg = `<rect x="${pad}" y="${y}" width="${bW}" height="${bH}" rx="${bH / 2}" fill="rgb(${r},${g},${b})"/>
      <text x="${pad + bPad}" y="${y + bH / 2 + bSize * 0.35}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="700" font-size="${bSize}" fill="#FFFFFF">${esc(config.badge)}</text>`;
    y += bH + ref * 0.015;
  }

  // ── Headline (vertically centered) ──
  // Per-character widths land the highlight box on the actual word.
  const highlights = config.highlightWords || [];
  const headSvg = headLines.map((line, i) => {
    const ly = y + headSize + i * lineH;
    let hlSvg = "";
    for (const hw of highlights) {
      const idx = line.indexOf(hw);
      if (idx >= 0) {
        const beforeW = stringWidth(line.substring(0, idx), headSize);
        const hwW = stringWidth(hw, headSize);
        const hlX = pad + beforeW;
        const hlColor = isDark ? "#FFE500" : `rgb(${r},${g},${b})`;
        // Bigger than the glyph itself — fully envelopes the bold letters,
        // including descenders + extra horizontal breathing room.
        const padX = Math.round(headSize * 0.18);
        const padTop = Math.round(headSize * 1.05);
        const boxH = Math.round(headSize * 1.4);
        hlSvg += `<rect x="${hlX - padX}" y="${ly - padTop}" width="${hwW + padX * 2}" height="${boxH}" rx="${Math.round(headSize * 0.12)}" fill="${hlColor}" opacity="${isDark ? 0.95 : 0.3}"/>`;
      }
    }
    // Text with stroke outline for readability on any background
    return `${hlSvg}<text x="${pad}" y="${ly}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="900" font-size="${headSize}" fill="${textColor}" stroke="${isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"}" stroke-width="${Math.round(headSize * 0.03)}" paint-order="stroke">${esc(line)}</text>`;
  }).join("");
  y += headBlockH + ref * 0.02;

  // ── Subheadline ──
  let subSvg = "";
  if (subLines.length > 0) {
    subSvg = subLines.map((line, i) => {
      return `<text x="${pad}" y="${y + subSize + i * (subSize * 1.5)}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="600" font-size="${subSize}" fill="${isDark ? "rgba(255,255,255,0.9)" : subColor}" stroke="${isDark ? "rgba(0,0,0,0.3)" : "none"}" stroke-width="${isDark ? Math.round(subSize * 0.03) : 0}" paint-order="stroke">${esc(line)}</text>`;
    }).join("");
  }

  // ── CTA (pinned to bottom, full width) ──
  let ctaSvg = "";
  if (config.cta) {
    const ctaFs = Math.round(ref * 0.028);
    const ctaY = h - ctaBannerH;
    const ctaBg = (isDark || config.style === "bold") ? `rgb(${r},${g},${b})` : "#FFE500";
    const ctaFill = (isDark || config.style === "bold") ? "#FFFFFF" : "#1a1a2e";
    ctaSvg = `<rect x="0" y="${ctaY}" width="${w}" height="${ctaBannerH}" fill="${ctaBg}"/>
      <text x="${w / 2}" y="${ctaY + ctaBannerH / 2 + ctaFs * 0.35}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="800" font-size="${ctaFs}" fill="${ctaFill}" text-anchor="middle">${esc(config.cta)}</text>`;
  }

  // ── Brand mark (just above CTA, more legible than before) ──
  const brandFs = Math.round(badgeSize * 1.2);
  const brandY = config.cta ? h - ctaBannerH - brandFs * 1.4 : h - pad - brandFs;
  const brandSvg = `<text x="${w - pad}" y="${brandY}" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-weight="700" font-size="${brandFs}" fill="${isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)"}" text-anchor="end">${esc(config.productName)}</text>`;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${topSvg}${badgeSvg}${headSvg}${subSvg}${ctaSvg}${brandSvg}
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

function buildGradientSvg(w: number, h: number, r: number, g: number, b: number): string {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0,0,0,0.75)"/>
        <stop offset="60%" stop-color="rgba(0,0,0,0.3)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </linearGradient>
      <linearGradient id="botG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="40%" stop-color="rgba(${r},${g},${b},0.5)"/>
        <stop offset="100%" stop-color="rgba(${r},${g},${b},0.9)"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.55)}" fill="url(#topG)"/>
    <rect y="${Math.round(h * 0.5)}" width="${w}" height="${Math.round(h * 0.5)}" fill="url(#botG)"/>
  </svg>`;
}

/** Generate card with FULL-BLEED image background + gradient overlay + text */
export async function generateCardOnImage(
  config: CardConfig,
  imageBuffer: Buffer,
): Promise<{ data: string; mimeType: string }> {
  const [w, h] = config.size.split("x").map(Number);
  const { r, g, b } = hexToRgb(config.brandColor);

  // Force dark style for text readability on photo background
  const darkConfig = { ...config, style: "dark" as const };
  const textBuffer = await generateCardTextOverlay(darkConfig);

  // Resize image to fill the entire card
  const bgImage = await sharp(imageBuffer)
    .resize(w, h, { fit: "cover" })
    .png()
    .toBuffer();

  // Strong gradient overlay: dark at top (headline), brand color at bottom (CTA)
  const gradientSvg = buildGradientSvg(w, h, r, g, b);
  const gradientBuffer = await sharp(Buffer.from(gradientSvg)).png().toBuffer();

  const result = await sharp(bgImage)
    .composite([
      { input: gradientBuffer, top: 0, left: 0 },
      { input: textBuffer, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  return { data: result.toString("base64"), mimeType: "image/png" };
}

/** Generate card background WITHOUT text or gradient (frontend handles both) */
export async function generateCardOnImageNoText(
  config: CardConfig,
  imageBuffer: Buffer,
): Promise<{ data: string; mimeType: string }> {
  const [w, h] = config.size.split("x").map(Number);

  const bgImage = await sharp(imageBuffer)
    .resize(w, h, { fit: "cover" })
    .png()
    .toBuffer();

  return { data: bgImage.toString("base64"), mimeType: "image/png" };
}

/** Generate card background only (no image, no text) */
export async function generateGraphicCardNoText(config: CardConfig): Promise<{ data: string; mimeType: string }> {
  const bgBuffer = await generateCardBackground(config);
  return { data: bgBuffer.toString("base64"), mimeType: "image/png" };
}
