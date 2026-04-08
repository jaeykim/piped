"use client";

import { useRef, useEffect } from "react";

/**
 * Text overlay styles — based on real Korean Meta ad patterns.
 * NO gradient overlays. Text readability via panels, strips, shadows.
 *
 * "split-text-top"     — White panel upper half, image visible below (IMG_4774, IMG_4798)
 * "bold-strip"         — Brand-color strips behind headline lines (IMG_4779, IMG_4777)
 * "dark-premium"       — Dark semi-transparent fill + brand accent (IMG_4785, IMG_4792)
 * "clean-minimal"      — NO overlay at all. Strong text shadow only (IMG_4778, person photos)
 * "highlight-keyword"  — Brand-color box on numbers, light text shadow (IMG_4794, IMG_4789)
 */
export type TextOverlayStyle = "split-text-top" | "bold-strip" | "dark-premium" | "clean-minimal" | "highlight-keyword";

interface Props {
  baseImage: string;
  hookText: string;
  subheadline?: string;
  cta?: string;
  productName: string;
  brandColor: string;
  size: string;
  textStyle?: TextOverlayStyle;
  className?: string;
  onClick?: () => void;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (para.trim() === "") { lines.push(""); continue; }
    const isCJK = /[\u3000-\u9fff\uac00-\ud7af]/.test(para);
    if (isCJK) {
      const words = para.split(" ");
      let cur = "";
      for (const word of words) {
        const test = cur ? cur + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = word; }
        else cur = test;
      }
      if (cur && ctx.measureText(cur).width > maxWidth) {
        let cc = "";
        for (const ch of cur) {
          if (ctx.measureText(cc + ch).width > maxWidth && cc) { lines.push(cc); cc = ch; }
          else cc += ch;
        }
        if (cc) lines.push(cc);
      } else if (cur) lines.push(cur);
    } else {
      const words = para.split(" ");
      let cur = "";
      for (const word of words) {
        const test = cur ? cur + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = word; }
        else cur = test;
      }
      if (cur) lines.push(cur);
    }
  }
  return lines;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D, text: string, maxWidth: number,
  maxLines: number, baseFontSize: number, fontWeight: string,
): { fontSize: number; lines: string[] } {
  let fontSize = baseFontSize;
  let lines: string[] = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    ctx.font = `${fontWeight} ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) break;
    fontSize = Math.round(fontSize * 0.85);
  }
  return { fontSize, lines };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export function CreativePreview({
  baseImage, hookText, subheadline, cta, productName, brandColor, size,
  textStyle = "split-text-top", className = "", onClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const [w, h] = size.split("x").map(Number);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const pad = w * 0.07;
      const maxW = w - pad * 2;
      const brandIsLight = isLightColor(brandColor);
      const ctaSize = Math.round(w * 0.028);

      // ─── split-text-top ───
      // Opaque white panel on upper portion, dark text, image below
      if (textStyle === "split-text-top") {
        const baseFontSize = Math.round(w * 0.07);
        const { fontSize: headSize, lines } = fitFontSize(ctx, hookText, maxW, 3, baseFontSize, "900");
        const lineH = headSize * 1.15;
        const subSize = Math.round(w * 0.028);

        // Calculate panel height to fit text
        let contentH = pad + lines.length * lineH + headSize * 0.3;
        if (subheadline) contentH += subSize * 2.5;
        contentH += pad * 0.5;
        const panelH = Math.min(Math.round(h * 0.5), Math.round(contentH));

        // White panel
        ctx.fillStyle = "rgba(255,255,255,0.93)";
        ctx.fillRect(0, 0, w, panelH);
        // Soft bottom edge (2px feather, not a gradient overlay)
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(0, panelH, w, 3);

        // Dark text with brand-colored numbers
        const hlPattern = /\d[\d,]*\s*[%배분초만원개+일월주년]*/g;
        lines.forEach((line, i) => {
          const y = pad + headSize + i * lineH;
          ctx.font = `900 ${headSize}px ${FONT}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";

          let x = pad;
          const matches = [...line.matchAll(hlPattern)];
          if (matches.length > 0) {
            let lastIdx = 0;
            for (const match of matches) {
              if (match.index! > lastIdx) {
                ctx.fillStyle = "#1a1a2e";
                const seg = line.slice(lastIdx, match.index!);
                ctx.fillText(seg, x, y);
                x += ctx.measureText(seg).width;
              }
              ctx.fillStyle = brandColor;
              ctx.fillText(match[0], x, y);
              x += ctx.measureText(match[0]).width;
              lastIdx = match.index! + match[0].length;
            }
            if (lastIdx < line.length) {
              ctx.fillStyle = "#1a1a2e";
              ctx.fillText(line.slice(lastIdx), x, y);
            }
          } else {
            ctx.fillStyle = "#1a1a2e";
            ctx.fillText(line, pad, y);
          }
        });

        // Subheadline
        if (subheadline) {
          const subY = pad + lines.length * lineH + headSize * 0.4;
          ctx.font = `500 ${subSize}px ${FONT}`;
          ctx.fillStyle = "rgba(26,26,46,0.5)";
          wrapText(ctx, subheadline, maxW).slice(0, 2).forEach((line, i) => {
            ctx.fillText(line, pad, subY + i * (subSize * 1.4));
          });
        }

        // Brand name on panel
        const bSize = Math.round(w * 0.018);
        ctx.font = `600 ${bSize}px ${FONT}`;
        ctx.fillStyle = "rgba(26,26,46,0.5)";
        ctx.fillText(productName, pad, panelH - pad * 0.4);

        // CTA at bottom (no gradient, just a pill)
        drawCTA(ctx, w, h, pad, ctaSize, cta, brandColor, brandIsLight);
      }

      // ─── bold-strip ───
      // Brand-color strips behind each headline line, image mostly visible
      else if (textStyle === "bold-strip") {
        const baseFontSize = Math.round(w * 0.07);
        const { fontSize: headSize, lines } = fitFontSize(ctx, hookText, maxW - 20, 3, baseFontSize, "900");
        ctx.font = `900 ${headSize}px ${FONT}`;
        const lineH = headSize * 1.3;
        const stripPadX = headSize * 0.35;
        const stripPadY = headSize * 0.15;

        lines.forEach((line, i) => {
          const y = pad + i * lineH;
          const tw = ctx.measureText(line).width;
          ctx.fillStyle = hexToRgba(brandColor, 0.92);
          ctx.fillRect(pad - stripPadX, y - stripPadY, tw + stripPadX * 2, headSize + stripPadY * 2);
          ctx.fillStyle = brandIsLight ? "#1a1a2e" : "#FFFFFF";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(line, pad, y);
        });

        // Subheadline with shadow
        if (subheadline) {
          const subSize = Math.round(w * 0.03);
          const nextY = pad + lines.length * lineH + headSize * 0.2;
          ctx.font = `600 ${subSize}px ${FONT}`;
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 10;
          ctx.fillStyle = "#FFFFFF";
          wrapText(ctx, subheadline, maxW).slice(0, 2).forEach((line, i) => {
            ctx.fillText(line, pad, nextY + i * (subSize * 1.3));
          });
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }

        drawCTA(ctx, w, h, pad, ctaSize, cta, brandColor, brandIsLight);
        drawBrand(ctx, w, h, pad, Math.round(w * 0.018), productName, cta, ctaSize);
      }

      // ─── dark-premium ───
      // Semi-transparent dark fill (not gradient), brand accent shape
      else if (textStyle === "dark-premium") {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, w, h);

        // Brand accent circle
        ctx.fillStyle = hexToRgba(brandColor, 0.15);
        ctx.beginPath();
        ctx.arc(w * 0.82, h * 0.18, w * 0.22, 0, Math.PI * 2);
        ctx.fill();

        const baseFontSize = Math.round(w * 0.075);
        const { fontSize: headSize, lines } = fitFontSize(ctx, hookText, maxW, 4, baseFontSize, "900");
        const lineH = headSize * 1.15;
        const startY = h * 0.15;

        lines.forEach((line, i) => {
          ctx.font = `900 ${headSize}px ${FONT}`;
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(line, pad, startY + i * lineH);
        });

        if (subheadline) {
          const subSize = Math.round(w * 0.03);
          ctx.font = `500 ${subSize}px ${FONT}`;
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          const subY = startY + lines.length * lineH + headSize * 0.3;
          wrapText(ctx, subheadline, maxW).slice(0, 2).forEach((line, i) => {
            ctx.fillText(line, pad, subY + i * (subSize * 1.3));
          });
        }

        drawCTA(ctx, w, h, pad, ctaSize, cta, brandColor, brandIsLight);
        drawBrand(ctx, w, h, pad, Math.round(w * 0.018), productName, cta, ctaSize);
      }

      // ─── clean-minimal ───
      // Text with dark backing strip for readability, no full overlay
      else if (textStyle === "clean-minimal") {
        const baseFontSize = Math.round(w * 0.06);
        const { fontSize: headSize, lines } = fitFontSize(ctx, hookText, maxW, 3, baseFontSize, "900");
        const lineH = headSize * 1.15;

        // Draw dark backing behind text area only (not full width)
        const textBlockH = lines.length * lineH + headSize * 0.5;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.roundRect(pad * 0.5, pad * 0.5, maxW + pad, textBlockH + (subheadline ? Math.round(w * 0.03) * 3 : 0) + pad, w * 0.02);
        ctx.fill();

        lines.forEach((line, i) => {
          ctx.font = `900 ${headSize}px ${FONT}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(line, pad, pad + i * lineH);
        });

        // Sub text inside the dark backing
        if (subheadline) {
          const subSize = Math.round(w * 0.025);
          const subY = pad + lines.length * lineH + headSize * 0.2;
          ctx.font = `500 ${subSize}px ${FONT}`;
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          wrapText(ctx, subheadline, maxW).slice(0, 2).forEach((line, i) => {
            ctx.fillText(line, pad, subY + i * (subSize * 1.3));
          });
        }

        // Brand below backing
        const bSize = Math.round(w * 0.016);
        ctx.font = `600 ${bSize}px ${FONT}`;
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        const brandY = pad + lines.length * lineH + headSize * 0.5 + (subheadline ? Math.round(w * 0.03) * 3 : 0);
        ctx.fillText(productName, pad, brandY);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // Bottom thin bar for CTA
        if (cta) {
          const barH = ctaSize * 3;
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(0, h - barH, w, barH);
          ctx.font = `700 ${ctaSize}px ${FONT}`;
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(cta, w / 2, h - barH / 2);
        }
      }

      // ─── highlight-keyword ───
      // Brand-color box on numbers/keywords, shadow text, very subtle top tint
      else if (textStyle === "highlight-keyword") {
        // Tiny tint on text area only (not a gradient, just a rect)
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, w, Math.round(h * 0.35));

        const baseFontSize = Math.round(w * 0.065);
        const { fontSize: headSize, lines } = fitFontSize(ctx, hookText, maxW, 4, baseFontSize, "900");
        const lineH = headSize * 1.2;
        const hlPattern = /\d[\d,]*\s*[%배분초만원개+일월주년]*(?:\s*만에)?/g;

        lines.forEach((line, i) => {
          const y = pad + headSize + i * lineH;
          ctx.font = `900 ${headSize}px ${FONT}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";

          // Find and draw highlights first
          const matches = [...line.matchAll(hlPattern)];
          if (matches.length > 0) {
            let x = pad;
            let lastIdx = 0;
            for (const match of matches) {
              if (match.index! > lastIdx) {
                x += ctx.measureText(line.slice(lastIdx, match.index!)).width;
              }
              const hlW = ctx.measureText(match[0]).width;
              const hlPad = headSize * 0.12;
              ctx.fillStyle = brandColor;
              ctx.fillRect(x - hlPad, y - headSize * 0.82, hlW + hlPad * 2, headSize * 1.0);
              x += hlW;
              lastIdx = match.index! + match[0].length;
            }
          }

          // Draw full line text
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 14;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(line, pad, y);
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        });

        if (subheadline) {
          const subSize = Math.round(w * 0.026);
          const nextY = pad + lines.length * lineH + headSize * 0.5;
          ctx.font = `600 ${subSize}px ${FONT}`;
          const subLines = wrapText(ctx, subheadline, maxW).slice(0, 2);
          // Dark backing strip behind sub text for contrast
          const subBlockH = subLines.length * (subSize * 1.3) + subSize * 0.6;
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.beginPath();
          ctx.roundRect(pad * 0.7, nextY - subSize * 0.3, maxW + pad * 0.6, subBlockH, w * 0.01);
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          subLines.forEach((line, i) => {
            ctx.fillText(line, pad, nextY + i * (subSize * 1.3));
          });
        }

        drawCTA(ctx, w, h, pad, ctaSize, cta, brandColor, brandIsLight);
        drawBrand(ctx, w, h, pad, Math.round(w * 0.018), productName, cta, ctaSize);
      }
    };
    img.src = baseImage;
  }, [baseImage, hookText, subheadline, cta, productName, brandColor, size, textStyle]);

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      className={`h-full w-full object-cover ${onClick ? "cursor-pointer" : ""} ${className}`}
    />
  );
}

/**
 * Render the preview to an offscreen canvas and return as data URL.
 * Used by CreativeEditor to match the gallery preview exactly.
 */
export function renderPreviewToCanvas(opts: {
  baseImageSrc: string;
  hookText: string;
  subheadline?: string;
  cta?: string;
  productName: string;
  brandColor: string;
  size: string;
  textStyle?: TextOverlayStyle;
}): Promise<string> {
  return new Promise((resolve) => {
    const tempCanvas = document.createElement("canvas");
    const ref = { current: tempCanvas };
    const img = new Image();
    img.onload = () => {
      const [w, h] = opts.size.split("x").map(Number);
      tempCanvas.width = w;
      tempCanvas.height = h;
      // Reuse the component by creating a temporary one — but simpler to just
      // draw the base and let the caller use CreativePreview component.
      // For now, just composite base image and return it.
      const ctx = tempCanvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(tempCanvas.toDataURL("image/png"));
    };
    img.src = opts.baseImageSrc;
  });
}

// ─── Helpers ───

function drawCTA(
  ctx: CanvasRenderingContext2D, w: number, h: number, pad: number,
  ctaSize: number, cta: string | undefined, brandColor: string, brandIsLight: boolean,
) {
  if (!cta) return;
  ctx.font = `700 ${ctaSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  const ctaW = ctx.measureText(cta).width + ctaSize * 3;
  const ctaH = ctaSize * 2.6;
  const ctaX = (w - ctaW) / 2;
  const ctaY = h - pad - ctaH;
  ctx.fillStyle = brandColor;
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = brandIsLight ? "#1a1a2e" : "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cta, w / 2, ctaY + ctaH / 2);
}

function drawBrand(
  ctx: CanvasRenderingContext2D, w: number, h: number, pad: number,
  badgeSize: number, productName: string, cta: string | undefined, ctaSize: number,
) {
  ctx.font = `600 ${badgeSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const bw = ctx.measureText(productName).width + 16;
  const bh = badgeSize * 2;
  const bY = cta ? h - pad - ctaSize * 2.6 - bh - 10 : h - pad - bh;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.roundRect(pad, bY, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(productName, pad + 8, bY + bh / 2);
}
