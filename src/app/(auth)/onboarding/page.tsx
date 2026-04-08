"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { createUserProfile } from "@/lib/firebase/auth";

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If already onboarded, redirect immediately
    if (profile) {
      router.push("/dashboard");
      return;
    }

    if (!user) return;

    let cancelled = false;

    async function autoOnboard() {
      try {
        await createUserProfile(user!, "owner");
        await refreshProfile();

        // Google Ads conversion tracking
        try {
          if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
            (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "conversion", {
              send_to: "AW-18048528369/xGMxCJ61zJEcEPHfmp5D",
              value: 1.0,
              currency: "KRW",
            });
          }
        } catch { /* silent */ }

        // Trigger affiliate conversion if referred
        try {
          const refCookie = document.cookie.split("; ").find((c) => c.startsWith("piped_ref="));
          if (refCookie) {
            const refCode = refCookie.split("=")[1];
            await fetch("/api/affiliates/convert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refCode, conversionValue: 0, eventType: "signup" }),
            });
          }
        } catch { /* silent — don't block onboarding */ }

        if (!cancelled) {
          router.push("/dashboard");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Onboarding error:", err);
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      }
    }

    autoOnboard();
    return () => { cancelled = true; };
  }, [user, profile, refreshProfile, router]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-indigo-600" />
        <span className="text-sm font-medium text-indigo-600">Maktmakr</span>
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-4 text-sm text-gray-600">Setting up your account...</p>
        </>
      )}
    </div>
  );
}
