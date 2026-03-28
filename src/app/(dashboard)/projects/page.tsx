"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getUserProjects } from "@/lib/db/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const { profile } = useAuth();
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              No projects yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Paste your website URL to start the marketing pipeline.
            </p>
            <Link href="/projects/new">
              <Button className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {project.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        project.status === "error"
                          ? "error"
                          : project.status === "ready"
                          ? "success"
                          : "info"
                      }
                    >
                      {stageLabel[project.pipelineStage] || project.pipelineStage}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
