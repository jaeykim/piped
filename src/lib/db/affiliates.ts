import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { nanoid } from "nanoid";
import type {
  AffiliateProgram,
  AffiliateLink,
  AffiliateEvent,
} from "@/types/affiliate";

export async function createAffiliateProgram(
  data: Omit<AffiliateProgram, "id" | "totalAffiliates" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collection(getDb(), "affiliatePrograms"), {
    ...data,
    totalAffiliates: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAffiliatePrograms(
  filters?: { ownerId?: string; status?: string }
): Promise<AffiliateProgram[]> {
  let q = query(
    collection(getDb(), "affiliatePrograms"),
    orderBy("createdAt", "desc")
  );

  if (filters?.ownerId) {
    q = query(q, where("ownerId", "==", filters.ownerId));
  }
  if (filters?.status) {
    q = query(q, where("status", "==", filters.status));
  }

  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as AffiliateProgram
  );
}

export async function getAffiliateProgram(
  programId: string
): Promise<AffiliateProgram | null> {
  const snap = await getDoc(doc(getDb(), "affiliatePrograms", programId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AffiliateProgram;
}

export async function createAffiliateLink(
  programId: string,
  influencerId: string,
  destinationUrl: string
): Promise<AffiliateLink> {
  const code = nanoid(8);
  const linkRef = await addDoc(collection(getDb(), "affiliateLinks"), {
    programId,
    influencerId,
    code,
    destinationUrl,
    clicks: 0,
    conversions: 0,
    earnings: 0,
    createdAt: serverTimestamp(),
  });

  // Increment program's affiliate count
  await updateDoc(doc(getDb(), "affiliatePrograms", programId), {
    totalAffiliates: increment(1),
    updatedAt: serverTimestamp(),
  });

  return {
    id: linkRef.id,
    programId,
    influencerId,
    code,
    destinationUrl,
    clicks: 0,
    conversions: 0,
    earnings: 0,
    createdAt: new Date(),
  };
}

export async function getInfluencerLinks(
  influencerId: string
): Promise<AffiliateLink[]> {
  const q = query(
    collection(getDb(), "affiliateLinks"),
    where("influencerId", "==", influencerId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as AffiliateLink
  );
}

export async function getAffiliateLinkByCode(
  code: string
): Promise<AffiliateLink | null> {
  const q = query(
    collection(getDb(), "affiliateLinks"),
    where("code", "==", code)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as AffiliateLink;
}

export async function recordAffiliateEvent(
  event: Omit<AffiliateEvent, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(getDb(), "affiliateEvents"), {
    ...event,
    createdAt: serverTimestamp(),
  });

  // Update link counters
  const linkRef = doc(getDb(), "affiliateLinks", event.linkId);
  if (event.type === "click") {
    await updateDoc(linkRef, { clicks: increment(1) });
  } else if (event.type === "conversion") {
    await updateDoc(linkRef, {
      conversions: increment(1),
      earnings: increment(event.commission || 0),
    });
  }
}

export async function getInfluencerEarnings(influencerId: string) {
  const links = await getInfluencerLinks(influencerId);
  const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0);

  return { totalEarnings, totalClicks, totalConversions, links };
}
