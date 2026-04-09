"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Search,
  ShieldCheck,
  ImageIcon,
} from "lucide-react";
import { getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

interface AdminStats {
  users: {
    total: number;
    signupsToday: number;
    signups7d: number;
    signups30d: number;
    metaConnected: number;
    googleConnected: number;
  };
  projects: { total: number };
  campaigns: { total: number; active: number };
  optimizer: { actions7d: number };
  creatives: { total: number };
}

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isAdmin: boolean;
  credits: number;
  createdAt: string;
  metaConnected: boolean;
  metaAdAccountId: string | null;
  googleConnected: boolean;
  counts: { projects: number; campaigns: number; optimizationLogs: number };
}

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const { locale } = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const isKo = locale.startsWith("ko");

  const [forbidden, setForbidden] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch(
          `/api/admin/users?limit=100${query ? `&q=${encodeURIComponent(query)}` : ""}`,
          { headers }
        ),
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      if (!statsRes.ok || !usersRes.ok) throw new Error("fetch failed");
      setStats(await statsRes.json());
      const uj = await usersRes.json();
      setUsers(uj.users || []);
    } catch {
      toast("error", isKo ? "어드민 데이터 조회 실패" : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [profile, query, toast, isKo]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  if (forbidden) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          {isKo ? "접근 권한이 없습니다" : "Forbidden"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {isKo
            ? "이 페이지는 관리자 권한이 필요해요."
            : "This page requires admin access."}
        </p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const tiles = stats
    ? [
        {
          icon: Users,
          label: isKo ? "총 사용자" : "Users",
          value: stats.users.total.toLocaleString(),
          sub: isKo
            ? `+${stats.users.signups7d} (7일)`
            : `+${stats.users.signups7d} (7d)`,
          color: "bg-indigo-50 text-indigo-600",
        },
        {
          icon: Activity,
          label: isKo ? "오늘 가입" : "New today",
          value: stats.users.signupsToday.toLocaleString(),
          sub: isKo
            ? `30일 +${stats.users.signups30d}`
            : `30d +${stats.users.signups30d}`,
          color: "bg-emerald-50 text-emerald-600",
        },
        {
          icon: DollarSign,
          label: isKo ? "메타 연결" : "Meta linked",
          value: stats.users.metaConnected.toLocaleString(),
          sub: `${
            stats.users.total > 0
              ? Math.round((stats.users.metaConnected / stats.users.total) * 100)
              : 0
          }%`,
          color: "bg-blue-50 text-blue-600",
        },
        {
          icon: TrendingUp,
          label: isKo ? "활성 캠페인" : "Active campaigns",
          value: stats.campaigns.active.toLocaleString(),
          sub: isKo
            ? `총 ${stats.campaigns.total}`
            : `of ${stats.campaigns.total}`,
          color: "bg-violet-50 text-violet-600",
        },
        {
          icon: Activity,
          label: isKo ? "최적화 액션" : "Auto actions",
          value: stats.optimizer.actions7d.toLocaleString(),
          sub: isKo ? "7일" : "7d",
          color: "bg-amber-50 text-amber-600",
        },
        {
          icon: TrendingUp,
          label: isKo ? "광고 소재" : "Creatives",
          value: stats.creatives.total.toLocaleString(),
          sub: isKo
            ? `프로젝트 ${stats.projects.total}`
            : `${stats.projects.total} projects`,
          color: "bg-cyan-50 text-cyan-600",
        },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {isKo ? "어드민" : "Admin"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {isKo
              ? "사용자 관리 및 플랫폼 활동 추적"
              : "Manage users and track platform activity"}
          </p>
        </div>
        <Link
          href="/admin/creatives"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
        >
          <ImageIcon className="h-4 w-4" />
          {isKo ? "광고 소재 갤러리" : "Creatives gallery"}
        </Link>
      </div>

      {/* Stats tiles */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((s) => {
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
                  <p className="text-[11px] text-gray-500">{s.label}</p>
                  <p className="truncate text-lg font-bold text-gray-900">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-gray-400">{s.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users list */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {isKo ? "사용자" : "Users"}
          </h2>
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder={isKo ? "이메일 / 이름 검색" : "Search email / name"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <Card className="mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">
                    {isKo ? "사용자" : "User"}
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium">
                    {isKo ? "연동" : "Connected"}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {isKo ? "프로젝트" : "Projects"}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {isKo ? "캠페인" : "Campaigns"}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {isKo ? "크레딧" : "Credits"}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {isKo ? "가입일" : "Joined"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                    className="cursor-pointer hover:bg-indigo-50/40"
                  >
                    <td className="px-4 py-2.5">
                      <div className="block min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-medium text-gray-900">
                          {u.displayName || u.email}
                          {u.isAdmin && (
                            <Badge variant="info">admin</Badge>
                          )}
                        </p>
                        <p className="truncate text-[11px] text-gray-400">
                          {u.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {u.metaConnected && (
                          <Badge variant="success">📘</Badge>
                        )}
                        {u.googleConnected && (
                          <Badge variant="info">🔍</Badge>
                        )}
                        {!u.metaConnected && !u.googleConnected && (
                          <span className="text-[11px] text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {u.counts.projects}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {u.counts.campaigns}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {u.credits}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11px] text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-gray-400"
                    >
                      {isKo ? "사용자가 없습니다" : "No users"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
