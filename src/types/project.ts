export type ProjectStatus = "crawling" | "analyzed" | "generating" | "ready" | "error";
export type PipelineStage = "analysis" | "copy" | "creatives" | "campaigns" | "affiliates";

export interface Project {
  id: string;
  ownerId: string;
  url: string;
  name: string;
  status: ProjectStatus;
  pipelineStage: PipelineStage;
  createdAt: Date;
  updatedAt: Date;
}
