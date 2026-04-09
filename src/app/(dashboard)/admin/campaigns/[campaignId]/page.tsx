"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Target } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getAuth_ } from "@/lib/firebase/client";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

interface DailyMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  roas: number;
}

interface CampaignDetail {
  campaign: {
    id: string;
    name: string;
    status: string;
    platform: string;
    objective: string;
    platformCampaignId: string | null;
    platformAdSetId: string | null;
    platformAdId: string | null;
    budget: { amount: number; currency: string; type: string };
    originalDailyBudget: number | null;
    targeting: {
      ageMin: number;
      ageMax: number;
      genders: string[];
      locations: string[];
      interests: string[];
      language: string | null;
    };
    placements: string[];
    bidStrategy: string | null;
    scheduleStart: string | null;
    scheduleEnd: string | null;
    targetRoas: number | null;
    optimizationEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
  owner: { id: string; email: string; displayName: string };
  project: {
    id: string;
    name: string;
    url: string;
    creatives: Array<{
      id: string;
      imageUrl: string;
      concept: string;
      size: string;
      createdAt: string;
    }>;
    copyVariants: Array<{
      id: string;
      type: string;
      content: string;
    }>;
  } | null;
  optimizationLogs: Array<{
    id: string;
    kind: string;
    reason: string;
    recentRoas: number | null;
    targetRoas: number | null;
    nextDailyBudget: number | null;
    createdAt: string;
  }>;
  metrics: {
    daily: DailyMetric[];
    totals: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      conversionValue: number;
      ctr: number;
      cpc: number;
      cpa: number;
      roas: number;
    };
  };
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const { locale } = useLocale();
  const { toast } = useToast();
  const isKo = locale.startsWith("ko");

  const [data, setData] = useState<CampaignDetail | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      setData(await res.json());
    } catch {
      toast("error", isKo ? "조회 실패" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast, isKo]);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          {isKo ? "접근 권한이 없습니다" : "Forbidden"}
        </h1>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const c = data.campaign;
  const totals = data.metrics.totals;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/admin/users/${data.owner.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {data.owner.displayName || data.owner.email}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            {c.name}
            <Badge variant={c.status === "active" ? "success" : "warning"}>
              {c.status}
            </Badge>
            <Badge variant="info">{c.platform.toUpperCase()}</Badge>
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            {c.id}
            {c.platformCampaignId && (
              <span className="ml-2">· meta:{c.platformCampaignId}</span>
            )}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>
            {isKo ? "생성" : "Created"}{" "}
            {new Date(c.createdAt).toLocaleString()}
          </p>
          <p>
            {isKo ? "수정" : "Updated"}{" "}
            {new Date(c.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Live metrics totals */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: isKo ? "지출 (14d)" : "Spend (14d)",
            value: fmtMoney(totals.spend),
          },
          {
            label: isKo ? "노출" : "Impressions",
            value: totals.impressions.toLocaleString(),
          },
          {
            label: "CTR",
            value: `${totals.ctr.toFixed(2)}%`,
          },
          {
            label: "ROAS",
            value: `${totals.roas.toFixed(2)}x`,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className="mt-0.5 text-xl font-bold text-gray-900">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily chart */}
      {data.metrics.daily.length > 0 && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              {isKo ? "일별 지출 & ROAS (14일)" : "Daily Spend & ROAS (14d)"}
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={data.metrics.daily}
                margin={{ top: 6, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v: number) => `${v.toFixed(1)}x`}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="spend"
                  name="Spend"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="roas"
                  name="ROAS"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        {isKo ? "캠페인 설정" : "Configuration"}
      </h2>
      <Card className="mt-2">
        <CardContent className="grid gap-3 py-4 text-xs sm:grid-cols-2">
          {[
            { label: isKo ? "목표" : "Objective", value: c.objective },
            {
              label: isKo ? "예산" : "Budget",
              value: `${fmtMoney(c.budget.amount)}/${
                c.budget.type === "daily" ? (isKo ? "일" : "day") : "lifetime"
              }`,
            },
            {
              label: isKo ? "원본 예산" : "Original budget",
              value: c.originalDailyBudget
                ? fmtMoney(c.originalDailyBudget)
                : "—",
            },
            {
              label: isKo ? "연령" : "Age",
              value: `${c.targeting.ageMin}–${c.targeting.ageMax}`,
            },
            {
              label: isKo ? "성별" : "Gender",
              value:
                c.targeting.genders.length === 0
                  ? isKo
                    ? "전체"
                    : "All"
                  : c.targeting.genders.join(", "),
            },
            {
              label: isKo ? "지역" : "Locations",
              value: c.targeting.locations.join(", ") || "—",
            },
            {
              label: isKo ? "관심사" : "Interests",
              value: c.targeting.interests.join(", ") || "—",
            },
            {
              label: isKo ? "언어" : "Language",
              value: c.targeting.language || "—",
            },
            {
              label: isKo ? "게재 위치" : "Placements",
              value: c.placements.join(", ") || "(auto)",
            },
            {
              label: isKo ? "입찰" : "Bid strategy",
              value: c.bidStrategy || "LOWEST_COST_WITHOUT_CAP",
            },
            {
              label: isKo ? "일정" : "Schedule",
              value:
                c.scheduleStart || c.scheduleEnd
                  ? `${c.scheduleStart?.slice(0, 10) || "—"} → ${
                      c.scheduleEnd?.slice(0, 10) || "ongoing"
                    }`
                  : isKo
                  ? "계속"
                  : "Continuous",
            },
            {
              label: isKo ? "목표 ROAS" : "Target ROAS",
              value: c.targetRoas
                ? `${c.targetRoas}x ${
                    c.optimizationEnabled
                      ? isKo
                        ? "(자동화 ON)"
                        : "(autopilot ON)"
                      : ""
                  }`
                : "—",
            },
          ].map((r) => (
            <div key={r.label} className="flex justify-between gap-2">
              <span className="text-gray-500">{r.label}</span>
              <span className="text-right font-medium text-gray-900">
                {r.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Linked project + creatives */}
      {data.project && (
        <>
          <h2 className="mt-6 text-sm font-semibold text-gray-700">
            {isKo ? "연결된 프로젝트" : "Linked project"}
          </h2>
          <Card className="mt-2">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-gray-900">
                {data.project.name}
              </p>
              <p className="text-[11px] text-gray-400">{data.project.url}</p>

              {data.project.creatives.length > 0 && (
                <>
                  <p className="mt-4 text-[11px] uppercase tracking-wider text-gray-400">
                    {isKo ? "광고 소재" : "Creatives"} (
                    {data.project.creatives.length})
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {data.project.creatives.map((cr) => (
                      <Link
                        key={cr.id}
                        href={`/admin/creatives/${cr.id}`}
                        className="group block aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                      >
                        {cr.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cr.imageUrl}
                            alt={cr.concept}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-300">
                            no img
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {data.project.copyVariants.length > 0 && (
                <>
                  <p className="mt-4 text-[11px] uppercase tracking-wider text-gray-400">
                    {isKo ? "광고 카피" : "Copy variants"}
                  </p>
                  <ul className="mt-1.5 space-y-1 text-[11px] text-gray-600">
                    {data.project.copyVariants.slice(0, 6).map((cv) => (
                      <li key={cv.id} className="truncate">
                        <span className="text-gray-400">{cv.type}:</span>{" "}
                        {cv.content}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Optimization log */}
      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        {isKo ? "자동 최적화 활동" : "Optimization activity"}{" "}
        <span className="ml-1 text-gray-400">
          ({data.optimizationLogs.length})
        </span>
      </h2>
      <Card className="mt-2">
        <CardContent className="py-2">
          {data.optimizationLogs.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              {isKo ? "활동 없음" : "No activity yet"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 text-xs">
              {data.optimizationLogs.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{l.kind}</p>
                    <p className="text-[10px] text-gray-400">
                      {l.recentRoas != null && (
                        <>
                          ROAS {l.recentRoas.toFixed(2)}x
                          {l.targetRoas != null && (
                            <> (target {l.targetRoas}x)</>
                          )}{" "}
                          ·{" "}
                        </>
                      )}
                      {l.reason}
                      {l.nextDailyBudget != null && (
                        <> · → {fmtMoney(l.nextDailyBudget)}</>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-gray-400">
                    {new Date(l.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
