"use client";

import { useRef, useEffect } from "react";

interface Props {
  baseImage: string;
  hookText: string;
  subheadline?: string;
  cta?: string;
  productName: string;
  brandColor: string;
  size: string;
  className?: string;
  onClick?: () => void;
}

// Smart word wrap that handles Korean (no spaces between chars) and English
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];

  // Split by newlines first
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    if (para.trim() === "") { lines.push(""); continue; }

    // Check if text is mostly CJK (Korean/Japanese/Chinese)
    const cjkRegex = /[\u3000-\u9fff\uac00-\ud7af]/;
    const isCJK = cjkRegex.test(para);

    if (isCJK) {
      // Character-level wrapping for CJK
      let cur = "";
      for (const char of para) {
        const test = cur + char;
        if (ctx.measureText(test).width > maxWidth && cur) {
          lines.push(cur);
          cur = char;
        } else {
          cur = test;
        }
      }
      if (cur) lines.push(cur);
    } else {
      // Word-level wrapping for Latin
      const words = para.split(" ");
      let cur = "";
      for (const word of words) {
        const test = cur ? cur + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && cur) {
          lines.push(cur);
          cur = word;
        } else {
          cur = test;
        }
      }
      if (cur) lines.push(cur);
    }
  }
  return lines;
}

// Auto-shrink font size to fit within maxLines
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  baseFontSize: number,
  fontWeight: string
): { fontSize: number; lines: string[] } {
  let fontSize = baseFontSize;
  let lines: string[] = [];

  for (let attempt = 0; attempt < 8; attempt++) {
    ctx.font = `${fontWeight} ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) break;
    fontSize = Math.round(fontSize * 0.85); // shrink 15% each attempt
  }

  return { fontSize, lines };
}

export function CreativePreview({
  baseImage, hookText, subheadline, cta, productName, brandColor, size, className = "", onClick,
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

      // Gradient overlays
      const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      topGrad.addColorStop(0, "rgba(0,0,0,0.55)");
      topGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, w, h * 0.55);

      const botGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
      botGrad.addColorStop(0, "rgba(0,0,0,0)");
      botGrad.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, h * 0.5, w, h * 0.5);

      const padding = w * 0.07;
      const maxTextWidth = w - padding * 2;
      const baseFontSize = Math.round(w * 0.065);
      const subFontSize = Math.round(w * 0.032);
      const ctaFontSize = Math.round(w * 0.03);
      const badgeFontSize = Math.round(w * 0.02);

      // ─── Headline (auto-fit, max 4 lines) ───
      const { fontSize: headlineSize, lines } = fitFontSize(
        ctx, hookText, maxTextWidth, 4, baseFontSize, "900"
      );
      ctx.font = `900 ${headlineSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const lineHeight = headlineSize * 1.2;
      const headlineY = padding;

      lines.forEach((line, i) => {
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(line, padding, headlineY + i * lineHeight);
      });
      ctx.shadowColor = "transparent";

      // ─── Subheadline ───
      let nextY = headlineY + lines.length * lineHeight + headlineSize * 0.3;
      if (subheadline) {
        ctx.font = `500 ${subFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        const subLines = wrapText(ctx, subheadline, maxTextWidth);
        subLines.slice(0, 2).forEach((line, i) => {
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 6;
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(line, padding, nextY + i * (subFontSize * 1.3));
        });
        ctx.shadowColor = "transparent";
        nextY += subLines.slice(0, 2).length * (subFontSize * 1.3);
      }

      // ─── CTA Button (bottom center) ───
      if (cta) {
        ctx.font = `700 ${ctaFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        const ctaW = ctx.measureText(cta).width + ctaFontSize * 3;
        const ctaH = ctaFontSize * 2.6;
        const ctaX = (w - ctaW) / 2;
        const ctaY = h - padding - ctaH;

        ctx.fillStyle = brandColor;
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH / 2);
        ctx.fill();
        ctx.shadowColor = "transparent";

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cta, w / 2, ctaY + ctaH / 2);
      }

      // ─── Brand Badge (bottom-left) ───
      ctx.font = `600 ${badgeFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const badgeW = ctx.measureText(productName).width + 16;
      const badgeH = badgeFontSize * 2;
      const badgeY = cta ? h - padding - ctaFontSize * 2.6 - badgeH - 10 : h - padding - badgeH;

      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.roundRect(padding, badgeY, badgeW, badgeH, badgeH / 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(productName, padding + 8, badgeY + badgeH / 2);
    };
    img.src = baseImage;
  }, [baseImage, hookText, subheadline, cta, productName, brandColor, size]);

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      className={`h-full w-full object-cover ${onClick ? "cursor-pointer" : ""} ${className}`}
    />
  );
}
