"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getAuth_ } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/context/locale-context";
import { Video, Upload, Download, RefreshCw } from "lucide-react";
import type { Creative } from "@/types/creative";

interface GeneratedVideo {
  sourceImage: string;
  videoUrl: string;
  status: "generating" | "ready" | "error";
}

export default function VideosPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const { t } = useLocale();

  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Map<string, GeneratedVideo>>(new Map());
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const loadCreatives = useCallback(async () => {
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(`/api/projects/${projectId}?include=creatives`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { project } = await res.json();
        setCreatives((project?.creatives ?? []) as Creative[]);
      }
    } catch (e) {
      console.error("Failed to load creatives:", e);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadCreatives(); }, [loadCreatives]);

  const handleGenerate = async (creativeId: string, imageUrl: string) => {
    setGeneratingId(creativeId);
    setVideos((prev) => new Map(prev).set(creativeId, { sourceImage: imageUrl, videoUrl: "", status: "generating" }));

    try {
      const token = await getAuth_().currentUser?.getIdToken();

      // Fetch the image and convert to base64
      const imgRes = await fetch(imageUrl);
      const imgBlob = await imgRes.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(imgBlob);
      });

      const res = await fetch("/api/creatives/video", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          imageBase64: base64,
          imageMimeType: imgBlob.type || "image/png",
          prompt: "Subtle cinematic motion, gentle camera push-in with soft ambient movement. Professional social media ad video.",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const data = await res.json();
      let videoUrl = "";

      if (data.videoUri) {
        videoUrl = data.videoUri;
      } else if (data.videoBase64) {
        const binary = atob(data.videoBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        videoUrl = URL.createObjectURL(new Blob([bytes], { type: data.mimeType }));
      }

      setVideos((prev) => new Map(prev).set(creativeId, { sourceImage: imageUrl, videoUrl, status: "ready" }));
      toast("success", "영상이 생성되었습니다!");
    } catch (error) {
      setVideos((prev) => new Map(prev).set(creativeId, { sourceImage: imageUrl, videoUrl: "", status: "error" }));
      toast("error", error instanceof Error ? error.message : "영상 생성 실패");
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">영상 제작</h1>
          <p className="mt-1 text-sm text-gray-500">
            광고 이미지를 AI 영상으로 변환합니다 (Google Veo)
          </p>
        </div>
      </div>

      {creatives.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Video className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-600">생성된 이미지가 없습니다</p>
            <p className="text-sm text-gray-400">먼저 Ad Creatives에서 이미지를 생성하세요</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creatives.filter((c) => c.status === "ready").map((creative) => {
            const video = videos.get(creative.id);
            const isGenerating = generatingId === creative.id;

            return (
              <Card key={creative.id} className="overflow-hidden">
                {video?.status === "ready" && video.videoUrl ? (
                  <div className="relative aspect-square bg-black">
                    <video
                      src={video.videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-square bg-gray-100">
                    {creative.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creative.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <Video className="h-10 w-10" />
                      </div>
                    )}
                    {isGenerating && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                        <Spinner size="lg" />
                        <p className="mt-2 text-sm font-medium text-white">영상 생성중...</p>
                        <p className="text-xs text-white/70">1-3분 소요</p>
                      </div>
                    )}
                  </div>
                )}
                <CardContent className="flex items-center justify-between">
                  <div>
                    <Badge variant={video?.status === "ready" ? "success" : "default"}>
                      {creative.size}
                    </Badge>
                    <span className="ml-2 text-xs text-gray-400">{creative.platform}</span>
                  </div>
                  <div className="flex gap-1">
                    {video?.status === "ready" && video.videoUrl && (
                      <a
                        href={video.videoUrl}
                        download="piped-video.mp4"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleGenerate(creative.id, creative.imageUrl || "")}
                      disabled={isGenerating}
                      className="rounded p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                    >
                      {video?.status === "ready" ? <RefreshCw className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
