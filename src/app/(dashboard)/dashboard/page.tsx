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
  const { profile, activeRole } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();
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
    { day: "월", earnings: 12.5, clicks: 45 },
    { day: "화", earnings: 8.0, clicks: 32 },
    { day: "수", earnings: 23.5, clicks: 78 },
    { day: "목", earnings: 15.0, clicks: 51 },
    { day: "금", earnings: 31.0, clicks: 95 },
    { day: "토", earnings: 18.5, clicks: 62 },
    { day: "일", earnings: 22.0, clicks: 71 },
  ];
  const maxEarning = Math.max(...demoChart.map((d) => d.earnings));
  const totalDemo = demoChart.reduce((s, d) => s + d.earnings, 0);
  const totalClicks = demoChart.reduce((s, d) => s + d.clicks, 0);
  const totalWithdrawn = 45.0; // demo withdrawn amount

  // Seed demo affiliate programs for influencer role
  useEffect(() => {
    if (activeRole !== "influencer") return;
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
  }, [activeRole]);

  if (activeRole === "influencer") {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900">
          {t.dashboard.welcomeInfluencer}, {profile?.displayName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t.dashboard.influencerDesc}</p>

        {/* Stats cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "총 수익", value: `$${totalDemo.toFixed(2)}`, color: "bg-green-50 text-green-600", icon: TrendingUp },
            { label: "출금 완료", value: `$${totalWithdrawn.toFixed(2)}`, color: "bg-indigo-50 text-indigo-600", icon: FolderKanban },
            { label: "출금 가능", value: `$${(totalDemo - totalWithdrawn).toFixed(2)}`, color: "bg-orange-50 text-orange-600", icon: Users },
            { label: "이번 주 클릭", value: totalClicks.toString(), color: "bg-blue-50 text-blue-600", icon: Megaphone },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Earnings chart */}
        <Card className="mt-6">
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold text-gray-700">주간 수익</h2>
            <div className="mt-4 flex items-end gap-2" style={{ height: 160 }}>
              {demoChart.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-green-600">${d.earnings.toFixed(0)}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all"
                    style={{ height: `${(d.earnings / maxEarning) * 120}px`, minHeight: 8 }}
                  />
                  <span className="text-[10px] text-gray-400">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href="/affiliates">
            <Card className="p-5 hover:shadow-md transition-shadow hover:border-indigo-200">
              <FolderKanban className="h-6 w-6 text-indigo-600" />
              <p className="mt-2 font-semibold text-gray-900">{t.dashboard.browsePrograms}</p>
              <p className="text-xs text-gray-500">{t.dashboard.findProducts}</p>
            </Card>
          </Link>
          <Link href="/affiliates/my-programs">
            <Card className="p-5 hover:shadow-md transition-shadow hover:border-green-200">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <p className="mt-2 font-semibold text-gray-900">내 프로그램</p>
              <p className="text-xs text-gray-500">레퍼럴 링크 & 테스트 전환</p>
            </Card>
          </Link>
          <Link href="/affiliates/earnings">
            <Card className="p-5 hover:shadow-md transition-shadow hover:border-orange-200">
              <Users className="h-6 w-6 text-orange-600" />
              <p className="mt-2 font-semibold text-gray-900">{t.dashboard.myEarnings}</p>
              <p className="text-xs text-gray-500">정산 요청 & 출금</p>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
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
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: t.dashboard.projectCount, value: stats.projects, icon: FolderKanban, color: "bg-indigo-100 text-indigo-600" },
          { label: t.dashboard.campaignCount, value: stats.campaigns, icon: Megaphone, color: "bg-blue-100 text-blue-600" },
          { label: t.dashboard.affiliateCount, value: stats.affiliates, icon: Users, color: "bg-green-100 text-green-600" },
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
