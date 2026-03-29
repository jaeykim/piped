"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Link as LinkIcon, MousePointer, DollarSign, Copy, Check, Zap } from "lucide-react";
import type { AffiliateLink } from "@/types/affiliate";

export default function MyProgramsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<(AffiliateLink & { programName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  async function loadLinks() {
    if (!profile) return;
    const q = query(
      collection(getDb(), "affiliateLinks"),
      where("influencerId", "==", profile.uid)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AffiliateLink);

    const enriched = await Promise.all(
      items.map(async (link) => {
        const { getDoc, doc } = await import("firebase/firestore");
        const programSnap = await getDoc(doc(getDb(), "affiliatePrograms", link.programId));
        return { ...link, programName: programSnap.exists() ? (programSnap.data() as { name: string }).name : "Unknown" };
      })
    );
    setLinks(enriched);
    setLoading(false);
  }

  useEffect(() => { loadLinks(); }, [profile]);

  const handleCopy = (code: string, id: string) => {
    const url = `${window.location.origin}/api/affiliates/track?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestConvert = async (code: string, id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/affiliates/test-convert?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        toast("success", data.message);
        await loadLinks(); // Reload to show updated earnings
      } else {
        const err = await res.json();
        toast("error", err.error);
      }
    } catch {
      toast("error", "테스트 실패");
    }
    setTestingId(null);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">내 프로그램</h1>
      <p className="mt-1 text-sm text-gray-500">참여 중인 제휴 프로그램과 레퍼럴 링크</p>

      {links.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-600">참여 중인 프로그램이 없습니다</p>
            <Link href="/affiliates" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-700">
              프로그램 둘러보기 →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {links.map((link) => {
            const trackUrl = typeof window !== "undefined"
              ? `${window.location.origin}/api/affiliates/track?code=${link.code}`
              : "";
            return (
              <Card key={link.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{link.programName}</p>
                      <code className="text-xs text-gray-400">코드: {link.code}</code>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{link.clicks}</p>
                        <p className="text-[10px] text-gray-400">클릭</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{link.conversions}</p>
                        <p className="text-[10px] text-gray-400">전환</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">${link.earnings.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400">수익</p>
                      </div>
                    </div>
                  </div>

                  {/* Tracking link */}
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 rounded bg-gray-50 px-3 py-2 text-xs text-gray-600 break-all">
                      {trackUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(link.code, link.id)}
                    >
                      {copiedId === link.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>

                  {/* Test conversion button */}
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConvert(link.code, link.id)}
                      loading={testingId === link.id}
                    >
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      테스트 전환 (수익 발생)
                    </Button>
                    <span className="text-[10px] text-gray-400">클릭하면 랜덤 금액의 테스트 구매가 발생합니다</span>
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
