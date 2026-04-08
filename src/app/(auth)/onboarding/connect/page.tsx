"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getAuth_ } from "@/lib/firebase/client";
import { useLocale } from "@/context/locale-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

// Connect-ad-account step that runs once after signup. The user can wire
// up Meta, Google Ads, both, or skip and do it later from /settings.

export default function OnboardingConnectPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const { locale } = useLocale();
  const { toast } = useToast();
  const isKo = locale.startsWith("ko");

  const [connectingMeta, setConnectingMeta] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Refresh profile on mount in case the user returned from an OAuth
  // callback (Meta or Google) — both write to the User row.
  useEffect(() => {
    if (user) refreshProfile();
  }, [user, refreshProfile]);

  // Don't bounce signed-out users — let them see the auth page
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const metaConnected = !!profile?.integrations?.meta?.accessToken;
  const googleConnected = !!profile?.integrations?.google?.refreshToken;

  async function startMeta() {
    setConnectingMeta(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      if (!token) throw new Error("not signed in");
      const res = await fetch("/api/auth/meta-ads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || "failed");
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (e) {
      toast(
        "error",
        e instanceof Error ? e.message : isKo ? "메타 연결 실패" : "Meta connect failed"
      );
      setConnectingMeta(false);
    }
  }

  async function startGoogle() {
    setConnectingGoogle(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      if (!token) throw new Error("not signed in");
      const res = await fetch("/api/auth/google-ads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || "failed");
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (e) {
      toast(
        "error",
        e instanceof Error ? e.message : isKo ? "구글 연결 실패" : "Google connect failed"
      );
      setConnectingGoogle(false);
    }
  }

  if (loading || !user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {isKo ? "광고 계정 연결하기" : "Connect your ad accounts"}
        </h1>
        <p className="mt-2 text-gray-500">
          {isKo
            ? "MaktMakr가 광고를 실제로 게재하려면 광고 계정 연결이 필요해요. 둘 다 안 해도 되고, 하나만 해도 되고, 나중에 설정에서 해도 돼요."
            : "MaktMakr needs an ad account to actually run your ads. Connect Meta, Google, both, or do it later from Settings."}
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {/* Meta */}
        <div
          className={`rounded-2xl border-2 p-6 transition-colors ${
            metaConnected
              ? "border-emerald-300 bg-emerald-50/40"
              : "border-gray-200 bg-white hover:border-indigo-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📘</span>
                <h2 className="text-lg font-semibold text-gray-900">
                  Meta Ads (Facebook + Instagram)
                </h2>
                {metaConnected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <Check className="h-3 w-3" />
                    {isKo ? "연결됨" : "Connected"}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-gray-500">
                {isKo
                  ? "Instagram Feed/Stories/Reels와 Facebook Feed에 광고를 게재합니다. 가장 흔한 선택."
                  : "Run ads on Instagram Feed/Stories/Reels and Facebook Feed. The default choice for most."}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {isKo
                  ? "💡 광고 계정이 없으면 먼저 "
                  : "💡 If you don't have an ad account yet, "}
                <a
                  href="https://business.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline"
                >
                  Meta Business Suite
                  <ExternalLink className="h-3 w-3" />
                </a>
                {isKo
                  ? "에서 무료로 만드세요."
                  : " — create one for free."}
              </p>
            </div>
            <Button
              onClick={startMeta}
              loading={connectingMeta}
              disabled={metaConnected}
              variant={metaConnected ? "outline" : "primary"}
            >
              {metaConnected
                ? isKo
                  ? "연결됨"
                  : "Connected"
                : isKo
                ? "연결하기"
                : "Connect"}
            </Button>
          </div>
        </div>

        {/* Google */}
        <div
          className={`rounded-2xl border-2 p-6 transition-colors ${
            googleConnected
              ? "border-emerald-300 bg-emerald-50/40"
              : "border-gray-200 bg-white hover:border-indigo-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                <h2 className="text-lg font-semibold text-gray-900">
                  Google Ads
                </h2>
                {googleConnected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <Check className="h-3 w-3" />
                    {isKo ? "연결됨" : "Connected"}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-gray-500">
                {isKo
                  ? "Google 검색 결과와 디스플레이 네트워크에 광고를 게재합니다."
                  : "Run ads on Google Search results and the Display Network."}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {isKo
                  ? "💡 광고 계정이 없으면 먼저 "
                  : "💡 No Google Ads account yet? "}
                <a
                  href="https://ads.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline"
                >
                  Google Ads
                  <ExternalLink className="h-3 w-3" />
                </a>
                {isKo
                  ? "에서 만드세요."
                  : " — create one first."}
              </p>
            </div>
            <Button
              onClick={startGoogle}
              loading={connectingGoogle}
              disabled={googleConnected}
              variant={googleConnected ? "outline" : "primary"}
            >
              {googleConnected
                ? isKo
                  ? "연결됨"
                  : "Connected"
                : isKo
                ? "연결하기"
                : "Connect"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          {isKo ? "건너뛰기" : "Skip for now"}
        </Link>
        <Link href="/dashboard">
          <Button>
            {metaConnected || googleConnected
              ? isKo
                ? "대시보드로 이동"
                : "Go to dashboard"
              : isKo
              ? "나중에 하기"
              : "I'll do this later"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
