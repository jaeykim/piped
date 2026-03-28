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
  Video,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  Lock,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useLocale } from "@/context/locale-context";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";
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

  useEffect(() => {
    async function load() {
      const projSnap = await getDoc(doc(getDb(), "projects", projectId));
      if (!projSnap.exists()) { router.push("/projects"); return; }
      setProject({ id: projSnap.id, ...projSnap.data() } as Project);

      const analysisSnap = await getDoc(doc(getDb(), "projects", projectId, "analysis", "result"));
      if (analysisSnap.exists()) setAnalysis(analysisSnap.data() as SiteAnalysis);

      // Auto-redirect to current pipeline step
      const stage = projSnap.data()?.pipelineStage;
      if (stage === "creatives") {
        router.push(`/projects/${projectId}/creatives`);
        return;
      }

      setLoading(false);
    }
    load();
  }, [projectId, router]);

  if (loading) return <FullPageSpinner />;
  if (!project) return null;

  const pipelineActions = [
    {
      stage: "copy",
      icon: PenTool,
      title: t.projectDetail.generateCopy,
      desc: t.projectDetail.generateCopyDesc,
      href: `/projects/${projectId}/copy`,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      stage: "creatives",
      icon: Image,
      title: t.projectDetail.createCreatives,
      desc: t.projectDetail.createCreativesDesc,
      href: `/projects/${projectId}/creatives`,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      stage: "creatives",
      icon: Video,
      title: "영상 제작",
      desc: "광고 이미지를 AI 영상으로 변환",
      href: `/projects/${projectId}/videos`,
      color: "bg-pink-50 text-pink-600 border-pink-100",
    },
    {
      stage: "campaigns",
      icon: Megaphone,
      title: t.projectDetail.launchCampaigns,
      desc: t.projectDetail.launchCampaignsDesc,
      href: `/projects/${projectId}/campaigns`,
      color: "bg-orange-50 text-orange-600 border-orange-100",
    },
    {
      stage: "affiliates",
      icon: Users,
      title: t.projectDetail.affiliateProgram,
      desc: t.projectDetail.affiliateProgramDesc,
      href: `/projects/${projectId}/affiliates`,
      color: "bg-green-50 text-green-600 border-green-100",
    },
  ];

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
        <Badge variant={project.status === "error" ? "error" : "success"}>
          {project.status}
        </Badge>
      </div>

      {/* Pipeline Stepper */}
      <div className="mt-6">
        <PipelineStepper
          currentStage={project.pipelineStage}
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
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Tone & Industry</p>
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
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Brand Colors</p>
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
                      {isCompleted && <Badge variant="success">완료</Badge>}
                      {isCurrent && <Badge variant="info">현재 단계</Badge>}
                    </div>
                    <p className={`text-sm ${isLocked ? "text-gray-300" : "text-gray-500"}`}>
                      {isCompleted ? "클릭하여 수정하거나 다시 생성할 수 있습니다" : action.desc}
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
