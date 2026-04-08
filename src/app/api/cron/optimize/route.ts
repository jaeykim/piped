import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  getMetaCampaignDailyMetrics,
  updateAdStatus,
  updateAdSetDailyBudget,
} from "@/lib/services/meta-ads";
import { decide, type OptimizerAction } from "@/lib/services/optimizer";

// Hourly cron — auto-optimizes every campaign with optimizationEnabled=true.
//
// Auth: requires `Authorization: Bearer ${CRON_SECRET}` (Vercel cron sets
// this when configured via vercel.json).
//
// Decisions are written to `optimizationLogs` so users can audit what the
// loop did and why.

interface CampaignDoc {
  id: string;
  ownerId: string;
  name: string;
  status: string;
  platform: string;
  platformCampaignId?: string;
  platformAdSetId?: string;
  platformAdId?: string;
  targetRoas?: number | null;
  optimizationEnabled?: boolean;
  budget?: { amount: number; currency: string; type: string };
  originalDailyBudget?: number;
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const summary = {
    examined: 0,
    actions: 0,
    paused: 0,
    scaled: 0,
    errors: 0,
  };

  try {
    const snap = await adminDb
      .collection("campaigns")
      .where("platform", "==", "meta")
      .where("optimizationEnabled", "==", true)
      .get();

    // Cache user Meta tokens to avoid re-fetching the user doc per campaign.
    const tokenCache = new Map<string, { accessToken: string } | null>();

    for (const doc of snap.docs) {
      const c = { id: doc.id, ...(doc.data() as Omit<CampaignDoc, "id">) };
      summary.examined++;

      if (!c.platformCampaignId || !c.targetRoas) continue;
      if (c.status === "archived") continue;

      // Resolve user's Meta token (cached)
      let meta: { accessToken: string } | null;
      if (tokenCache.has(c.ownerId)) {
        meta = tokenCache.get(c.ownerId) ?? null;
      } else {
        const userSnap = await adminDb.doc(`users/${c.ownerId}`).get();
        meta = userSnap.data()?.integrations?.meta || null;
        tokenCache.set(c.ownerId, meta);
      }
      if (!meta?.accessToken) continue;

      try {
        const series = await getMetaCampaignDailyMetrics(
          c.platformCampaignId,
          meta.accessToken,
          3
        );
        const totals = series.reduce(
          (acc, d) => ({
            spend: acc.spend + d.spend,
            value: acc.value + d.conversionValue,
          }),
          { spend: 0, value: 0 }
        );
        const recentRoas = totals.spend > 0 ? totals.value / totals.spend : 0;

        const currentDaily = c.budget?.amount ?? 0;
        const originalDaily = c.originalDailyBudget ?? currentDaily;

        const action: OptimizerAction = decide({
          campaignId: c.id,
          targetRoas: c.targetRoas,
          recentRoas,
          recentSpend: totals.spend,
          currentDailyBudget: currentDaily,
          originalDailyBudget: originalDaily,
          status: c.status,
        });

        if (action.kind === "noop") {
          await adminDb.collection("optimizationLogs").add({
            campaignDocId: c.id,
            ownerId: c.ownerId,
            kind: "noop",
            reason: action.reason,
            recentRoas,
            recentSpend: totals.spend,
            targetRoas: c.targetRoas,
            createdAt: FieldValue.serverTimestamp(),
          });
          continue;
        }

        if (action.kind === "pause") {
          await updateAdStatus(
            c.platformCampaignId,
            meta.accessToken,
            "PAUSED"
          );
          await doc.ref.update({
            status: "paused",
            updatedAt: FieldValue.serverTimestamp(),
          });
          summary.paused++;
          summary.actions++;
        }

        if (action.kind === "scale_budget") {
          if (!c.platformAdSetId) {
            // Can't scale without an ad-set ID — log and skip
            await adminDb.collection("optimizationLogs").add({
              campaignDocId: c.id,
              ownerId: c.ownerId,
              kind: "skip",
              reason: "missing_adset_id",
              createdAt: FieldValue.serverTimestamp(),
            });
            continue;
          }
          await updateAdSetDailyBudget(
            c.platformAdSetId,
            meta.accessToken,
            action.nextDailyBudget
          );
          await doc.ref.update({
            "budget.amount": action.nextDailyBudget,
            originalDailyBudget: originalDaily, // freeze original on first move
            updatedAt: FieldValue.serverTimestamp(),
          });
          summary.scaled++;
          summary.actions++;
        }

        await adminDb.collection("optimizationLogs").add({
          campaignDocId: c.id,
          ownerId: c.ownerId,
          kind: action.kind,
          reason: action.reason,
          recentRoas,
          recentSpend: totals.spend,
          targetRoas: c.targetRoas,
          ...(action.kind === "scale_budget"
            ? { nextDailyBudget: action.nextDailyBudget }
            : {}),
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (err) {
        summary.errors++;
        await adminDb.collection("optimizationLogs").add({
          campaignDocId: c.id,
          ownerId: c.ownerId,
          kind: "error",
          reason: err instanceof Error ? err.message : "unknown",
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      ...summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "cron failed",
        ...summary,
      },
      { status: 500 }
    );
  }
}
