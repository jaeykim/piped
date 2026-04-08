"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, ArrowRight, AlertCircle, Zap } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { createProject } from "@/lib/db/projects";
import { getAuth_ } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/context/locale-context";

const MIN_CREDITS_FOR_PROJECT = 20;

export default function NewProjectPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLocale();
  const credits = profile?.credits ?? 0;
  const needsCredits = credits < MIN_CREDITS_FOR_PROJECT;
  const isKo = locale.startsWith("ko");

  const [urlError, setUrlError] = useState("");

  const validateUrl = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setUrlError(isKo ? "http 또는 https URL만 가능합니다" : "Only http/https URLs are allowed");
        return false;
      }
      if (!parsed.hostname.includes(".")) {
        setUrlError(isKo ? "올바른 도메인을 입력하세요" : "Please enter a valid domain");
        return false;
      }
      setUrlError("");
      return true;
    } catch {
      setUrlError(isKo ? "올바른 URL을 입력하세요" : "Please enter a valid URL");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !url.trim()) return;
    if (!validateUrl(url)) return;

    setLoading(true);
    setStatus(isKo ? "프로젝트 생성 중…" : "Creating project…");

    try {
      const projectId = await createProject(profile.uid, url.trim(), url.trim());
      const token = await getAuth_().currentUser?.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Crawl + analyze the URL
      setStatus(isKo ? "사이트 분석 중… (30초 정도)" : "Analyzing site… (~30s)");
      let res = await fetch("/api/crawl", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: url.trim(), projectId, locale }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || t.projects.analysisFailed);
      }

      // 2. Generate copy variants
      setStatus(isKo ? "광고 카피 생성 중…" : "Writing ad copy…");
      res = await fetch("/api/copy/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectId,
          language: isKo ? "한국어" : "English",
        }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "copy generation failed");
      }

      // 3. Generate one creative — auto-pick benefit-driven graphic-card
      setStatus(isKo ? "광고 이미지 생성 중… (1분 정도)" : "Generating ad image… (~1m)");
      res = await fetch("/api/creatives/generate-one", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectId,
          size: "1080x1080",
          platform: "instagram",
          concept: "benefit-driven",
          subject: "graphic-card",
          language: isKo ? "한국어" : "English",
          country: isKo ? "대한민국" : "United States",
        }),
      });
      // Creative gen failures aren't fatal — the wizard will show a "no
      // creative yet" state and let the user generate one manually.
      if (!res.ok) {
        console.warn("creative generation skipped:", await res.text());
      }

      toast("success", isKo ? "광고 자료 준비 완료!" : "Ad assets ready!");
      refreshProfile();
      router.push(`/projects/${projectId}/campaigns/new`);
    } catch (error) {
      toast("error", error instanceof Error ? error.message : t.common.error);
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{t.projects.title}</h1>

      {/* Credit warning */}
      {needsCredits && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-4 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {t.projects.notEnoughCredits}
              </p>
              <p className="mt-0.5 text-sm text-amber-700">
                {t.projects.notEnoughCreditsDesc.replace("{min}", String(MIN_CREDITS_FOR_PROJECT)).replace("{current}", String(credits))}
              </p>
              <Link href="/settings">
                <Button size="sm" className="mt-3">
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  {t.projects.buyCredits}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URL Input */}
      <Card className="mt-6">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Globe className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{t.projects.enterUrl}</p>
              <p className="text-sm text-gray-500">{t.projects.enterUrlDesc}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder={t.projects.urlPlaceholder}
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) validateUrl(e.target.value); }}
                disabled={loading}
              />
              {urlError && <p className="mt-1 text-xs text-red-500">{urlError}</p>}
            </div>
            <Button type="submit" loading={loading} disabled={needsCredits} className="w-full" size="lg">
              {loading ? (
                status
              ) : (
                <span className="flex items-center gap-2">
                  {t.projects.startPipeline}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {loading && (
            <div className="mt-6 space-y-3">
              {[t.projects.fetchingContent, t.projects.extractingMeta, t.projects.analyzingBrand].map(
                (s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                    {s}
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
