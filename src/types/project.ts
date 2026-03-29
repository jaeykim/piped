export type ProjectStatus = "crawling" | "analyzed" | "generating" | "ready" | "error";
export type PipelineStage = "analysis" | "copy" | "creatives" | "campaigns" | "affiliates";
export type CampaignType = "influencer" | "meta" | "google";

export interface Project {
  id: string;
  ownerId: string;
  url: string;
  name: string;
  status: ProjectStatus;
  pipelineStage: PipelineStage;
  campaignType?: CampaignType;
  createdAt: Date;
  updatedAt: Date;
}
