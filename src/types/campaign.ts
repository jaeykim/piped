export type CampaignPlatform = "meta" | "google";
export type CampaignStatus = "draft" | "pending" | "active" | "paused" | "completed" | "error";
export type CampaignObjective = "traffic" | "conversions" | "awareness";
export type BudgetType = "daily" | "lifetime";

export interface Campaign {
  id: string;
  projectId: string;
  ownerId: string;
  platform: CampaignPlatform;
  platformCampaignId?: string;
  name: string;
  status: CampaignStatus;
  objective: CampaignObjective;
  budget: {
    amount: number;
    currency: string;
    type: BudgetType;
  };
  targeting: {
    ageMin: number;
    ageMax: number;
    genders: ("male" | "female" | "all")[];
    locations: string[];
    interests: string[];
  };
  selectedCopyIds: string[];
  selectedCreativeIds: string[];
  metrics?: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    lastSyncedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
