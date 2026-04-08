import { getAuth_ } from "@/lib/firebase/client";
import type {
  AffiliateProgram,
  AffiliateLink,
} from "@/types/affiliate";

// Client-side helpers — call API routes instead of touching the DB directly.

async function authedFetch(path: string, init: RequestInit = {}) {
  const u = getAuth_().currentUser;
  const token = u ? await u.getIdToken() : null;
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });
}

export async function createAffiliateProgram(
  data: Omit<AffiliateProgram, "id" | "totalAffiliates" | "createdAt" | "updatedAt">
): Promise<string> {
  const res = await authedFetch("/api/affiliates/programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("create program failed");
  const json = await res.json();
  return json.programId as string;
}

export async function getAffiliatePrograms(): Promise<AffiliateProgram[]> {
  const res = await authedFetch("/api/affiliates/programs");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.programs || []) as AffiliateProgram[];
}

export async function getAffiliateProgram(
  programId: string
): Promise<AffiliateProgram | null> {
  const res = await authedFetch(`/api/affiliates/programs/${programId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.program as AffiliateProgram;
}

export async function createAffiliateLink(
  programId: string
): Promise<{ id: string; code: string }> {
  const res = await authedFetch("/api/affiliates/join", {
    method: "POST",
    body: JSON.stringify({ programId }),
  });
  if (!res.ok) throw new Error("join failed");
  const data = await res.json();
  return { id: data.linkId, code: data.code };
}

export async function getInfluencerLinks(): Promise<AffiliateLink[]> {
  const res = await authedFetch("/api/affiliates/earnings");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.links || []) as AffiliateLink[];
}

export async function getInfluencerEarnings() {
  const res = await authedFetch("/api/affiliates/earnings");
  if (!res.ok)
    return { totalEarnings: 0, totalClicks: 0, totalConversions: 0, links: [] };
  return res.json();
}
