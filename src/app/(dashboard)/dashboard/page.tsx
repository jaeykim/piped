"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  AlertCircle,
  Plus,
  Pause,
  Play,
  Activity,
  Zap,
  ShoppingCart,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface DailyMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  conversionValue: number;
  roas: number;
}

interface Totals {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

interface CampaignSummary {
  campaignId: string;
  name: string;
  status: string;
  targetRoas: number | null;
  series: DailyMetric[];
  totals: Totals;
}

interface CampaignSettings {
  id: string;
  name: string;
  objective: string;
  budget: { amount: number; currency: string; type: string };
  targeting: {
    ageMin: number;
    ageMax: number;
    genders: string[];
    locations: string[];
    interests: string[];
    language?: string | null;
  };
  placements: string[];
  bidStrategy: string | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  targetRoas: number | null;
  optimizationEnabled: boolean;
  platformCampaignId: string | null;
}

interface InsightsResponse {
  connected: boolean;
  days: number;
  totals: Totals;
  daily: DailyMetric[];
  campaigns: CampaignSummary[];
}

interface OptimizationLogEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  kind: "noop" | "pause" | "scale_budget" | "skip" | "error";
  reason: string;
  recentRoas: number | null;
  recentSpend: number | null;
  targetRoas: number | null;
  nextDailyBudget: number | null;
  createdAt: string;
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtCompact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1)}k`
    : Math.round(n).toString();

function relativeTime(iso: string, isKo: boolean): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return isKo ? "방금 전" : "just now";
  if (m < 60) return isKo ? `${m}분 전` : `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return isKo ? `${h}시간 전` : `${h}h ago`;
  const d = Math.round(h / 24);
  return isKo ? `${d}일 전` : `${d}d ago`;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { locale } = useLocale();
  const { toast } = useToast();
  const isKo = locale.startsWith("ko");
  const metaConnected = !!profile?.integrations?.meta?.accessToken;

  const [days, setDays] = useState(14);
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [logs, setLogs] = useState<OptimizationLogEntry[]>([]);
  const [settings, setSettings] = useState<Record<string, CampaignSettings>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile || !metaConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [insightsRes, logsRes, campaignsRes] = await Promise.all([
        fetch(`/api/campaigns/meta/insights?days=${days}`, { headers }),
        fetch(`/api/optimization-logs?limit=30`, { headers }),
        fetch(`/api/campaigns`, { headers }),
      ]);
      if (!insightsRes.ok) throw new Error("insights failed");
      const json = (await insightsRes.json()) as InsightsResponse;
      setData(json);
      if (logsRes.ok) {
        const lj = await logsRes.json();
        setLogs((lj.logs || []) as OptimizationLogEntry[]);
      }
      if (campaignsRes.ok) {
        const cj = await campaignsRes.json();
        const map: Record<string, CampaignSettings> = {};
        for (const c of cj.campaigns || []) {
          map[c.id] = c;
        }
        setSettings(map);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [profile, metaConnected, days]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = async (
    campaignId: string,
    currentStatus: string
  ) => {
    const platformId = settings[campaignId]?.platformCampaignId;
    if (!platformId) {
      toast("error", isKo ? "platform id 없음" : "missing platform id");
      return;
    }
    setTogglingId(campaignId);
    const next = currentStatus === "active" ? "PAUSED" : "ACTIVE";
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/campaigns/meta/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignDocId: campaignId,
          adId: platformId,
          status: next,
        }),
      });
      if (!res.ok) throw new Error("toggle failed");
      toast(
        "success",
        next === "ACTIVE"
          ? isKo
            ? "재개됨"
            : "Resumed"
          : isKo
          ? "일시정지됨"
          : "Paused"
      );
      await load();
    } catch {
      toast("error", isKo ? "변경 실패" : "Update failed");
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Empty / unconnected states ───
  if (!metaConnected) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isKo ? "대시보드" : "Dashboard"}
        </h1>
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="py-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">
                  {isKo ? "메타 광고를 연결하세요" : "Connect Meta Ads"}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {isKo
                    ? "Maktmakr가 광고를 자동으로 운영하려면 메타 광고 계정 연결이 필요합니다."
                    : "Connect your Meta ad account so Maktmakr can run the optimization loop."}
                </p>
                <Link href="/settings">
                  <Button className="mt-4">
                    {isKo ? "메타 연결하기" : "Connect Meta"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const totals = data?.totals;
  const daily = data?.daily ?? [];
  const campaigns = data?.campaigns ?? [];
  const hasData = daily.length > 0;

  const tileSpec = [
    {
      icon: DollarSign,
      label: isKo ? "총 지출" : "Spend",
      value: totals ? fmtMoney(totals.spend) : "—",
      color: "bg-indigo-50 text-indigo-600",
      tip: isKo
        ? "선택한 기간 동안 메타에 실제로 지출된 광고비 합계입니다."
        : "Total ad spend on Meta during the selected period.",
    },
    {
      icon: Eye,
      label: isKo ? "노출" : "Impressions",
      value: totals ? fmtCompact(totals.impressions) : "—",
      color: "bg-blue-50 text-blue-600",
      tip: isKo
        ? "광고가 사용자에게 표시된 횟수입니다. 같은 사람이 두 번 봐도 2회로 카운트됩니다."
        : "Number of times your ads were shown. The same person seeing the ad twice counts as 2.",
    },
    {
      icon: MousePointerClick,
      label: isKo ? "클릭" : "Clicks",
      value: totals ? fmtCompact(totals.clicks) : "—",
      color: "bg-cyan-50 text-cyan-600",
      tip: isKo
        ? "광고를 클릭해서 랜딩페이지로 이동한 횟수입니다."
        : "Number of times someone clicked your ad and landed on your site.",
    },
    {
      icon: Activity,
      label: "CTR",
      value: totals ? `${totals.ctr.toFixed(2)}%` : "—",
      color: "bg-emerald-50 text-emerald-600",
      tip: isKo
        ? "Click-Through Rate = 클릭 ÷ 노출 × 100. 광고가 얼마나 매력적인지 보여주는 핵심 지표입니다. 1% 이상이면 양호합니다."
        : "Click-Through Rate = Clicks ÷ Impressions × 100. How compelling your ad is. Above 1% is healthy.",
    },
    {
      icon: ShoppingCart,
      label: isKo ? "전환" : "Conversions",
      value: totals ? fmtCompact(totals.conversions) : "—",
      color: "bg-amber-50 text-amber-600",
      tip: isKo
        ? "광고를 보고 실제로 구매(또는 가입 등 목표 액션)를 완료한 횟수. 메타 픽셀이 사이트에 설치되어야 측정됩니다."
        : "Number of completed purchases (or signup/etc.) attributed to your ads. Requires Meta Pixel on your site.",
    },
    {
      icon: TrendingUp,
      label: "ROAS",
      value: totals ? `${totals.roas.toFixed(2)}x` : "—",
      color: "bg-violet-50 text-violet-600",
      tip: isKo
        ? "Return on Ad Spend = 매출 ÷ 광고비. 1x = 본전, 4x = $1 써서 $4 매출. 보통 3x 이상을 목표로 합니다."
        : "Return on Ad Spend = Revenue ÷ Spend. 1x means break-even, 4x means $4 revenue per $1 spent. Most aim for 3x+.",
    },
  ];

  // Funnel: max value normalises bar widths
  const funnelMax = Math.max(
    totals?.impressions ?? 0,
    totals?.clicks ?? 0,
    totals?.conversions ?? 0,
    1
  );

  return (
    <div>
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isKo ? "대시보드" : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isKo
              ? `최근 ${days}일 메타 광고 성과 + 자동화 활동`
              : `Last ${days} days of Meta performance + automation activity`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            {[1, 7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  days === d
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {d === 1 ? (isKo ? "오늘" : "Today") : `${d}d`}
              </button>
            ))}
          </div>
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              {isKo ? "새 캠페인" : "New Campaign"}
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-sm text-red-900">
              {isKo ? "지표 조회 실패" : "Failed to load metrics"}
            </p>
            <Button className="mt-2" size="sm" variant="outline" onClick={load}>
              {isKo ? "다시 시도" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Summary tiles ─── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tileSpec.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 py-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[11px] text-gray-500">
                    {s.label}
                    <InfoTooltip text={s.tip} />
                  </p>
                  <p className="truncate text-lg font-bold text-gray-900">
                    {s.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Spend / ROAS chart + Funnel ─── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              {isKo ? "일별 지출 & ROAS" : "Daily Spend & ROAS"}
              <InfoTooltip
                text={
                  isKo
                    ? "일별로 광고비(왼쪽 축, 보라색)와 ROAS(오른쪽 축, 자주색)를 함께 보여줍니다. 광고비가 늘 때 ROAS가 같이 올라가면 잘 굴러가는 것."
                    : "Daily spend (left axis, indigo) and ROAS (right axis, purple) together. If spend goes up and ROAS holds, the loop is healthy."
                }
              />
            </p>
            {hasData ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={daily}
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
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(v: number) => `${v.toFixed(1)}x`}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    name={isKo ? "지출" : "Spend"}
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
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
                {isKo
                  ? "데이터 없음. 캠페인을 발행하면 여기 표시됩니다."
                  : "No data yet. Launch a campaign and metrics will appear here."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion funnel */}
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              {isKo ? "전환 퍼널" : "Conversion Funnel"}
              <InfoTooltip
                text={
                  isKo
                    ? "사용자가 광고를 보고(노출) → 클릭하고 → 전환할 때까지의 깔때기. 단계 사이의 % 변환율이 작으면 그 구간이 병목."
                    : "How users move from seeing your ad (impressions) → clicking → converting. Drops between stages show where you're losing people."
                }
              />
            </p>
            {totals && (
              <div className="space-y-3">
                {[
                  {
                    label: isKo ? "노출" : "Impressions",
                    value: totals.impressions,
                    color: "bg-blue-500",
                  },
                  {
                    label: isKo ? "클릭" : "Clicks",
                    value: totals.clicks,
                    color: "bg-cyan-500",
                  },
                  {
                    label: isKo ? "전환" : "Conversions",
                    value: totals.conversions,
                    color: "bg-emerald-500",
                  },
                ].map((step) => {
                  const pct = (step.value / funnelMax) * 100;
                  return (
                    <div key={step.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-500">{step.label}</span>
                        <span className="font-semibold text-gray-900">
                          {fmtCompact(step.value)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${step.color} transition-all`}
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {isKo ? "노출→클릭" : "Imp→Click"}
                      <InfoTooltip
                        text={
                          isKo
                            ? "광고를 본 사람 중 몇 %가 클릭했나? = CTR"
                            : "What % of viewers clicked? = CTR"
                        }
                      />
                    </span>
                    <span className="font-semibold text-gray-900">
                      {totals.ctr.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {isKo ? "클릭→전환" : "Click→Conv"}
                      <InfoTooltip
                        text={
                          isKo
                            ? "클릭한 사람 중 몇 %가 실제로 구매(또는 가입)했나? 랜딩페이지가 잘 작동하는지 보여주는 지표."
                            : "Of people who clicked, what % actually converted? Tells you whether your landing page works."
                        }
                      />
                    </span>
                    <span className="font-semibold text-gray-900">
                      {totals.clicks > 0
                        ? `${((totals.conversions / totals.clicks) * 100).toFixed(2)}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      CPA
                      <InfoTooltip
                        text={
                          isKo
                            ? "Cost Per Acquisition = 광고비 ÷ 전환 수. 전환 1건당 든 광고비. 낮을수록 좋음."
                            : "Cost Per Acquisition = Spend ÷ Conversions. How much you paid for each conversion. Lower is better."
                        }
                      />
                    </span>
                    <span className="font-semibold text-gray-900">
                      {totals.cpa > 0 ? fmtMoney(totals.cpa) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Per-campaign cards with sparkline + inline action ─── */}
      {campaigns.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            {isKo ? "캠페인별 성과" : "Per-campaign performance"}
            <InfoTooltip
              text={
                isKo
                  ? "각 캠페인의 ROAS 추이(스파크라인). 초록 = 목표 ROAS 달성, 주황 = 미달. 카드 안의 일시정지/재개 버튼으로 바로 컨트롤 가능."
                  : "Per-campaign ROAS trend (sparkline). Green = on target, amber = under. Use the inline pause/resume to control without leaving the dashboard."
              }
            />
          </h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {campaigns.map((c) => {
              const onTarget =
                c.targetRoas == null || c.totals.roas >= c.targetRoas;
              const sparklineData = c.series.length > 0
                ? c.series
                : [{ date: "", roas: 0, spend: 0 } as DailyMetric];
              return (
                <Card key={c.campaignId}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {c.name}
                          </p>
                          <Badge
                            variant={
                              c.status === "active" ? "success" : "warning"
                            }
                          >
                            {c.status}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                          <span>{fmtMoney(c.totals.spend)} spend</span>
                          <span>{c.totals.ctr.toFixed(2)}% CTR</span>
                          <span>{fmtMoney(c.totals.cpa)} CPA</span>
                          <span>{fmtCompact(c.totals.conversions)} conv</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${
                            onTarget ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {c.totals.roas.toFixed(2)}x
                        </p>
                        {c.targetRoas != null && (
                          <p className="flex items-center justify-end gap-0.5 text-[10px] text-gray-400">
                            <Target className="h-2.5 w-2.5" />
                            {c.targetRoas}x
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Sparkline */}
                    <div className="mt-3 h-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={sparklineData}
                          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id={`grad-${c.campaignId}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={onTarget ? "#10b981" : "#f59e0b"}
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="100%"
                                stopColor={onTarget ? "#10b981" : "#f59e0b"}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="roas"
                            stroke={onTarget ? "#10b981" : "#f59e0b"}
                            strokeWidth={1.5}
                            fill={`url(#grad-${c.campaignId})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(
                            expandedId === c.campaignId ? null : c.campaignId
                          )
                        }
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {expandedId === c.campaignId
                          ? isKo
                            ? "▴ 설정 숨기기"
                            : "▴ Hide settings"
                          : isKo
                          ? "▾ 설정 보기"
                          : "▾ Show settings"}
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={togglingId === c.campaignId}
                        onClick={() =>
                          handleToggleStatus(c.campaignId, c.status)
                        }
                      >
                        {c.status === "active" ? (
                          <>
                            <Pause className="mr-1 h-3.5 w-3.5" />
                            {isKo ? "일시정지" : "Pause"}
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-3.5 w-3.5" />
                            {isKo ? "재개" : "Resume"}
                          </>
                        )}
                      </Button>
                    </div>

                    {expandedId === c.campaignId && settings[c.campaignId] && (
                      <div className="mt-3 grid gap-2 rounded-lg bg-gray-50 p-3 text-[11px]">
                        {(() => {
                          const s = settings[c.campaignId];
                          const rows: { label: string; value: string }[] = [
                            {
                              label: isKo ? "목표" : "Objective",
                              value: s.objective,
                            },
                            {
                              label: isKo ? "예산" : "Budget",
                              value: `${fmtMoney(s.budget.amount)}/${
                                s.budget.type === "daily"
                                  ? isKo
                                    ? "일"
                                    : "day"
                                  : isKo
                                  ? "총"
                                  : "lifetime"
                              }`,
                            },
                            {
                              label: isKo ? "연령" : "Age",
                              value: `${s.targeting.ageMin}–${s.targeting.ageMax}`,
                            },
                            {
                              label: isKo ? "성별" : "Gender",
                              value:
                                s.targeting.genders.length === 0 ||
                                s.targeting.genders.includes("all")
                                  ? isKo
                                    ? "전체"
                                    : "All"
                                  : s.targeting.genders.join(", "),
                            },
                            {
                              label: isKo ? "지역" : "Locations",
                              value: s.targeting.locations.join(", ") || "—",
                            },
                            {
                              label: isKo ? "관심사" : "Interests",
                              value:
                                s.targeting.interests.length > 0
                                  ? s.targeting.interests.join(", ")
                                  : isKo
                                  ? "(설정 안 함)"
                                  : "(none)",
                            },
                            {
                              label: isKo ? "게재 위치" : "Placements",
                              value:
                                s.placements.length > 0
                                  ? s.placements
                                      .map((p) =>
                                        p
                                          .replace("instagram_", "IG ")
                                          .replace("facebook_", "FB ")
                                      )
                                      .join(", ")
                                  : isKo
                                  ? "(자동)"
                                  : "(auto)",
                            },
                            {
                              label: isKo ? "입찰" : "Bidding",
                              value:
                                s.bidStrategy
                                  ?.replace("LOWEST_COST_WITHOUT_CAP", isKo ? "최저 비용" : "Lowest cost")
                                  .replace("LOWEST_COST_WITH_BID_CAP", isKo ? "입찰 상한" : "Bid cap")
                                  .replace("COST_CAP", isKo ? "비용 상한" : "Cost cap") ||
                                (isKo ? "최저 비용" : "Lowest cost"),
                            },
                            {
                              label: isKo ? "일정" : "Schedule",
                              value:
                                s.scheduleStart || s.scheduleEnd
                                  ? `${s.scheduleStart?.slice(0, 10) || "—"} → ${s.scheduleEnd?.slice(0, 10) || (isKo ? "계속" : "ongoing")}`
                                  : isKo
                                  ? "계속 운영"
                                  : "Continuous",
                            },
                            {
                              label: isKo ? "목표 ROAS" : "Target ROAS",
                              value:
                                s.targetRoas != null
                                  ? `${s.targetRoas}x ${
                                      s.optimizationEnabled
                                        ? isKo
                                          ? "(자동화 ON)"
                                          : "(autopilot ON)"
                                        : ""
                                    }`
                                  : isKo
                                  ? "(설정 안 함)"
                                  : "(not set)",
                            },
                          ];
                          return rows.map((r) => (
                            <div
                              key={r.label}
                              className="flex justify-between gap-2"
                            >
                              <span className="text-gray-500">{r.label}</span>
                              <span className="text-right font-medium text-gray-900">
                                {r.value}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Optimization activity feed ─── */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            {isKo ? "자동 최적화 활동" : "Auto-optimization activity"}
            <InfoTooltip
              text={
                isKo
                  ? "1시간마다 cron이 모든 캠페인을 검사해서 ROAS가 목표 미달이면 일시정지하거나 예산을 줄이고, 잘 되면 예산을 늘립니다. 여기서 그 이력을 볼 수 있어요."
                  : "Every hour the cron checks every campaign — pausing or shrinking budgets when ROAS is under target, scaling winners up. This is the audit log of those actions."
              }
            />
          </h2>
          <span className="text-xs text-gray-400">
            {isKo ? "1시간마다 실행" : "runs hourly"}
          </span>
        </div>
        <Card className="mt-3">
          <CardContent className="py-2">
            {logs.length === 0 ? (
              <div className="py-8 text-center">
                <Zap className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  {isKo
                    ? "아직 최적화 활동이 없습니다. ROAS Autopilot을 켜고 첫 시간 cron 실행을 기다리세요."
                    : "No optimization activity yet. Enable ROAS Autopilot and wait for the first hourly tick."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const meta = (() => {
                    if (log.kind === "pause")
                      return {
                        icon: "⏸",
                        color: "text-amber-600",
                        label: isKo ? "일시정지" : "Paused",
                      };
                    if (log.kind === "scale_budget")
                      return {
                        icon: "📈",
                        color: "text-emerald-600",
                        label: isKo
                          ? `예산 → $${log.nextDailyBudget}`
                          : `Budget → $${log.nextDailyBudget}`,
                      };
                    if (log.kind === "error")
                      return {
                        icon: "⚠️",
                        color: "text-red-600",
                        label: isKo ? "에러" : "Error",
                      };
                    if (log.kind === "skip")
                      return {
                        icon: "⏭",
                        color: "text-gray-400",
                        label: isKo ? "건너뜀" : "Skipped",
                      };
                    return {
                      icon: "✓",
                      color: "text-gray-400",
                      label: isKo ? "정상" : "Healthy",
                    };
                  })();
                  return (
                    <li
                      key={log.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-base">{meta.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-gray-900">
                            <span className={`font-medium ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span className="text-gray-600">
                              {log.campaignName}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {log.recentRoas != null && (
                              <>
                                ROAS {log.recentRoas.toFixed(2)}x
                                {log.targetRoas != null && (
                                  <> (target {log.targetRoas}x)</>
                                )}
                                <span className="mx-1">·</span>
                              </>
                            )}
                            {log.reason}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {relativeTime(log.createdAt, isKo)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
