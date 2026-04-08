"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  DollarSign,
  Clock,
  Users,
  Link as LinkIcon,
  Check,
  Copy,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";
import type { CopyVariant } from "@/types/copy";
import type { Creative } from "@/types/creative";

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.programId as string;
  const { profile } = useAuth();
  const { toast } = useToast();
  const { locale } = useLocale();
  const isKo = locale.startsWith("ko");

  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [copyVariants, setCopyVariants] = useState<CopyVariant[]>([]);

  useEffect(() => {
    async function load() {
      const programRes = await fetch(`/api/affiliates/programs/${programId}`);
      if (programRes.ok) {
        const { program: prog } = await programRes.json();
        setProgram(prog as AffiliateProgram);

        if (prog?.projectId) {
          const token = await getAuth_().currentUser?.getIdToken();
          const projRes = await fetch(
            `/api/projects/${prog.projectId}?include=creatives,copy`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (projRes.ok) {
            const { project } = await projRes.json();
            setCreatives(
              (project?.creatives ?? [])
                .filter((c: Creative) => c.status === "ready") as Creative[]
            );
            setCopyVariants((project?.copyVariants ?? []) as CopyVariant[]);
          }
        }
      }

      // Has the influencer already joined? Earnings list contains
      // every link they own, so we can scan it for this program.
      if (profile?.uid) {
        const token = await getAuth_().currentUser?.getIdToken();
        const earningsRes = await fetch("/api/affiliates/earnings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (earningsRes.ok) {
          const data = await earningsRes.json();
          const existing = (data.links || []).find(
            (l: { programId: string; code: string }) => l.programId === programId
          );
          if (existing) setAffiliateCode(existing.code);
        }
      }

      setLoading(false);
    }
    load();
  }, [programId, profile]);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/affiliates/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ programId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const data = await res.json();
      setAffiliateCode(data.code);
      toast(
        "success",
        data.alreadyJoined
          ? "You already joined this program!"
          : "Successfully joined!"
      );
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Failed to join"
      );
    } finally {
      setJoining(false);
    }
  };

  const trackingUrl = affiliateCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/track?code=${affiliateCode}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="py-20 text-center text-gray-500">Program not found</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{program.name}</h1>
            <Badge variant="success">{program.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">{program.description}</p>

          <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
            <div className="text-center">
              <DollarSign className="mx-auto h-5 w-5 text-green-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {program.commissionValue}
                {program.commissionType === "percentage" ? "%" : "$"}
              </p>
              <p className="text-xs text-gray-500">Per Referral</p>
            </div>
            <div className="text-center">
              <Clock className="mx-auto h-5 w-5 text-blue-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {program.cookieDurationDays}
              </p>
              <p className="text-xs text-gray-500">Day Cookie</p>
            </div>
            <div className="text-center">
              <Users className="mx-auto h-5 w-5 text-purple-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {program.totalAffiliates}
              </p>
              <p className="text-xs text-gray-500">Affiliates</p>
            </div>
          </div>

          {affiliateCode ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="h-5 w-5" />
                  <p className="font-medium">
                    You&apos;re in! Here&apos;s your tracking link:
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded bg-white px-3 py-2 text-sm border border-green-200 break-all">
                    {trackingUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(trackingUrl || "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Share this link with your audience. You&apos;ll earn{" "}
                {program.commissionValue}
                {program.commissionType === "percentage" ? "%" : "$"} for every
                referred conversion.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              loading={joining}
              className="w-full"
              size="lg"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Join Program
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Promotion Guide — unified with materials */}
      {affiliateCode && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">{isKo ? "홍보 가이드" : "Promotion Guide"}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 1. Ad Images */}
            {creatives.length > 0 && (
              <div className="rounded-lg bg-purple-50 p-4">
                <h3 className="font-medium text-purple-900 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" />
                  {isKo ? "광고 이미지" : "Ad Images"}
                  <span className="text-xs font-normal text-purple-600">({creatives.length})</span>
                </h3>
                <p className="mt-1 text-xs text-purple-700">
                  {isKo ? "이미지를 다운로드하여 SNS, 블로그, 커뮤니티에 활용하세요." : "Download and use these images on social media, blogs, and communities."}
                </p>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {creatives.map((c) => (
                    <div key={c.id} className="group relative rounded-lg border border-purple-200 overflow-hidden bg-white">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.prompt} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-gray-50">
                          <ImageIcon className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        {c.imageUrl && (
                          <a href={c.imageUrl} download target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-lg hover:bg-gray-100">
                            <Download className="h-3.5 w-3.5" />
                            {isKo ? "다운로드" : "Download"}
                          </a>
                        )}
                      </div>
                      <div className="p-1.5">
                        <p className="text-[10px] text-gray-400">{c.platform} · {c.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Marketing Copy */}
            <div className="rounded-lg bg-indigo-50 p-4">
              <h3 className="font-medium text-indigo-900">{isKo ? "추천 홍보 문구" : "Recommended Copy"}</h3>
              <p className="mt-1 text-xs text-indigo-700">
                {isKo ? "복사하면 레퍼럴 링크가 자동으로 포함됩니다." : "Your referral link is automatically included when you copy."}
              </p>
              <div className="mt-3 space-y-2">
                {copyVariants.length > 0 ? (
                  <>
                    {copyVariants.filter((c) => ["headline", "social", "ad_meta", "cta"].includes(c.type)).slice(0, 6).map((c) => {
                      const displayText = c.editedContent || c.content;
                      const typeLabel: Record<string, string> = isKo
                        ? { headline: "헤드라인", description_short: "짧은 설명", ad_meta: "Meta 광고", social: "소셜", cta: "CTA" }
                        : { headline: "Headline", description_short: "Short Desc", ad_meta: "Meta Ad", social: "Social", cta: "CTA" };
                      return (
                        <div key={c.id} className="flex items-start gap-2 rounded bg-white p-3 text-sm">
                          <Badge variant="default" className="shrink-0 mt-0.5">{typeLabel[c.type] || c.type}</Badge>
                          <p className="flex-1 text-gray-700 break-words">{displayText.length > 150 ? displayText.slice(0, 150) + "..." : displayText}</p>
                          <button
                            onClick={() => copyText(c.id, `${displayText}\n${trackingUrl}`)}
                            className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            {copiedId === c.id ? "✓" : isKo ? "복사" : "Copy"}
                          </button>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {[
                      `${program.name} 사용해봤는데 진짜 좋아요! 이 링크로 가입하면 특별 혜택을 받을 수 있어요 👉`,
                      `마케팅 자동화가 필요하다면 ${program.name} 강추! URL만 넣으면 광고가 뚝딱 👇`,
                      `요즘 사이드 프로젝트 마케팅은 AI한테 맡기는 시대. ${program.name}으로 3분 만에 광고 세팅 완료 🚀`,
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-2 rounded bg-white p-3 text-sm">
                        <span className="shrink-0 text-indigo-500">{i + 1}.</span>
                        <p className="flex-1 text-gray-700">{text}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${text}\n${trackingUrl}`); toast("success", isKo ? "복사됨!" : "Copied!"); }}
                          className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          {isKo ? "복사" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* 3. Promotion Tips */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium text-gray-900">{isKo ? "홍보 팁" : "Promotion Tips"}</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {(isKo ? [
                  "인스타그램 스토리에 이미지 + 링크를 넣어보세요 (가장 높은 전환율)",
                  "블로그 리뷰 글에 크리에이티브와 레퍼럴 링크를 함께 포함하세요",
                  "유튜브 영상 설명란에 링크를 추가하세요",
                  "트위터/쓰레드에 사용 후기와 함께 이미지를 공유하세요",
                  "커뮤니티(디스코드, 슬랙)에서 자연스럽게 추천하세요",
                  creatives.length > 0 ? "위 광고 이미지를 활용하면 전환율이 최대 3배 높아집니다" : null,
                ] : [
                  "Post images + links on Instagram Stories (highest conversion rate)",
                  "Include creatives and referral links in blog review posts",
                  "Add your link in YouTube video descriptions",
                  "Share on Twitter/Threads with images and your experience",
                  "Naturally recommend in communities (Discord, Slack)",
                  creatives.length > 0 ? "Using the ad images above can increase conversion rates up to 3x" : null,
                ]).filter(Boolean).map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>

            {/* 4. Commission Info */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-medium text-amber-900">{isKo ? "커미션 안내" : "Commission Details"}</h3>
              <div className="mt-2 space-y-1.5 text-sm text-amber-800">
                <p>• {isKo ? "추천 링크를 통해 전환 시" : "Per conversion via referral link"}: <strong>{program.commissionValue}{program.commissionType === "percentage" ? "%" : "$"}</strong></p>
                <p>• {isKo ? "쿠키 유효기간" : "Cookie duration"}: <strong>{program.cookieDurationDays}{isKo ? "일" : " days"}</strong> {isKo ? `(클릭 후 ${program.cookieDurationDays}일 이내 전환 시 인정)` : `(conversion must happen within ${program.cookieDurationDays} days of click)`}</p>
                <p>• {isKo ? "최소 출금 금액" : "Minimum withdrawal"}: <strong>$10</strong></p>
                <p>• {isKo ? "정산 요청은 수익 페이지에서 가능합니다" : "Request payouts from the Earnings page"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
