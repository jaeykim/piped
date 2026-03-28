"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { createProject } from "@/lib/db/projects";
import { getAuth_ } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function NewProjectPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !url.trim()) return;

    setLoading(true);
    setStatus("Creating project...");

    try {
      // Create project in Firestore
      const projectId = await createProject(profile.uid, url.trim(), url.trim());

      setStatus("Crawling website...");

      // Get auth token
      const token = await getAuth_().currentUser?.getIdToken();

      // Trigger crawl + analysis
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
        throw new Error(data.error || "Analysis failed");
      }

      toast("success", "Website analyzed successfully!");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
      <p className="mt-2 text-gray-600">
        Paste your website URL and we&apos;ll analyze it to generate marketing
        materials.
      </p>

      <Card className="mt-8">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Globe className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Enter your website URL
              </p>
              <p className="text-sm text-gray-500">
                We&apos;ll crawl and analyze your page with AI
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="https://your-product.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Start Pipeline
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {loading && (
            <div className="mt-6 space-y-3">
              {["Fetching page content", "Extracting text and metadata", "AI analyzing your brand"].map(
                (step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-500"
                  >
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
