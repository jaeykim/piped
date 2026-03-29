"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { signOut } from "@/lib/firebase/auth";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { t } = useLocale();

  const nav = [
    { label: t.sidebar.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.sidebar.projects, href: "/projects", icon: FolderKanban },
    { label: t.sidebar.partnerHub, href: "/affiliates", icon: Users },
    { label: t.sidebar.myPrograms, href: "/affiliates/my-programs", icon: FolderKanban },
    { label: t.sidebar.earnings, href: "/affiliates/earnings", icon: Zap },
    { label: t.sidebar.settings, href: "/settings", icon: Settings },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Zap className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">Piped</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Credits */}
      <div className="border-t border-gray-100 p-3">
        <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">크레딧 잔액</span>
            <span className="text-lg font-bold text-indigo-600">{(profile?.credits ?? 0).toLocaleString()}</span>
          </div>
          <Link
            href="/settings"
            onClick={onNavigate}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            충전하기
          </Link>
        </div>
      </div>

      {/* User Section */}
      <div className="border-t border-gray-100 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-3 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {profile?.displayName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {profile?.displayName || "User"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {t.sidebar.signOut}
        </button>
      </div>
    </aside>
  );
}
