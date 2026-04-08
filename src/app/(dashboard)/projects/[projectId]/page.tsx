"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  PenTool,
  Image,
  Megaphone,
  Users,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  Lock,
  BarChart3,
  Target,
  Sparkles,
  Loader2,
} from "lucide-react";
import { getAuth_ } from "@/lib/firebase/client";
import { useLocale } from "@/context/locale-context";
import { useToast } from "@/components/ui/toast";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import type { Project } from "@/types/project";
import type { SiteAnalysis } from "@/types/analysis";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { t } = useLocale();
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [competitors, setCompetitors] = useState<{
    competitors: { name: string; url?: string; positioning: string; adStrategy: string; strengths: string[]; weaknesses: string[]; ogImage?: string; favicon?: string }[];
    ourAdvantages: string[];
    recommendedAngles: { angle: string; description: string; example: string }[];
    sampleTemplates?: { id: string; angle: string; headline: string; description: string; concept: string; productImage?: string; productName: string; brandColor: string }[];
    marketInsight: string;
  } | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; headline: string; description: string } | null>(null);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(`/api/projects/${projectId}?include=analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        router.push("/projects");
        return;
      }
      const { project: p } = await res.json();
      setProject(p as Project);

      if (p.analysis) {
        const a = p.analysis;
        setAnalysis({
          rawHtmlUrl: a.rawHtmlUrl ?? undefined,
          extractedText: a.extractedText,
          metaTags: {
            title: a.metaTitle,
            description: a.metaDescription,
            ogImage: a.ogImage ?? undefined,
            ogTitle: a.ogTitle ?? undefined,
            ogDescription: a.ogDescription ?? undefined,
            keywords: a.keywords ?? undefined,
          },
          productName: a.productName,
          valueProposition: a.valueProposition,
          targetAudience: a.targetAudience,
          keyFeatures: a.keyFeatures,
          tone: a.tone,
          industry: a.industry,
          brandColors: a.brandColors,
          logoUrl: a.logoUrl ?? undefined,
          screenshots: a.screenshots,
          analyzedAt: new Date(a.analyzedAt),
        });
      }

      // Competitor analysis cache was dropped during the Postgres migration —
      // it now runs on demand via /api/analyze/competitors.

      setLoading(false);
    }
    load();
  }, [projectId, router]);

  if (loading) return <FullPageSpinner />;
  if (!project) return null;

  const campaignType = project.campaignType;
  const isKo = t.common.next === "다음";

  // Build pipeline actions based on campaign type
  const basePipelineActions = [
    {
      stage: "copy",
      icon: PenTool,
      title: t.projectDetail.generateCopy,
      desc: t.projectDetail.generateCopyDesc,
      href: `/projects/${projectId}/copy`,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      credits: 10,
    },
    {
      stage: "creatives",
      icon: Image,
      title: t.projectDetail.createCreatives,
      desc: isKo ? "이미지 · 영상 광고 제작" : "Image & video ad creation",
      href: `/projects/${projectId}/creatives`,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      credits: 5,
      creditsNote: isKo ? "이미지 5~15 · 영상 30" : "Image 5–15 · Video 30",
    },
  ];

  // Final step depends on campaign type
  const finalAction = campaignType === "influencer"
    ? {
        stage: "affiliates",
        icon: Users,
        title: t.projectDetail.affiliateProgram,
        desc: t.projectDetail.affiliateProgramDesc,
        href: `/projects/${projectId}/affiliates`,
        color: "bg-green-50 text-green-600 border-green-100",
        credits: 0,
      }
    : {
        stage: "campaigns",
        icon: Megaphone,
        title: t.projectDetail.launchCampaigns,
        desc: t.projectDetail.launchCampaignsDesc,
        href: `/projects/${projectId}/campaigns`,
        color: "bg-orange-50 text-orange-600 border-orange-100",
        credits: 5,
      };

  const pipelineActions = [...basePipelineActions, finalAction];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors"
          >
            {project.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          {campaignType && (
            <Badge variant="info">
              {campaignType === "influencer" ? "Influencer" : campaignType === "meta" ? "Meta Ads" : "Google Ads"}
            </Badge>
          )}
          <Badge variant={project.status === "error" ? "error" : "success"}>
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Pipeline Stepper */}
      <div className="mt-6">
        <PipelineStepper
          currentStage={project.pipelineStage}
          campaignType={project.campaignType}
          onStageClick={(stage) => {
            const action = pipelineActions.find((a) => a.stage === stage);
            if (action) router.push(action.href);
          }}
        />
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-900">{t.projectDetail.analysisResult}</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{t.projectDetail.product}</p>
              <p className="mt-1 font-medium text-gray-900">{analysis.productName}</p>
              <p className="mt-0.5 text-sm text-gray-600">{analysis.valueProposition}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{t.projectDetail.audience}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {analysis.targetAudience.map((a, i) => (
                    <Badge key={i} variant="info">{a}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{t.projectDetail.toneAndIndustry}</p>
                <div className="mt-1.5 flex gap-2">
                  <Badge>{analysis.tone}</Badge>
                  <Badge>{analysis.industry}</Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{t.projectDetail.features}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {analysis.keyFeatures.map((f, i) => (
                  <Badge key={i} variant="default">{f}</Badge>
                ))}
              </div>
            </div>

            {analysis.brandColors.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{t.projectDetail.brandColors}</p>
                <div className="mt-1.5 flex gap-2">
                  {analysis.brandColors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-md border border-gray-200" style={{ backgroundColor: c }} />
                      <span className="text-xs text-gray-400">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Competitor Analysis */}
      {analysis && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                <h2 className="font-semibold text-gray-900">{isKo ? "경쟁사 분석" : "Competitor Analysis"}</h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setLoadingCompetitors(true);
                  try {
                    const token = await getAuth_().currentUser?.getIdToken();
                    const res = await fetch("/api/analyze/competitors", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ projectId }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setCompetitors(data);
                      toast("success", isKo ? "경쟁사 분석 완료" : "Competitor analysis complete");
                    }
                  } catch {
                    toast("error", isKo ? "분석 실패" : "Analysis failed");
                  }
                  setLoadingCompetitors(false);
                }}
                disabled={loadingCompetitors}
              >
                {loadingCompetitors ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                {competitors ? (isKo ? "재분석" : "Re-analyze") : (isKo ? "AI 분석 시작" : "Start AI Analysis")}
              </Button>
            </div>
          </CardHeader>
          {competitors && (
            <CardContent className="space-y-4">
              {/* Market Insight */}
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-800">{competitors.marketInsight}</p>
              </div>

              {/* Competitors */}
              <div className="space-y-2">
                {competitors.competitors.map((comp, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-3">
                      {comp.ogImage && (
                        <img src={comp.ogImage} alt={comp.name} className="h-12 w-20 shrink-0 rounded border border-gray-200 object-cover" />
                      )}
                      {!comp.ogImage && comp.favicon && (
                        <img src={comp.favicon} alt={comp.name} className="h-8 w-8 shrink-0 rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{comp.name}</p>
                        <p className="text-xs text-gray-600">{comp.positioning}</p>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{isKo ? "광고 전략" : "Ad strategy"}: {comp.adStrategy}</p>
                    <div className="mt-2 flex gap-4 text-[10px]">
                      <div>
                        <span className="font-medium text-green-700">{isKo ? "강점" : "Strengths"}:</span>
                        <span className="text-gray-500"> {comp.strengths.join(", ")}</span>
                      </div>
                      <div>
                        <span className="font-medium text-red-600">{isKo ? "약점" : "Weaknesses"}:</span>
                        <span className="text-gray-500"> {comp.weaknesses.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Our Advantages */}
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-xs font-semibold text-green-900 mb-1">{isKo ? "우리의 차별점" : "Our Advantages"}</p>
                <ul className="space-y-0.5">
                  {competitors.ourAdvantages.map((adv, i) => (
                    <li key={i} className="text-xs text-green-800">• {adv}</li>
                  ))}
                </ul>
              </div>

              {/* Recommended Ad Angles */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">{isKo ? "추천 광고 전략" : "Recommended Ad Angles"}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {competitors.recommendedAngles.map((angle, i) => (
                    <div key={i} className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                      <p className="text-xs font-semibold text-indigo-900">{angle.angle}</p>
                      <p className="mt-1 text-[10px] text-indigo-700">{angle.description}</p>
                      <p className="mt-2 text-[10px] font-medium text-indigo-800 italic">&quot;{angle.example}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Ad Templates — editable */}
              {competitors.sampleTemplates && competitors.sampleTemplates.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">{isKo ? "광고 예시 — 클릭하여 편집" : "Ad Samples — Click to edit"}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {competitors.sampleTemplates.map((tmpl) => {
                    const isEditing = editingTemplate?.id === tmpl.id;
                    return (
                      <div key={tmpl.id} className="rounded-xl border-2 border-gray-200 overflow-hidden hover:border-indigo-300 transition-all">
                        {/* Preview card */}
                        <div className="aspect-square relative" style={{ backgroundColor: tmpl.brandColor + "15" }}>
                          {tmpl.productImage && (
                            <img src={tmpl.productImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                          )}
                          <div className="absolute inset-0 flex flex-col justify-between p-4">
                            <div>
                              <Badge variant="info" className="text-[9px] mb-2">{tmpl.angle}</Badge>
                              {isEditing ? (
                                <input
                                  value={editingTemplate.headline}
                                  onChange={(e) => setEditingTemplate({ ...editingTemplate, headline: e.target.value })}
                                  className="w-full bg-white/90 rounded px-2 py-1 text-sm font-bold text-gray-900 border border-indigo-300 focus:outline-none"
                                  autoFocus
                                />
                              ) : (
                                <p className="text-sm font-bold text-gray-900 leading-tight">&quot;{tmpl.headline}&quot;</p>
                              )}
                            </div>
                            <div>
                              {isEditing ? (
                                <textarea
                                  value={editingTemplate.description}
                                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                                  className="w-full bg-white/90 rounded px-2 py-1 text-[10px] text-gray-700 border border-indigo-300 focus:outline-none resize-none"
                                  rows={2}
                                />
                              ) : (
                                <p className="text-[10px] text-gray-600">{tmpl.description}</p>
                              )}
                              <p className="mt-1 text-[9px] font-semibold" style={{ color: tmpl.brandColor }}>{tmpl.productName}</p>
                            </div>
                          </div>
                        </div>
                        {/* Action */}
                        <div className="p-2 flex gap-1">
                          {isEditing ? (
                            <>
                              <Button size="sm" className="flex-1 text-[10px]" onClick={() => {
                                // Save edited template back
                                if (competitors?.sampleTemplates) {
                                  setCompetitors({
                                    ...competitors,
                                    sampleTemplates: competitors.sampleTemplates.map((t) =>
                                      t.id === tmpl.id ? { ...t, headline: editingTemplate.headline, description: editingTemplate.description } : t
                                    ),
                                  });
                                }
                                setEditingTemplate(null);
                                toast("success", isKo ? "수정됨" : "Updated");
                              }}>
                                {isKo ? "저장" : "Save"}
                              </Button>
                              <Button size="sm" variant="outline" className="text-[10px]" onClick={() => setEditingTemplate(null)}>
                                {isKo ? "취소" : "Cancel"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" className="flex-1 text-[10px]" onClick={() => setEditingTemplate({ id: tmpl.id, headline: tmpl.headline, description: tmpl.description })}>
                                {isKo ? "문구 편집" : "Edit Copy"}
                              </Button>
                              <Link href={`/projects/${projectId}/creatives`}>
                                <Button size="sm" className="text-[10px]">
                                  {isKo ? "이 전략으로 생성" : "Create Ad"}
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Performance Chart */}
      {(project.pipelineStage === "campaigns" || project.pipelineStage === "affiliates") && (() => {
        const perfData = [
          { day: isKo ? "월" : "Mon", impressions: 1200, clicks: 65, spend: 8 },
          { day: isKo ? "화" : "Tue", impressions: 980, clicks: 48, spend: 6 },
          { day: isKo ? "수" : "Wed", impressions: 1650, clicks: 92, spend: 12 },
          { day: isKo ? "목" : "Thu", impressions: 1100, clicks: 58, spend: 7 },
          { day: isKo ? "금" : "Fri", impressions: 2100, clicks: 120, spend: 15 },
          { day: isKo ? "토" : "Sat", impressions: 1400, clicks: 78, spend: 10 },
          { day: isKo ? "일" : "Sun", impressions: 1800, clicks: 95, spend: 12 },
        ];
        const maxSpend = Math.max(...perfData.map((d) => d.spend));
        const totalImpr = perfData.reduce((s, d) => s + d.impressions, 0);
        const totalClk = perfData.reduce((s, d) => s + d.clicks, 0);
        const totalSpd = perfData.reduce((s, d) => s + d.spend, 0);
        return (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">{isKo ? "캠페인 성과" : "Campaign Performance"}</h2>
              </div>
              <Badge variant="default">{isKo ? "데모" : "Demo"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{totalImpr.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">{isKo ? "노출" : "Impressions"}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{totalClk.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">{isKo ? "클릭" : "Clicks"}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">${totalSpd}</p>
                <p className="text-[10px] text-gray-500">{isKo ? "지출" : "Spend"}</p>
              </div>
            </div>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {perfData.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-indigo-600">${d.spend}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400"
                    style={{ height: `${(d.spend / maxSpend) * 90}px`, minHeight: 6 }}
                  />
                  <span className="text-[10px] text-gray-400">{d.day}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-gray-400 text-center">
              {isKo ? "캠페인을 런칭하면 실제 데이터로 대체됩니다" : "Will be replaced with real data after campaign launch"}
            </p>
          </CardContent>
        </Card>
        );
      })()}

      {/* Pipeline Actions */}
      <div className="mt-6 space-y-2">
        {pipelineActions.map((action, idx) => {
          const Icon = action.icon;
          const stages = ["copy", "creatives", "campaigns", "affiliates"];
          const currentIdx = stages.indexOf(project.pipelineStage);
          const actionIdx = stages.indexOf(action.stage);

          const isCompleted = actionIdx < currentIdx;
          const isCurrent = actionIdx === currentIdx;
          const isLocked = actionIdx > currentIdx;

          return (
            <Link
              key={`${action.stage}-${idx}`}
              href={!isLocked ? action.href : "#"}
              className={isLocked ? "pointer-events-none" : ""}
            >
              <Card className={`transition-all ${
                isLocked ? "opacity-40"
                : isCompleted ? "border-green-200 bg-green-50/30 hover:border-green-300"
                : isCurrent ? "border-indigo-200 bg-indigo-50/30 hover:border-indigo-300 hover:shadow-md"
                : "hover:shadow-md hover:border-gray-300"
              }`}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    isCompleted ? "bg-green-50 text-green-600 border-green-200"
                    : isLocked ? "bg-gray-50 text-gray-400 border-gray-200"
                    : action.color
                  }`}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${isLocked ? "text-gray-400" : "text-gray-900"}`}>{action.title}</p>
                      {isCompleted && <Badge variant="success">{t.projectDetail.completed}</Badge>}
                      {isCurrent && <Badge variant="info">{t.projectDetail.currentStep}</Badge>}
                      {(action as { credits?: number; creditsNote?: string }).credits ? (
                        <span className={`text-[10px] font-medium ${isLocked ? "text-gray-300" : "text-gray-400"}`}>
                          {(action as { creditsNote?: string }).creditsNote || `${(action as { credits: number }).credits} ${isKo ? "크레딧" : "credits"}`}
                        </span>
                      ) : null}
                    </div>
                    <p className={`text-sm ${isLocked ? "text-gray-300" : "text-gray-500"}`}>
                      {isCompleted ? t.projectDetail.clickToEdit : action.desc}
                    </p>
                  </div>
                  {!isLocked && <ArrowRight className={`h-4 w-4 shrink-0 ${isCompleted ? "text-green-400" : "text-gray-300"}`} />}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
