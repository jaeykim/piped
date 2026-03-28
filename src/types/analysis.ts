export interface SiteAnalysis {
  rawHtmlUrl?: string;
  extractedText: string;
  metaTags: {
    title: string;
    description: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    keywords?: string;
  };
  productName: string;
  valueProposition: string;
  targetAudience: string[];
  keyFeatures: string[];
  tone: string;
  industry: string;
  brandColors: string[];
  screenshots: string[];
  analyzedAt: Date;
}
