import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

export interface VideoRequest {
  imageBase64: string;
  imageMimeType: string;
  prompt: string;
  durationSeconds?: number;
}

export interface GeneratedVideo {
  videoUri?: string;
  videoBytes?: string;
  mimeType: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateVideoFromImage(
  request: VideoRequest
): Promise<GeneratedVideo> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY is not configured. Set it in your environment variables.");
  }

  const duration = request.durationSeconds || 5;

  // Start video generation (async operation)
  const model = process.env.GOOGLE_VIDEO_MODEL || "veo-2.0-generate-001";
  const operation = await ai.models.generateVideos({
    model,
    image: {
      imageBytes: request.imageBase64,
      mimeType: request.imageMimeType,
    },
    prompt: request.prompt,
    config: {
      numberOfVideos: 1,
      durationSeconds: duration,
    },
  });

  // Poll until complete (Veo is async, returns an operation)
  let result = operation;
  for (let i = 0; i < 60; i++) {
    if (result.done) break;
    await sleep(5000); // poll every 5 seconds
    // Re-fetch operation status
    if (result.name) {
      result = await ai.operations.getVideosOperation({ operation: result });
    }
  }

  if (!result.done) {
    throw new Error("Video generation timed out (5 minutes)");
  }

  if (result.error) {
    throw new Error(`Video generation failed: ${JSON.stringify(result.error)}`);
  }

  const video = result.response?.generatedVideos?.[0]?.video;
  if (!video) {
    throw new Error("No video in response");
  }

  // If we have a URI, download server-side with API key (client can't access directly)
  if (video.uri && !video.videoBytes) {
    const separator = video.uri.includes("?") ? "&" : "?";
    const authUrl = `${video.uri}${separator}key=${process.env.GOOGLE_AI_API_KEY}`;
    const dlRes = await fetch(authUrl);
    if (!dlRes.ok) {
      throw new Error(`Failed to download video: ${dlRes.status} ${dlRes.statusText}`);
    }
    const buffer = Buffer.from(await dlRes.arrayBuffer());
    return {
      videoBytes: buffer.toString("base64"),
      mimeType: video.mimeType || "video/mp4",
    };
  }

  return {
    videoUri: video.uri,
    videoBytes: video.videoBytes,
    mimeType: video.mimeType || "video/mp4",
  };
}
