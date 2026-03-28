"use client";

import { Menu } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
    </header>
  );
}
