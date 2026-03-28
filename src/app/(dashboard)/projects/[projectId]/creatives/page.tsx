"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { getAuth_ } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import {
  Image,
  Sparkles,
  Download,
  RefreshCw,
  ArrowRight,
  Megaphone,
  CheckCircle,
} from "lucide-react";

interface GeneratedCreative {
  id: string;
  blobUrl: string;
  size: string;
  platform: string;
}

const REQUESTS = [
  { size: "1080x1080", platform: "instagram", style: "minimal", label: "Instagram (1080x1080)", styleLabel: "Minimal" },
  { size: "1200x628", platform: "facebook", style: "bold", label: "Facebook (1200x628)", styleLabel: "Bold" },
];

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
};

export default function CreativesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [creatives, setCreatives] = useState<GeneratedCreative[]>([]);
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setGenerating(true);
    setCreatives([]);
    const token = await getAuth_().currentUser?.getIdToken();
    if (!token) {
      toast("error", "Not authenticated");
      setGenerating(false);
      return;
    }

    for (let i = 0; i < REQUESTS.length; i++) {
      const req = REQUESTS[i];
      setCurrentIndex(i);
      try {
        const res = await fetch("/api/creatives/generate-one", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            size: req.size,
            platform: req.platform,
            style: req.style,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error(`Failed ${req.platform}:`, err);
          continue;
        }

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const creativeId = res.headers.get("X-Creative-Id") || `local-${i}`;

        setCreatives((prev) => [
          ...prev,
          { id: creativeId, blobUrl, size: req.size, platform: req.platform },
        ]);
      } catch (error) {
        console.error(`Failed ${req.platform}:`, error);
      }
    }

    setGenerating(false);
    setCurrentIndex(-1);
    toast("success", "Images generated!");
  };

  // No images and not generating
  if (creatives.length === 0 && !generating) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Ad Creatives</h1>
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Image className="mx-auto h-12 w-12 text-purple-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              Generate Ad Creatives
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Nano Banana 2 will create 2 ad images for Instagram and Facebook.
            </p>
            <Button onClick={handleGenerate} className="mt-6" size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Images
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ad Creatives</h1>
        {!generating && (
          <Button variant="outline" onClick={handleGenerate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {REQUESTS.map((req, i) => {
          const creative = creatives.find(
            (c) => c.platform === req.platform && c.size === req.size
          );
          const isCurrent = generating && currentIndex === i;
          const isWaiting = generating && currentIndex < i;
          const isDone = !!creative;

          return (
            <Card key={`${req.platform}-${req.size}`} className="overflow-hidden">
              <div className="relative aspect-square bg-gray-50">
                {isDone ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creative.blobUrl}
                    alt={`Creative for ${req.platform}`}
                    className="h-full w-full object-cover"
                  />
                ) : isCurrent ? (
                  <div className="flex h-full flex-col items-center justify-center">
                    <Spinner size="lg" />
                    <p className="mt-3 text-sm font-medium text-indigo-600">
                      Generating {req.styleLabel}...
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      ~20 seconds
                    </p>
                  </div>
                ) : isWaiting ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-300">
                    <Image className="h-8 w-8" />
                    <p className="mt-2 text-xs">Waiting</p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-200">
                    <Image className="h-8 w-8" />
                  </div>
                )}
              </div>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={isDone ? "success" : isCurrent ? "info" : "default"}>
                    {platformLabels[req.platform]}
                  </Badge>
                  <span className="text-xs text-gray-500">{req.size}</span>
                  {isDone && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                {isDone && (
                  <a
                    href={creative.blobUrl}
                    download={`piped-${req.platform}-${req.size}.png`}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Step */}
      {!generating && creatives.length > 0 && (
        <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Megaphone className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Next: Launch Campaigns</p>
              <p className="text-sm text-gray-500">
                Set up ad campaigns on Meta or Google Ads
              </p>
            </div>
          </div>
          <Link href={`/projects/${projectId}/campaigns/new`}>
            <Button>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
