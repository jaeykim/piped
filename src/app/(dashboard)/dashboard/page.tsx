"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Megaphone, Users, TrendingUp, Trash2 } from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/context/locale-context";
import type { Project } from "@/types/project";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLocale();
  const isKo = locale.startsWith("ko");
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ projects: 0, campaigns: 0, affiliates: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!profile) return;
    const projQ = query(
      collection(getDb(), "projects"),
      where("ownerId", "==", profile.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const projSnap = await getDocs(projQ);
    setProjects(
      projSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project)
    );

    const allProj = await getDocs(
      query(collection(getDb(), "projects"), where("ownerId", "==", profile.uid))
    );
    const allCamp = await getDocs(
      query(collection(getDb(), "campaigns"), where("ownerId", "==", profile.uid))
    );
    setStats({
      projects: allProj.size,
      campaigns: allCamp.size,
      affiliates: 0,
    });
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t.dashboard.deleteConfirm.replace("{name}", projectName))) return;

    setDeletingId(projectId);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setStats((prev) => ({ ...prev, projects: Math.max(0, prev.projects - 1) }));
      toast("success", t.dashboard.deleted);
    } catch {
      toast("error", t.dashboard.deleteFailed);
    } finally {
      setDeletingId(null);
    }
  };

  const stageColors: Record<string, "default" | "info" | "success" | "warning"> = {
    analysis: "info",
    copy: "info",
    creatives: "warning",
    campaigns: "success",
    affiliates: "success",
  };

  // Demo earnings data for chart (last 7 days)
  const demoChart = [
    { day: isKo ? "월" : "Mon", earnings: 12.5, clicks: 45 },
    { day: isKo ? "화" : "Tue", earnings: 8.0, clicks: 32 },
    { day: isKo ? "수" : "Wed", earnings: 23.5, clicks: 78 },
    { day: isKo ? "목" : "Thu", earnings: 15.0, clicks: 51 },
    { day: isKo ? "금" : "Fri", earnings: 31.0, clicks: 95 },
    { day: isKo ? "토" : "Sat", earnings: 18.5, clicks: 62 },
    { day: isKo ? "일" : "Sun", earnings: 22.0, clicks: 71 },
  ];
  const maxEarning = Math.max(...demoChart.map((d) => d.earnings));
  const totalDemo = demoChart.reduce((s, d) => s + d.earnings, 0);

  // Demo campaign performance data for maker dashboard (last 7 days)
  const demoPerformance = [
    { day: isKo ? "월" : "Mon", impressions: 2400, clicks: 120, spend: 15 },
    { day: isKo ? "화" : "Tue", impressions: 1800, clicks: 95, spend: 12 },
    { day: isKo ? "수" : "Wed", impressions: 3200, clicks: 180, spend: 22 },
    { day: isKo ? "목" : "Thu", impressions: 2100, clicks: 110, spend: 14 },
    { day: isKo ? "금" : "Fri", impressions: 4100, clicks: 230, spend: 28 },
    { day: isKo ? "토" : "Sat", impressions: 2800, clicks: 150, spend: 19 },
    { day: isKo ? "일" : "Sun", impressions: 3500, clicks: 195, spend: 24 },
  ];
  const maxImpressions = Math.max(...demoPerformance.map((d) => d.impressions));
  const totalImpressions = demoPerformance.reduce((s, d) => s + d.impressions, 0);
  const totalPerfClicks = demoPerformance.reduce((s, d) => s + d.clicks, 0);
  const totalSpend = demoPerformance.reduce((s, d) => s + d.spend, 0);
  const avgCTR = ((totalPerfClicks / totalImpressions) * 100).toFixed(2);

  // Seed demo affiliate programs
  useEffect(() => {
    async function seedIfEmpty() {
      try {
        const { collection: col, getDocs: gd, query: q, where: w } = await import("firebase/firestore");
        const snap = await gd(q(col(getDb(), "affiliatePrograms"), w("status", "==", "active")));
        if (snap.empty) {
          const token = await getAuth_().currentUser?.getIdToken();
          if (token) await fetch("/api/affiliates/seed", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        }
      } catch { /* silent */ }
    }
    seedIfEmpty();
  }, []);

  return (
    <div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-xs text-amber-700">
          {isKo
            ? "💡 아래 수익 및 지출 데이터는 예시입니다. 캠페인을 런칭하면 실제 성과로 대체됩니다."
            : "💡 The earnings and spend data below is for demonstration. It will be replaced with real metrics once you launch a campaign."}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
          <p className="mt-1 text-gray-600">
            {t.dashboard.welcomeBack}, {profile?.displayName}
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t.dashboard.newProject}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t.dashboard.projectCount, value: stats.projects, icon: FolderKanban, color: "bg-indigo-100 text-indigo-600" },
          { label: t.dashboard.campaignCount, value: stats.campaigns, icon: Megaphone, color: "bg-blue-100 text-blue-600" },
          { label: t.dashboard.affiliateCount, value: stats.affiliates, icon: Users, color: "bg-green-100 text-green-600" },
          { label: isKo ? "총 수익" : "Total Earnings", value: `$${totalDemo.toFixed(2)}`, icon: TrendingUp, color: "bg-green-50 text-green-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Affiliate Earnings — show first, only if earnings exist */}
      {totalDemo > 0 && (
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          {isKo ? "제휴 수익" : "Affiliate Earnings"}
        </h2>
        <Card className="mt-4">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{isKo ? "주간 수익" : "Weekly Earnings"}</h3>
              <Link href="/affiliates/earnings" className="text-xs text-indigo-600 hover:text-indigo-800">
                {isKo ? "상세보기 →" : "Details →"}
              </Link>
            </div>
            <div className="mt-4 flex items-end gap-2" style={{ height: 140 }}>
              {demoChart.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-green-600">${d.earnings.toFixed(0)}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-green-500 to-green-400 transition-all"
                    style={{ height: `${(d.earnings / maxEarning) * 110}px`, minHeight: 6 }}
                  />
                  <span className="text-[10px] text-gray-400">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Campaign Spend — only if spend exists */}
      {totalSpend > 0 && (
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          {isKo ? "캠페인 지출" : "Campaign Spend"}
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            { label: isKo ? "총 노출" : "Impressions", value: totalImpressions.toLocaleString() },
            { label: isKo ? "총 클릭" : "Clicks", value: totalPerfClicks.toLocaleString() },
            { label: isKo ? "총 지출" : "Spend", value: `$${totalSpend}` },
            { label: isKo ? "평균 CTR" : "Avg CTR", value: `${avgCTR}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <Card className="mt-4">
          <CardContent className="py-5">
            <h3 className="text-sm font-semibold text-gray-700">
              {isKo ? "주간 지출" : "Weekly Spend"}
            </h3>
            <div className="mt-4 flex items-end gap-2" style={{ height: 140 }}>
              {demoPerformance.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-indigo-600">${d.spend}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                    style={{ height: `${(d.impressions / maxImpressions) * 110}px`, minHeight: 6 }}
                  />
                  <span className="text-[10px] text-gray-400">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Recent Projects */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.recentProjects}</h2>
        {projects.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-12 text-center">
              <FolderKanban className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-600">{t.dashboard.noProjects}</p>
              <p className="text-sm text-gray-500">{t.dashboard.noProjectsDesc}</p>
              <Link href="/projects/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.dashboard.createProject}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">
                        {project.name}
                      </p>
                      <p className="truncate text-sm text-gray-500">{project.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={stageColors[project.pipelineStage] || "default"}>
                        {project.pipelineStage}
                      </Badge>
                      <button
                        onClick={(e) => handleDelete(e, project.id, project.name)}
                        disabled={deletingId === project.id}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
