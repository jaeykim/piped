"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ImageIcon, ShieldCheck } from "lucide-react";
import { getAuth_ } from "@/lib/firebase/client";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

interface AdminCreative {
  id: string;
  imageUrl: string;
  concept: string;
  subject: string | null;
  size: string;
  platform: string;
  status: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
    ownerId: string;
    ownerEmail: string;
    ownerName: string;
  };
}

export default function AdminCreativesIndexPage() {
  const { locale } = useLocale();
  const { toast } = useToast();
  const isKo = locale.startsWith("ko");

  const [creatives, setCreatives] = useState<AdminCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/admin/creatives?limit=120", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      const j = await res.json();
      setCreatives(j.creatives || []);
    } catch {
      toast("error", isKo ? "조회 실패" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [toast, isKo]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          {isKo ? "광고 소재 (전체)" : "Creatives (all users)"}
        </h1>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {isKo
          ? `최근 ${creatives.length}개`
          : `${creatives.length} most recent`}
      </p>

      {creatives.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-sm text-gray-400">
            {isKo ? "광고 소재가 없습니다" : "No creatives yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {creatives.map((c) => (
            <Link
              key={c.id}
              href={`/admin/creatives/${c.id}`}
              className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-indigo-300 hover:shadow-md"
            >
              <div className="aspect-square bg-gray-50">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt={c.concept}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-gray-300">
                    no img
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-[11px] font-medium text-gray-900">
                  {c.project.name}
                </p>
                <p className="truncate text-[10px] text-gray-400">
                  {c.project.ownerName || c.project.ownerEmail}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
