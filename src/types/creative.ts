export type CreativeSize = "1080x1080" | "1200x628" | "1080x1920" | "1200x1200";
export type CreativePlatform = "instagram" | "facebook" | "google_display" | "general";
export type CreativeStatus = "generating" | "ready" | "failed";

export interface Creative {
  id: string;
  imageUrl: string;
  replicatePredictionId: string;
  prompt: string;
  size: CreativeSize;
  platform: CreativePlatform;
  status: CreativeStatus;
  textOverlay?: {
    text: string;
    position: string;
    fontSize: number;
    color: string;
  };
  createdAt: Date;
}
