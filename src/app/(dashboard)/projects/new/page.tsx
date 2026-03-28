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

const MIN_CREDITS_FOR_PROJECT = 20; // analysis(5) + copy(10) + image(5)

export default function NewProjectPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();
  const credits = profile?.credits ?? 0;
  const needsCredits = credits < MIN_CREDITS_FOR_PROJECT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !url.trim()) return;

    setLoading(true);
    setStatus(t.projects.creating);

    try {
      const projectId = await createProject(profile.uid, url.trim(), url.trim());
      setStatus(t.projects.crawling);

      const token = await getAuth_().currentUser?.getIdToken();
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: url.trim(), projectId }),
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
              <p className="font-medium text-amber-800">크레딧이 부족합니다</p>
              <p className="mt-0.5 text-sm text-amber-700">
                프로젝트를 진행하려면 최소 {MIN_CREDITS_FOR_PROJECT} 크레딧이 필요합니다. 현재 잔액: {credits}
              </p>
              <Link href="/settings">
                <Button size="sm" className="mt-3">
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  크레딧 충전하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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
                (step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                    {step}
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
