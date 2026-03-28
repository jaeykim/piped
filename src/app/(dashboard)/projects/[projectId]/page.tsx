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
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/ui/spinner";
import type { Project } from "@/types/project";
import type { SiteAnalysis } from "@/types/analysis";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const projSnap = await getDoc(doc(getDb(), "projects", projectId));
      if (!projSnap.exists()) {
        router.push("/projects");
        return;
      }
      setProject({ id: projSnap.id, ...projSnap.data() } as Project);

      const analysisSnap = await getDoc(
        doc(getDb(), "projects", projectId, "analysis", "result")
      );
      if (analysisSnap.exists()) {
        setAnalysis(analysisSnap.data() as SiteAnalysis);
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
      title: "Generate Marketing Copy",
      desc: "Create headlines, descriptions, ad copy, and social posts",
      href: `/projects/${projectId}/copy`,
      color: "bg-blue-100 text-blue-600",
    },
    {
      stage: "creatives",
      icon: Image,
      title: "Create Ad Creatives",
      desc: "Generate images for Instagram, Facebook, and Google Ads",
      href: `/projects/${projectId}/creatives`,
      color: "bg-purple-100 text-purple-600",
    },
    {
      stage: "campaigns",
      icon: Megaphone,
      title: "Launch Campaigns",
      desc: "Set up and launch ad campaigns on Meta and Google",
      href: `/projects/${projectId}/campaigns`,
      color: "bg-orange-100 text-orange-600",
    },
    {
      stage: "affiliates",
      icon: Users,
      title: "Affiliate Program",
      desc: "Create an affiliate program for influencers",
      href: `/projects/${projectId}/affiliates`,
      color: "bg-green-100 text-green-600",
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
            className="mt-1 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
          >
            {project.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <Badge
          variant={project.status === "error" ? "error" : "success"}
        >
          {project.status}
        </Badge>
      </div>

      {/* Pipeline */}
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
              <h2 className="font-semibold text-gray-900">Site Analysis</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Value Proposition
              </p>
              <p className="mt-1 text-gray-900">{analysis.valueProposition}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Target Audience
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {analysis.targetAudience.map((a, i) => (
                    <Badge key={i} variant="info">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tone &amp; Industry
                </p>
                <div className="mt-1 flex gap-2">
                  <Badge>{analysis.tone}</Badge>
                  <Badge>{analysis.industry}</Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Key Features</p>
              <ul className="mt-1 list-inside list-disc text-sm text-gray-700">
                {analysis.keyFeatures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {analysis.brandColors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Brand Colors
                </p>
                <div className="mt-1 flex gap-2">
                  {analysis.brandColors.map((c, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-lg border border-gray-200"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pipeline Actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {pipelineActions.map((action) => {
          const Icon = action.icon;
          const stages = ["copy", "creatives", "campaigns", "affiliates"];
          const currentIdx = stages.indexOf(project.pipelineStage);
          const actionIdx = stages.indexOf(action.stage);
          const isAvailable = actionIdx <= currentIdx;

          return (
            <Link
              key={action.stage}
              href={isAvailable ? action.href : "#"}
              className={!isAvailable ? "pointer-events-none opacity-50" : ""}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {action.desc}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
