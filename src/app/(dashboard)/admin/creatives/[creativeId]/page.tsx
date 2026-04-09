"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Download, ExternalLink } from "lucide-react";
import { getAuth_ } from "@/lib/firebase/client";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

interface CreativeDetail {
  creative: {
    id: string;
    imageUrl: string;
    prompt: string;
    size: string;
    platform: string;
    concept: string;
    subject: string | null;
    overlayText: string | null;
    status: string;
    createdAt: string;
  };
  project: {
    id: string;
    name: string;
    url: string;
    status: string;
  };
  owner: { id: string; email: string; displayName: string };
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    platform: string;
    budgetAmount: number;
    targetRoas: number | null;
    createdAt: string;
  }>;
}

export default function AdminCreativeDetailPage() {
  const params = useParams();
  const creativeId = params.creativeId as string;
  const { locale } = useLocale();
  const { toast } = useToast();
  const isKo = locale.startsWith("ko");

  const [data, setData] = useState<CreativeDetail | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(`/api/admin/creatives/${creativeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      setData(await res.json());
    } catch {
      toast("error", isKo ? "조회 실패" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [creativeId, toast, isKo]);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          {isKo ? "접근 권한이 없습니다" : "Forbidden"}
        </h1>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const cr = data.creative;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/admin/users/${data.owner.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {data.owner.displayName || data.owner.email}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isKo ? "광고 소재 상세" : "Creative detail"}
          </h1>
          <p className="mt-1 text-xs text-gray-400">{cr.id}</p>
        </div>
        <Badge variant={cr.status === "ready" ? "success" : "warning"}>
          {cr.status}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* Image */}
        <Card className="lg:col-span-3">
          <CardContent className="p-3">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              {cr.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cr.imageUrl}
                  alt={cr.overlayText || "creative"}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">
                  no image
                </div>
              )}
            </div>
            {cr.imageUrl && (
              <div className="mt-3 flex justify-end gap-2">
                <a
                  href={cr.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isKo ? "원본 열기" : "Open"}
                </a>
                <a
                  href={cr.imageUrl}
                  download
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isKo ? "다운로드" : "Download"}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 py-4 text-xs">
            {[
              { label: isKo ? "사이즈" : "Size", value: cr.size },
              { label: isKo ? "플랫폼" : "Platform", value: cr.platform },
              { label: isKo ? "컨셉" : "Concept", value: cr.concept },
              {
                label: isKo ? "스타일" : "Subject",
                value: cr.subject || "—",
              },
              {
                label: isKo ? "오버레이 텍스트" : "Overlay",
                value: cr.overlayText || "—",
              },
              {
                label: isKo ? "생성" : "Created",
                value: new Date(cr.createdAt).toLocaleString(),
              },
            ].map((r) => (
              <div key={r.label}>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  {r.label}
                </p>
                <p className="mt-0.5 break-words font-medium text-gray-900">
                  {r.value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Generation prompt */}
      {cr.prompt && (
        <>
          <h2 className="mt-6 text-sm font-semibold text-gray-700">
            {isKo ? "생성 프롬프트" : "Generation prompt"}
          </h2>
          <Card className="mt-2">
            <CardContent className="py-3">
              <pre className="whitespace-pre-wrap break-words text-[11px] text-gray-600">
                {cr.prompt}
              </pre>
            </CardContent>
          </Card>
        </>
      )}

      {/* Parent project */}
      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        {isKo ? "프로젝트" : "Project"}
      </h2>
      <Card className="mt-2">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-gray-900">{data.project.name}</p>
          <p className="text-[11px] text-gray-400">{data.project.url}</p>
          <Badge variant="default" className="mt-2">
            {data.project.status}
          </Badge>
        </CardContent>
      </Card>

      {/* Campaigns using this project */}
      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        {isKo
          ? "이 프로젝트의 캠페인 (광고 소재 사용처)"
          : "Campaigns in this project"}{" "}
        <span className="ml-1 text-gray-400">({data.campaigns.length})</span>
      </h2>
      <Card className="mt-2">
        <CardContent className="py-2">
          {data.campaigns.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              {isKo ? "캠페인 없음" : "No campaigns"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {data.campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <Link
                    href={`/admin/campaigns/${c.id}`}
                    className="block min-w-0 flex-1 hover:text-indigo-700"
                  >
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {c.platform} · ${c.budgetAmount}/
                      {isKo ? "일" : "day"}
                      {c.targetRoas != null && (
                        <> · 🎯 {c.targetRoas}x</>
                      )}
                    </p>
                  </Link>
                  <Badge
                    variant={c.status === "active" ? "success" : "warning"}
                  >
                    {c.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
