"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Users, Zap } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { createUserProfile } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/context/locale-context";
import type { UserRole } from "@/types/user";

export default function OnboardingPage() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();

  const handleContinue = async () => {
    if (!user || !selected) return;
    setLoading(true);
    try {
      await createUserProfile(user, selected);
      await refreshProfile();

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

      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      toast("error", err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: "owner" as UserRole,
      icon: FolderKanban,
      title: t.onboarding.owner,
      desc: t.onboarding.ownerDesc,
    },
    {
      id: "influencer" as UserRole,
      icon: Users,
      title: t.onboarding.influencer,
      desc: t.onboarding.influencerDesc,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-5 w-5 text-indigo-600" />
        <span className="text-sm font-medium text-indigo-600">Piped</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{t.onboarding.title}</h1>
      <p className="mt-2 text-sm text-gray-600">{t.onboarding.subtitle}</p>

      <div className="mt-6 space-y-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selected === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isSelected ? "bg-indigo-600" : "bg-gray-100"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-gray-600"}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{role.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{role.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleContinue}
        loading={loading}
        disabled={!selected}
        className="mt-6 w-full"
      >
        {t.onboarding.continue}
      </Button>
    </div>
  );
}
