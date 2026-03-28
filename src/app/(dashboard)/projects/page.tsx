"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { getUserProjects } from "@/lib/db/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const { profile } = useAuth();
  const { t } = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getUserProjects(profile.uid).then((p) => {
      setProjects(p);
      setLoading(false);
    });
  }, [profile]);

  const stageLabel: Record<string, string> = {
    analysis: "Analyzing",
    copy: "Copy Ready",
    creatives: "Creatives",
    campaigns: "Campaigns",
    affiliates: "Affiliates",
  };

  const stageColor: Record<string, "default" | "info" | "success" | "warning"> = {
    analysis: "info",
    copy: "info",
    creatives: "warning",
    campaigns: "success",
    affiliates: "success",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.sidebar.projects}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{projects.length} projects</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t.dashboard.newProject}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">{t.dashboard.noProjects}</p>
            <p className="mt-1 text-sm text-gray-500">{t.dashboard.noProjectsDesc}</p>
            <Link href="/projects/new">
              <Button className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                {t.dashboard.createProject}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-all hover:shadow-md hover:border-gray-300">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="mt-0.5 truncate text-sm text-gray-400">{project.url}</p>
                  </div>
                  <Badge variant={project.status === "error" ? "error" : stageColor[project.pipelineStage] || "default"}>
                    {stageLabel[project.pipelineStage] || project.pipelineStage}
                  </Badge>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
