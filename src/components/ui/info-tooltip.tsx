"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

// Lightweight (i) icon that shows a hover tooltip on desktop and a tap-to-
// toggle popover on mobile. No external dep — pure Tailwind + state.
//
// Usage:
//   <InfoTooltip text="ROAS = revenue ÷ ad spend." />
export function InfoTooltip({
  text,
  className = "",
  size = "sm",
}: {
  text: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center text-gray-300 hover:text-gray-500"
        aria-label="Help"
      >
        <HelpCircle className={iconSize} />
      </button>
      {open && (
        <span
          className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg"
          role="tooltip"
        >
          {text}
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900" />
        </span>
      )}
    </span>
  );
}
