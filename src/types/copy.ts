export type CopyType =
  | "headline"
  | "description_short"
  | "description_long"
  | "ad_meta"
  | "ad_google"
  | "social"
  | "cta";

export interface CopyVariant {
  id: string;
  type: CopyType;
  content: string;
  isEdited: boolean;
  isFavorited: boolean;
  editedContent?: string;
  createdAt: Date;
}
