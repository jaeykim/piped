import { prisma } from "@/lib/prisma";

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
  const u = await prisma.user.findUnique({
    where: { id: uid },
    select: { credits: true },
  });
  return u?.credits ?? 0;
}

export async function hasEnoughCredits(uid: string, amount: number): Promise<boolean> {
  return (await getCredits(uid)) >= amount;
}

async function adjust(
  uid: string,
  delta: number,
  action: CreditAction,
  description?: string
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const u = await tx.user.findUnique({
      where: { id: uid },
      select: { credits: true },
    });
    if (!u) throw new Error("user not found");
    const current = u.credits;
    if (delta < 0 && current + delta < 0) {
      throw new Error(`Insufficient credits: have ${current}, need ${-delta}`);
    }
    const next = current + delta;
    await tx.user.update({
      where: { id: uid },
      data: { credits: next },
    });
    await tx.creditHistory.create({
      data: {
        userId: uid,
        amount: delta,
        balance: next,
        action,
        description: description || action,
      },
    });
    return next;
  });
}

export async function deductCredits(
  uid: string,
  amount: number,
  action: CreditAction,
  description?: string
): Promise<number> {
  return adjust(uid, -Math.abs(amount), action, description);
}

export async function addCredits(
  uid: string,
  amount: number,
  action: CreditAction,
  description?: string
): Promise<number> {
  return adjust(uid, Math.abs(amount), action, description);
}

/**
 * Middleware helper: check credits and return error response if insufficient
 */
export async function requireCredits(
  uid: string,
  action: string
): Promise<{ ok: boolean; error?: string; cost: number }> {
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
