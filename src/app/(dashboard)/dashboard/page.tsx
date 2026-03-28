"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Megaphone, Users, TrendingUp } from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/project";

export default function DashboardPage() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ projects: 0, campaigns: 0, affiliates: 0 });

  useEffect(() => {
    if (!profile) return;

    async function loadData() {
      // Load recent projects
      const projQ = query(
        collection(getDb(), "projects"),
        where("ownerId", "==", profile!.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const projSnap = await getDocs(projQ);
      setProjects(
        projSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project)
      );

      // Load stats
      const allProj = await getDocs(
        query(collection(getDb(), "projects"), where("ownerId", "==", profile!.uid))
      );
      const allCamp = await getDocs(
        query(collection(getDb(), "campaigns"), where("ownerId", "==", profile!.uid))
      );
      setStats({
        projects: allProj.size,
        campaigns: allCamp.size,
        affiliates: 0,
      });
    }

    loadData();
  }, [profile]);

  const stageColors: Record<string, "default" | "info" | "success" | "warning"> = {
    analysis: "info",
    copy: "info",
    creatives: "warning",
    campaigns: "success",
    affiliates: "success",
  };

  if (profile?.role === "influencer") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile.displayName}
        </h1>
        <p className="mt-2 text-gray-600">
          Discover products to promote and earn commissions.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/affiliates">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <FolderKanban className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Browse Programs</p>
                  <p className="text-sm text-gray-600">
                    Find products to promote
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/affiliates/earnings">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">My Earnings</p>
                  <p className="text-sm text-gray-600">Track your commissions</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome back, {profile?.displayName}
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Projects", value: stats.projects, icon: FolderKanban, color: "bg-indigo-100 text-indigo-600" },
          { label: "Campaigns", value: stats.campaigns, icon: Megaphone, color: "bg-blue-100 text-blue-600" },
          { label: "Affiliates", value: stats.affiliates, icon: Users, color: "bg-green-100 text-green-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Projects */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
        {projects.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-12 text-center">
              <FolderKanban className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-600">No projects yet</p>
              <p className="text-sm text-gray-500">
                Create your first project to start the marketing pipeline.
              </p>
              <Link href="/projects/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {project.name}
                      </p>
                      <p className="text-sm text-gray-500">{project.url}</p>
                    </div>
                    <Badge variant={stageColors[project.pipelineStage] || "default"}>
                      {project.pipelineStage}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
