"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
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
} from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.programId as string;
  const { profile, activeRole } = useAuth();
  const { toast } = useToast();

  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(getDb(), "affiliatePrograms", programId));
      if (snap.exists()) {
        setProgram({ id: snap.id, ...snap.data() } as AffiliateProgram);
      }
      setLoading(false);
    }
    load();
  }, [programId]);

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
              disabled={activeRole !== "influencer"}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              {activeRole === "influencer"
                ? "Join Program"
                : "Influencer 모드로 전환하여 참여하세요"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Promotion Guide */}
      {affiliateCode && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">홍보 가이드</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-indigo-50 p-4">
              <h3 className="font-medium text-indigo-900">추천 홍보 문구</h3>
              <div className="mt-2 space-y-2">
                {[
                  `${program.name} 사용해봤는데 진짜 좋아요! 이 링크로 가입하면 특별 혜택을 받을 수 있어요 👉`,
                  `마케팅 자동화가 필요하다면 ${program.name} 강추! URL만 넣으면 광고가 뚝딱 👇`,
                  `요즘 사이드 프로젝트 마케팅은 AI한테 맡기는 시대. ${program.name}으로 3분 만에 광고 세팅 완료 🚀`,
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 rounded bg-white p-3 text-sm">
                    <span className="shrink-0 text-indigo-500">{i + 1}.</span>
                    <p className="flex-1 text-gray-700">{text}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${text}\n${trackingUrl}`); toast("success", "복사됨!"); }}
                      className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      복사
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium text-gray-900">홍보 팁</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• 인스타그램 스토리에 링크를 넣어보세요 (가장 높은 전환율)</li>
                <li>• 블로그 리뷰 글에 레퍼럴 링크를 포함하세요</li>
                <li>• 유튜브 영상 설명란에 링크를 추가하세요</li>
                <li>• 트위터/쓰레드에 사용 후기와 함께 공유하세요</li>
                <li>• 커뮤니티(디스코드, 슬랙)에서 자연스럽게 추천하세요</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-medium text-amber-900">커미션 안내</h3>
              <p className="mt-1 text-sm text-amber-800">
                • 추천 링크를 통해 가입한 유저가 결제하면 {program.commissionValue}{program.commissionType === "percentage" ? "%" : "$"}의 커미션을 받습니다
                <br />• 쿠키 유효기간: {program.cookieDurationDays}일 (클릭 후 {program.cookieDurationDays}일 이내 전환 시 인정)
                <br />• 최소 출금 금액: $10
                <br />• 정산 요청은 수익 페이지에서 가능합니다
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
