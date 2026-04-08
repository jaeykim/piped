import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getMetaCampaignDailyMetrics,
  updateAdStatus,
  updateAdSetDailyBudget,
} from "@/lib/services/meta-ads";
import { decide, type OptimizerAction } from "@/lib/services/optimizer";
import { sendTelegram } from "@/lib/services/notifier";

// Hourly cron — auto-optimizes every campaign with optimizationEnabled=true.
//
// Auth: requires `Authorization: Bearer ${CRON_SECRET}` (systemd timer or
// Vercel cron sets this header when invoking the route).
//
// Decisions are written to the OptimizationLog table so users can audit
// what the loop did and why.

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
    const campaigns = await prisma.campaign.findMany({
      where: {
        platform: "meta",
        optimizationEnabled: true,
      },
    });

    // Cache user Meta tokens to avoid re-fetching the user row per campaign.
    const tokenCache = new Map<string, string | null>();

    for (const c of campaigns) {
      summary.examined++;

      if (!c.platformCampaignId || !c.targetRoas) continue;
      if (c.status === "archived") continue;

      let accessToken = tokenCache.get(c.ownerId);
      if (accessToken === undefined) {
        const u = await prisma.user.findUnique({
          where: { id: c.ownerId },
          select: { metaAccessToken: true },
        });
        accessToken = u?.metaAccessToken ?? null;
        tokenCache.set(c.ownerId, accessToken);
      }
      if (!accessToken) continue;

      try {
        const series = await getMetaCampaignDailyMetrics(
          c.platformCampaignId,
          accessToken,
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

        const currentDaily = c.budgetAmount;
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
          await prisma.optimizationLog.create({
            data: {
              campaignDocId: c.id,
              ownerId: c.ownerId,
              kind: "noop",
              reason: action.reason,
              recentRoas,
              recentSpend: totals.spend,
              targetRoas: c.targetRoas,
            },
          });
          continue;
        }

        if (action.kind === "pause") {
          await updateAdStatus(c.platformCampaignId, accessToken, "PAUSED");
          await prisma.campaign.update({
            where: { id: c.id },
            data: { status: "paused" },
          });
          summary.paused++;
          summary.actions++;
          await sendTelegram({
            text:
              `🚨 *${c.name}* 일시정지됨\n` +
              `ROAS ${recentRoas.toFixed(2)}x (목표 ${c.targetRoas}x)\n` +
              `최근 3일 지출 $${totals.spend.toFixed(0)}\n` +
              `https://maktmakr.com/dashboard`,
          });
        }

        if (action.kind === "scale_budget") {
          if (!c.platformAdSetId) {
            await prisma.optimizationLog.create({
              data: {
                campaignDocId: c.id,
                ownerId: c.ownerId,
                kind: "skip",
                reason: "missing_adset_id",
              },
            });
            continue;
          }
          await updateAdSetDailyBudget(
            c.platformAdSetId,
            accessToken,
            action.nextDailyBudget
          );
          await prisma.campaign.update({
            where: { id: c.id },
            data: {
              budgetAmount: action.nextDailyBudget,
              originalDailyBudget: originalDaily, // freeze on first move
            },
          });
          summary.scaled++;
          summary.actions++;
          const arrow = action.nextDailyBudget > currentDaily ? "📈" : "📉";
          await sendTelegram({
            text:
              `${arrow} *${c.name}* 예산 조정\n` +
              `$${currentDaily} → $${action.nextDailyBudget}/일\n` +
              `ROAS ${recentRoas.toFixed(2)}x (목표 ${c.targetRoas}x)\n` +
              `https://maktmakr.com/dashboard`,
          });
        }

        await prisma.optimizationLog.create({
          data: {
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
          },
        });
      } catch (err) {
        summary.errors++;
        await prisma.optimizationLog.create({
          data: {
            campaignDocId: c.id,
            ownerId: c.ownerId,
            kind: "error",
            reason: err instanceof Error ? err.message : "unknown",
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      ...summary,
    });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "cron failed",
        ...summary,
      },
      { status: 500 }
    );
  }
}
