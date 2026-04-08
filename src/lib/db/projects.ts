import { getAuth_ } from "@/lib/firebase/client";
import type { Project, PipelineStage, ProjectStatus, CampaignType } from "@/types/project";
import type { SiteAnalysis } from "@/types/analysis";

// Thin client-side wrappers around the API routes — no direct DB access.

async function authedFetch(path: string, init: RequestInit = {}) {
  const u = getAuth_().currentUser;
  if (!u) throw new Error("not signed in");
  const token = await u.getIdToken();
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function createProject(
  _ownerId: string,
  url: string,
  name: string,
  campaignType?: CampaignType
): Promise<string> {
  const res = await authedFetch("/api/projects", {
    method: "POST",
    body: JSON.stringify({ url, name, campaignType }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "createProject failed");
  const data = await res.json();
  return data.project.id as string;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const res = await authedFetch(`/api/projects/${projectId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.project as Project;
}

export async function getUserProjects(_ownerId: string): Promise<Project[]> {
  const res = await authedFetch("/api/projects");
  if (!res.ok) return [];
  const data = await res.json();
  return data.projects as Project[];
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  pipelineStage?: PipelineStage
) {
  await authedFetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, pipelineStage }),
  });
}

export async function getAnalysis(
  projectId: string
): Promise<SiteAnalysis | null> {
  const res = await authedFetch(`/api/projects/${projectId}?include=analysis`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.project?.analysis) return null;
  // Re-shape Prisma row → SiteAnalysis interface the client uses.
  const a = data.project.analysis;
  return {
    rawHtmlUrl: a.rawHtmlUrl ?? undefined,
    extractedText: a.extractedText,
    metaTags: {
      title: a.metaTitle,
      description: a.metaDescription,
      ogImage: a.ogImage ?? undefined,
      ogTitle: a.ogTitle ?? undefined,
      ogDescription: a.ogDescription ?? undefined,
      keywords: a.keywords ?? undefined,
    },
    productName: a.productName,
    valueProposition: a.valueProposition,
    targetAudience: a.targetAudience,
    keyFeatures: a.keyFeatures,
    tone: a.tone,
    industry: a.industry,
    brandColors: a.brandColors,
    logoUrl: a.logoUrl ?? undefined,
    screenshots: a.screenshots,
    analyzedAt: new Date(a.analyzedAt),
  };
}

// saveAnalysis is now server-only (called from /api/crawl). Stub kept for
// backward compatibility — throws so any stray client caller fails loudly.
export async function saveAnalysis(): Promise<never> {
  throw new Error("saveAnalysis is server-only — call POST /api/crawl");
}
