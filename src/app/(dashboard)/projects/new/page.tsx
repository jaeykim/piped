"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, ArrowRight, ArrowLeft, AlertCircle, Zap } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { createProject } from "@/lib/db/projects";
import { getAuth_ } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/context/locale-context";
import type { CampaignType } from "@/types/project";

const MIN_CREDITS_FOR_PROJECT = 20;

const CAMPAIGN_TYPES: {
  id: CampaignType;
  icon: string;
  nameEn: string;
  nameKo: string;
  descEn: string;
  descKo: string;
}[] = [
  { id: "influencer", icon: "🤝", nameEn: "Influencer Marketing", nameKo: "인플루언서 마케팅", descEn: "Pay only for results", descKo: "성과가 나올 때만 비용 발생" },
  { id: "meta", icon: "📱", nameEn: "Meta Ads", nameKo: "Meta Ads", descEn: "Facebook & Instagram ads", descKo: "Facebook & Instagram 광고" },
  { id: "google", icon: "🔍", nameEn: "Google Ads", nameKo: "Google Ads", descEn: "Search & display ads", descKo: "검색 & 디스플레이 광고" },
];

export default function NewProjectPage() {
  const [step, setStep] = useState<"type" | "url">("type");
  const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !url.trim() || !selectedType) return;

    setLoading(true);
    setStatus(t.projects.creating);

    try {
      const projectId = await createProject(profile.uid, url.trim(), url.trim(), selectedType);
      setStatus(t.projects.crawling);

      const token = await getAuth_().currentUser?.getIdToken();
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: url.trim(), projectId, locale }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.projects.analysisFailed);
      }

      toast("success", t.projects.analyzed);
      refreshProfile();
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast("error", error instanceof Error ? error.message : t.common.error);
    } finally {
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

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
        <span className={`flex items-center gap-1.5 font-medium ${step === "type" ? "text-indigo-600" : "text-green-600"}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${step === "type" ? "bg-indigo-600" : "bg-green-500"}`}>1</span>
          {t.projects.campaignType}
        </span>
        <div className="h-px flex-1 bg-gray-200" />
        <span className={`flex items-center gap-1.5 font-medium ${step === "url" ? "text-indigo-600" : "text-gray-400"}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === "url" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>2</span>
          {t.projects.websiteUrl}
        </span>
      </div>

      {/* Step 1: Campaign Type */}
      {step === "type" && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t.projects.chooseCampaignType}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {CAMPAIGN_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setSelectedType(ct.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedType === ct.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{ct.icon}</span>
                  <p className="mt-2 font-medium">{isKo ? ct.nameKo : ct.nameEn}</p>
                  <p className="text-sm text-gray-500">{isKo ? ct.descKo : ct.descEn}</p>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setStep("url")}
              disabled={!selectedType}
              className="mt-6 w-full"
              size="lg"
            >
              <span className="flex items-center gap-2">
                {t.common.next}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: URL Input */}
      {step === "url" && (
        <Card className="mt-6">
          <CardContent className="p-8">
            <button
              onClick={() => setStep("type")}
              className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.projects.changeCampaignType}
            </button>

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
              <Input
                placeholder={t.projects.urlPlaceholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
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
      )}
    </div>
  );
}
