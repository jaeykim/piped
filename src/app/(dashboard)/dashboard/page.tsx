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
} from "recharts";
import { getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

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
  totals: Totals;
}

interface InsightsResponse {
  connected: boolean;
  days: number;
  totals: Totals;
  daily: DailyMetric[];
  campaigns: CampaignSummary[];
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { locale } = useLocale();
  const isKo = locale.startsWith("ko");
  const metaConnected = !!profile?.integrations?.meta?.accessToken;

  const [days, setDays] = useState(14);
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!profile || !metaConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(`/api/campaigns/meta/insights?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as InsightsResponse;
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [profile, metaConnected, days]);

  useEffect(() => {
    load();
  }, [load]);

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

  const fmtMoney = (n: number) =>
    `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const fmtCompact = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isKo ? "대시보드" : "Dashboard"}
          </h1>
          <p className="mt-1 text-gray-600">
            {isKo
              ? `최근 ${days}일 메타 광고 지표`
              : `Last ${days} days of Meta ad performance`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  days === d
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {d}d
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

      {/* Summary tiles */}
      {totals && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: DollarSign,
              label: isKo ? "총 지출" : "Spend",
              value: fmtMoney(totals.spend),
              color: "bg-indigo-50 text-indigo-600",
            },
            {
              icon: Eye,
              label: isKo ? "노출" : "Impressions",
              value: fmtCompact(totals.impressions),
              color: "bg-blue-50 text-blue-600",
            },
            {
              icon: MousePointerClick,
              label: isKo ? "CTR" : "CTR",
              value: `${totals.ctr.toFixed(2)}%`,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              icon: TrendingUp,
              label: "ROAS",
              value: `${totals.roas.toFixed(2)}x`,
              color: "bg-violet-50 text-violet-600",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-semibold text-gray-700">
            {isKo ? "일별 지출 & ROAS" : "Daily Spend & ROAS"}
          </p>
          {hasData ? (
            <ResponsiveContainer width="100%" height={280}>
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
                ? "표시할 데이터가 없습니다. 캠페인을 발행하면 지표가 여기 나타납니다."
                : "No data yet. Launch a campaign and metrics will appear here."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-campaign list */}
      {campaigns.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700">
            {isKo ? "캠페인별 성과" : "Per-campaign performance"}
          </h2>
          <div className="mt-3 space-y-2">
            {campaigns.map((c) => {
              const onTarget =
                c.targetRoas == null || c.totals.roas >= c.targetRoas;
              return (
                <Card key={c.campaignId}>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {c.name}
                        </p>
                        <Badge
                          variant={c.status === "active" ? "success" : "warning"}
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                        <span>{fmtMoney(c.totals.spend)} spend</span>
                        <span>{c.totals.ctr.toFixed(2)}% CTR</span>
                        <span>{fmtMoney(c.totals.cpa)} CPA</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
