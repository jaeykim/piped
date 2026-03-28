import sharp from "sharp";

interface TextOverlayOptions {
  imageBase64: string;
  mimeType: string;
  headline: string;
  productName: string;
  logoBase64?: string;
  logoMimeType?: string;
  brandColor?: string;
  size: string; // e.g., "1080x1080"
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) || 79,
    g: parseInt(h.substring(2, 4), 16) || 70,
    b: parseInt(h.substring(4, 6), 16) || 229,
  };
}

// Determine if background at the text area is light or dark
async function isTopAreaDark(imageBuffer: Buffer, width: number): Promise<boolean> {
  // Sample a strip from the top-left area where text will go
  const strip = await sharp(imageBuffer)
    .extract({ left: 0, top: 0, width: Math.round(width * 0.6), height: Math.round(width * 0.15) })
    .raw()
    .toBuffer();

  let totalBrightness = 0;
  const pixelCount = strip.length / 3;
  for (let i = 0; i < strip.length; i += 3) {
    totalBrightness += strip[i] * 0.299 + strip[i + 1] * 0.587 + strip[i + 2] * 0.114;
  }
  return totalBrightness / pixelCount < 128;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function overlayTextOnImage(options: TextOverlayOptions): Promise<{ data: string; mimeType: string }> {
  const {
    imageBase64,
    mimeType,
    headline,
    productName,
    logoBase64,
    logoMimeType,
    brandColor = "#4F46E5",
    size,
  } = options;

  const [widthStr, heightStr] = size.split("x");
  const width = parseInt(widthStr);
  const height = parseInt(heightStr);

  const imageBuffer = Buffer.from(imageBase64, "base64");
  const isDark = await isTopAreaDark(imageBuffer, width);

  const textColor = isDark ? "#FFFFFF" : "#0f172a";
  const shadowColor = isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.5)";
  const subtextColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.6)";
  const accent = hexToRgb(brandColor);

  // Font sizes relative to image width
  const headlineFontSize = Math.round(width * 0.065);
  const productFontSize = Math.round(width * 0.022);
  const padding = Math.round(width * 0.08);

  // Badge dimensions
  const badgeHeight = Math.round(productFontSize * 2.2);
  const badgeY = height - padding - badgeHeight;

  // Headline: support line wrapping (rough estimate ~18 chars per line)
  const maxCharsPerLine = Math.floor((width - padding * 2) / (headlineFontSize * 0.55));
  const words = headline.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine && currentLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  const lineHeight = headlineFontSize * 1.2;
  const headlineBlockHeight = lines.length * lineHeight;
  const headlineY = padding;

  // Build SVG overlay
  const headlineLines = lines
    .map(
      (line, i) =>
        `<text x="${padding}" y="${headlineY + headlineFontSize + i * lineHeight}"
          font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${headlineFontSize}"
          fill="${textColor}" letter-spacing="-0.02em">
          <tspan filter="url(#textShadow)">${escapeXml(line)}</tspan>
        </text>`
    )
    .join("\n");

  // Accent bar under headline
  const accentBarY = headlineY + headlineFontSize + headlineBlockHeight + 8;

  const svgOverlay = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="textShadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="${shadowColor}" />
      </filter>
    </defs>

    ${headlineLines}

    <!-- Accent bar -->
    <rect x="${padding}" y="${accentBarY}" width="${Math.round(width * 0.08)}" height="4" rx="2"
      fill="rgb(${accent.r},${accent.g},${accent.b})" />

    <!-- Product name badge (bottom-left) -->
    <rect x="${padding}" y="${badgeY}" width="${productName.length * productFontSize * 0.65 + 24}" height="${badgeHeight}" rx="${badgeHeight / 2}"
      fill="rgba(${accent.r},${accent.g},${accent.b},0.9)" />
    <text x="${padding + 12}" y="${badgeY + badgeHeight * 0.68}"
      font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${productFontSize}"
      fill="#FFFFFF">${escapeXml(productName)}</text>
  </svg>`;

  // Composite: base image + SVG text overlay + optional logo
  let composite: sharp.OverlayOptions[] = [
    { input: Buffer.from(svgOverlay), top: 0, left: 0 },
  ];

  // Add logo if available
  if (logoBase64 && logoMimeType && !logoMimeType.includes("svg")) {
    try {
      const logoSize = Math.round(width * 0.06);
      const logoBuffer = await sharp(Buffer.from(logoBase64, "base64"))
        .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      composite.push({
        input: logoBuffer,
        top: height - padding - Math.round(logoSize * 0.5) - Math.round(badgeHeight * 0.3),
        left: width - padding - logoSize,
      });
    } catch {
      // Skip logo on error
    }
  }

  const result = await sharp(imageBuffer)
    .resize(width, height, { fit: "cover" })
    .composite(composite)
    .png()
    .toBuffer();

  return {
    data: result.toString("base64"),
    mimeType: "image/png",
  };
}
