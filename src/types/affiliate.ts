export type CommissionType = "percentage" | "fixed";
export type ProgramStatus = "active" | "paused" | "closed";

export interface AffiliateProgram {
  id: string;
  projectId: string;
  ownerId: string;
  name: string;
  description: string;
  commissionType: CommissionType;
  commissionValue: number;
  cookieDurationDays: number;
  status: ProgramStatus;
  totalAffiliates: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateLink {
  id: string;
  programId: string;
  influencerId: string;
  code: string;
  destinationUrl: string;
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: Date;
}

export interface AffiliateEvent {
  id: string;
  linkId: string;
  programId: string;
  influencerId: string;
  type: "click" | "conversion";
  conversionValue?: number;
  commission?: number;
  createdAt: Date;
}
