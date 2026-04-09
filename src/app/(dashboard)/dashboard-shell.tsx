"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && !profile?.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [loading, user, profile, router]);

  if (loading) return <FullPageSpinner />;
  if (!user || !profile) return null;

  // Note: we deliberately avoid `h-screen overflow-hidden` here. On mobile
  // (esp. iOS Safari) the URL bar dynamically shrinks the visible viewport,
  // and a fixed-height inner-scrolling layout chops off the bottom of the
  // content. Letting the body scroll naturally fixes that.
  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — sticky on desktop, slide-in on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content — scrolls with the page */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 bg-gray-50 p-4 pb-24 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
