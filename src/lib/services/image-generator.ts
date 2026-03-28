import { GoogleGenAI } from "@google/genai";
import type { SiteAnalysis } from "@/types/analysis";
import type { CreativeSize, CreativePlatform } from "@/types/creative";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

interface ImageRequest {
  size: CreativeSize;
  platform: CreativePlatform;
  style: string;
}

const sizeConfig: Record<CreativeSize, { aspectRatio: string; imageSize: string }> = {
  "1080x1080": { aspectRatio: "1:1", imageSize: "1K" },
  "1200x628": { aspectRatio: "16:9", imageSize: "1K" },
  "1080x1920": { aspectRatio: "9:16", imageSize: "1K" },
  "1200x1200": { aspectRatio: "1:1", imageSize: "1K" },
};

export function buildImagePrompt(
  analysis: SiteAnalysis,
  style: string
): string {
  const colors = analysis.brandColors.join(", ") || "modern, clean colors";

  const stylePrompts: Record<string, string> = {
    minimal: `Clean, minimal marketing visual for ${analysis.productName}. ${analysis.valueProposition}. White space, simple geometry, ${colors} color palette. Professional ad creative, no text on image.`,
    bold: `Bold, eye-catching marketing visual for ${analysis.productName}. ${analysis.valueProposition}. Vibrant ${colors} colors, dynamic composition, energetic feel. Professional ad creative, no text on image.`,
  };

  return stylePrompts[style] || stylePrompts.minimal;
}

export interface GeneratedImage {
  imageData: string;
  mimeType: string;
  prompt: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateImage(
  analysis: SiteAnalysis,
  request: ImageRequest,
  maxRetries = 3
): Promise<GeneratedImage> {
  const prompt = buildImagePrompt(analysis, request.style);
  const { aspectRatio } = sizeConfig[request.size];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) throw new Error("No response from image model");

      const imagePart = parts.find(
        (part) => part.inlineData?.mimeType?.startsWith("image/")
      );

      if (!imagePart?.inlineData?.data || !imagePart.inlineData.mimeType) {
        throw new Error("No image in response");
      }

      return {
        imageData: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        prompt,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");

      if (is429 && attempt < maxRetries - 1) {
        // Parse retry delay or default to 60s
        const delayMatch = msg.match(/retry\s*(?:in|Delay.*?)[\s"]*(\d+)/i);
        const waitSec = delayMatch ? parseInt(delayMatch[1]) : 60;
        console.log(`Rate limited. Waiting ${waitSec}s before retry ${attempt + 2}/${maxRetries}...`);
        await sleep(waitSec * 1000);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}

export function getDefaultImageRequests(): ImageRequest[] {
  return [
    { size: "1080x1080", platform: "instagram", style: "minimal" },
    { size: "1200x628", platform: "facebook", style: "bold" },
  ];
}
