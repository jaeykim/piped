"use client";

import Link from "next/link";
import { Menu, Zap } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { profile, activeRole } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
      </div>

      {activeRole === "owner" && (
        <Link
          href="/settings"
          className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <Zap className="h-3.5 w-3.5" />
          {profile?.credits ?? 0}
        </Link>
      )}
    </header>
  );
}
