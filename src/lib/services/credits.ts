import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export type CreditAction =
  | "crawl"
  | "copy-generate"
  | "creative-graphic"
  | "creative-ai"
  | "video-generate"
  | "campaign-create"
  | "credit-purchase"
  | "signup-bonus";

export const CREDIT_COSTS: Record<string, number> = {
  crawl: 5,
  "copy-generate": 10,
  "creative-graphic": 5,
  "creative-ai": 15,
  "video-generate": 30,
  "campaign-create": 5,
};

export async function getCredits(uid: string): Promise<number> {
  const snap = await adminDb.doc(`users/${uid}`).get();
  return snap.data()?.credits || 0;
}

export async function hasEnoughCredits(uid: string, amount: number): Promise<boolean> {
  const credits = await getCredits(uid);
  return credits >= amount;
}

export async function deductCredits(
  uid: string,
  amount: number,
  action: CreditAction,
  description?: string
): Promise<number> {
  const userRef = adminDb.doc(`users/${uid}`);

  // Atomic transaction to prevent race conditions
  const newBalance = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const current = snap.data()?.credits || 0;
    if (current < amount) {
      throw new Error(`Insufficient credits: have ${current}, need ${amount}`);
    }
    const updated = current - amount;
    tx.update(userRef, {
      credits: updated,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return updated;
  });

  // Record history (outside transaction for performance)
  await adminDb.collection(`users/${uid}/creditHistory`).add({
    amount: -amount,
    balance: newBalance,
    action,
    description: description || action,
    createdAt: FieldValue.serverTimestamp(),
  });

  return newBalance;
}

export async function addCredits(
  uid: string,
  amount: number,
  action: CreditAction,
  description?: string
): Promise<number> {
  const userRef = adminDb.doc(`users/${uid}`);

  const newBalance = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const current = snap.data()?.credits || 0;
    const updated = current + amount;
    tx.update(userRef, {
      credits: updated,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return updated;
  });

  await adminDb.collection(`users/${uid}/creditHistory`).add({
    amount: +amount,
    balance: newBalance,
    action,
    description: description || action,
    createdAt: FieldValue.serverTimestamp(),
  });

  return newBalance;
}

/**
 * Middleware helper: check credits and return error response if insufficient
 */
export async function requireCredits(uid: string, action: string): Promise<{ ok: boolean; error?: string; cost: number }> {
  const cost = CREDIT_COSTS[action];
  if (!cost) return { ok: true, cost: 0 };

  const has = await hasEnoughCredits(uid, cost);
  if (!has) {
    const balance = await getCredits(uid);
    return {
      ok: false,
      error: `크레딧이 부족합니다. 필요: ${cost}, 잔액: ${balance}. 크레딧을 충전해주세요.`,
      cost,
    };
  }
  return { ok: true, cost };
}
