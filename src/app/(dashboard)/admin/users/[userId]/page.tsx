"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getAuth_ } from "@/lib/firebase/client";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    role: string;
    isAdmin: boolean;
    credits: number;
    onboardingComplete: boolean;
    createdAt: string;
    updatedAt: string;
    metaConnected: boolean;
    metaAdAccountId: string | null;
    metaConnectedAt: string | null;
    metaExpiresAt: string | null;
    googleConnected: boolean;
    googleCustomerId: string | null;
  };
  projects: Array<{
    id: string;
    name: string;
    url: string;
    status: string;
    pipelineStage: string;
    createdAt: string;
    _count: { creatives: number; copyVariants: number; campaigns: number };
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    platform: string;
    status: string;
    objective: string;
    budgetAmount: number;
    targetRoas: number | null;
    optimizationEnabled: boolean;
    createdAt: string;
  }>;
  optimizationLogs: Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    kind: string;
    reason: string;
    recentRoas: number | null;
    recentSpend: number | null;
    targetRoas: number | null;
    nextDailyBudget: number | null;
    createdAt: string;
  }>;
  creditHistory: Array<{
    id: string;
    amount: number;
    balance: number;
    action: string;
    description: string;
    createdAt: string;
  }>;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { locale } = useLocale();
  const { toast } = useToast();
  const isKo = locale.startsWith("ko");

  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingCredits, setSavingCredits] = useState(false);
  const [creditDelta, setCreditDelta] = useState<number>(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setData(json as AdminUserDetail);
    } catch {
      toast("error", isKo ? "조회 실패" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [userId, toast, isKo]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdjustCredits = async () => {
    if (!data) return;
    setSavingCredits(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const next = Math.max(0, data.user.credits + creditDelta);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credits: next }),
      });
      if (!res.ok) throw new Error("update failed");
      toast(
        "success",
        isKo
          ? `${creditDelta > 0 ? "+" : ""}${creditDelta} 크레딧 적용됨`
          : `${creditDelta > 0 ? "+" : ""}${creditDelta} credits applied`
      );
      setCreditDelta(0);
      load();
    } catch {
      toast("error", isKo ? "적용 실패" : "Update failed");
    } finally {
      setSavingCredits(false);
    }
  };

  const handleToggleAdmin = async () => {
    if (!data) return;
    const next = !data.user.isAdmin;
    if (
      !confirm(
        isKo
          ? `${next ? "관리자로 지정" : "관리자 권한 해제"}하시겠습니까?`
          : `${next ? "Grant" : "Revoke"} admin access?`
      )
    )
      return;
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAdmin: next }),
      });
      toast("success", isKo ? "변경됨" : "Updated");
      load();
    } catch {
      toast("error", isKo ? "변경 실패" : "Update failed");
    }
  };

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

  const u = data.user;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {isKo ? "어드민으로" : "Back to admin"}
      </Link>

      {/* Header */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            {u.displayName || u.email}
            {u.isAdmin && <Badge variant="info">admin</Badge>}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{u.email}</p>
          <p className="text-[11px] text-gray-400">{u.id}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-gray-500">
          <span>
            {isKo ? "가입" : "Joined"}{" "}
            {new Date(u.createdAt).toLocaleDateString()}
          </span>
          <span>
            {isKo ? "최근 활동" : "Last active"}{" "}
            {new Date(u.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Account info card */}
      <Card className="mt-6">
        <CardContent className="grid gap-3 py-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              {isKo ? "역할" : "Role"}
            </p>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {u.role}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              {isKo ? "크레딧" : "Credits"}
            </p>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {u.credits}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              Meta Ads
            </p>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {u.metaConnected ? (
                <>
                  {isKo ? "연결됨" : "Connected"}
                  {u.metaAdAccountId && (
                    <span className="ml-1 text-[11px] text-gray-400">
                      · act_{u.metaAdAccountId}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              Google Ads
            </p>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {u.googleConnected ? (
                <>
                  {isKo ? "연결됨" : "Connected"}
                  {u.googleCustomerId && (
                    <span className="ml-1 text-[11px] text-gray-400">
                      · {u.googleCustomerId}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin actions */}
      <Card className="mt-4 border-amber-200 bg-amber-50/40">
        <CardContent className="space-y-3 py-4">
          <p className="text-xs font-semibold text-amber-900">
            {isKo ? "관리자 액션" : "Admin actions"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              value={creditDelta}
              onChange={(e) => setCreditDelta(parseInt(e.target.value || "0"))}
              placeholder="±credits"
              className="w-28 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <Button
              size="sm"
              variant="outline"
              loading={savingCredits}
              disabled={creditDelta === 0}
              onClick={handleAdjustCredits}
            >
              {isKo ? "크레딧 조정" : "Adjust credits"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleToggleAdmin}>
              {u.isAdmin
                ? isKo
                  ? "관리자 해제"
                  : "Revoke admin"
                : isKo
                ? "관리자 지정"
                : "Make admin"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <h2 className="mt-8 text-sm font-semibold text-gray-700">
        {isKo ? "프로젝트" : "Projects"}{" "}
        <span className="ml-1 text-gray-400">({data.projects.length})</span>
      </h2>
      <Card className="mt-2">
        <CardContent className="py-2">
          {data.projects.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              {isKo ? "프로젝트 없음" : "No projects"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {data.projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{p.name}</p>
                    <p className="truncate text-[11px] text-gray-400">
                      {p.url}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-[11px] text-gray-500">
                    <span>{p._count.creatives} 🎨</span>
                    <span>{p._count.copyVariants} ✍️</span>
                    <span>{p._count.campaigns} 📣</span>
                    <Badge variant="default">{p.pipelineStage}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Campaigns */}
      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        {isKo ? "캠페인" : "Campaigns"}{" "}
        <span className="ml-1 text-gray-400">({data.campaigns.length})</span>
      </h2>
      <Card className="mt-2">
        <CardContent className="py-2">
          {data.campaigns.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              {isKo ? "캠페인 없음" : "No campaigns"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {data.campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {c.platform} · {c.objective} · ${c.budgetAmount}/
                      {isKo ? "일" : "day"}
                      {c.targetRoas != null && c.optimizationEnabled && (
                        <> · 🎯 {c.targetRoas}x ROAS</>
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={c.status === "active" ? "success" : "warning"}
                  >
                    {c.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
              {isKo ? "활동 없음" : "No activity"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 text-xs">
              {data.optimizationLogs.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-gray-900">
                      <span className="font-semibold">{l.kind}</span>{" "}
                      <span className="mx-1 text-gray-300">·</span>{" "}
                      {l.campaignName}
                    </p>
                    <p className="truncate text-[10px] text-gray-400">
                      {l.recentRoas != null && (
                        <>ROAS {l.recentRoas.toFixed(2)}x · </>
                      )}
                      {l.reason}
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

      {/* Credit history */}
      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        {isKo ? "크레딧 이력" : "Credit history"}{" "}
        <span className="ml-1 text-gray-400">
          ({data.creditHistory.length})
        </span>
      </h2>
      <Card className="mt-2">
        <CardContent className="py-2">
          {data.creditHistory.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              {isKo ? "이력 없음" : "No history"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 text-xs">
              {data.creditHistory.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-gray-900">{h.description}</p>
                    <p className="text-[10px] text-gray-400">{h.action}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        h.amount >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {h.amount >= 0 ? "+" : ""}
                      {h.amount}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {isKo ? "잔액" : "balance"} {h.balance}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
