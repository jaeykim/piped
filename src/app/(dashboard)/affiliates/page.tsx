"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Users, DollarSign, Clock, ArrowRight, Zap, Share2, BarChart3, Crown } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import type { AffiliateProgram } from "@/types/affiliate";

export default function BrowseProgramsPage() {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { locale } = useLocale();
  const isKo = locale.startsWith("ko");

  useEffect(() => {
    async function load() {
      // Seed demo programs (also fixes ownerId on existing demos)
      try {
        const token = await getAuth_().currentUser?.getIdToken();
        if (token) {
          await fetch("/api/affiliates/seed", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch { /* silent */ }

      // Load programs
      const q = query(
        collection(getDb(), "affiliatePrograms"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setPrograms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AffiliateProgram));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">제휴 프로그램</h1>
      <p className="mt-1 text-sm text-gray-500">제품을 홍보하고 커미션을 받으세요</p>

      {/* How it works — onboarding guide */}
      <Card className="mt-6 border-indigo-200 bg-indigo-50/50">
        <CardContent className="py-5">
          <h2 className="text-sm font-bold text-indigo-900">이렇게 돈을 벌어요</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">1</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">프로그램 참여</p>
                <p className="text-xs text-gray-500">아래에서 원하는 프로그램을 선택하고 참여하세요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">2</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">레퍼럴 링크 공유</p>
                <p className="text-xs text-gray-500">나만의 추적 링크를 SNS, 블로그, 커뮤니티에 공유</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">3</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">커미션 수령</p>
                <p className="text-xs text-gray-500">링크를 통해 가입/구매가 발생하면 자동으로 수익 적립</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program list */}
      <div className="mt-6 space-y-4">
        {programs.map((program) => {
          // Daily budget: own programs show real 0 until launched, demo programs show demo data
          const isMine = program.ownerId === profile?.uid;
          const demoDailyBudgets: Record<string, { dailyLimit: number; todaySpent: number }> = {
            "demo-piped": { dailyLimit: 25, todaySpent: 18 },
            "demo-glowbook": { dailyLimit: 40, todaySpent: 32 },
            "demo-coderunner": { dailyLimit: 15, todaySpent: 3 },
          };
          const dailyBudget = isMine
            ? { dailyLimit: 0, todaySpent: 0 }
            : (demoDailyBudgets[program.projectId] || { dailyLimit: 20, todaySpent: 0 });
          const { dailyLimit, todaySpent } = dailyBudget;
          const burnPercent = dailyLimit > 0 ? Math.round((todaySpent / dailyLimit) * 100) : 0;
          return (
          <Link key={program.id} href={program.ownerId === profile?.uid ? `/projects/${program.projectId}/affiliates` : `/affiliates/${program.id}`}>
            <Card className={`transition-all hover:shadow-md ${program.ownerId === profile?.uid ? "border-indigo-300 bg-indigo-50/30 hover:border-indigo-400" : "hover:border-indigo-200"}`}>
              <CardContent className="py-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{program.name}</h3>
                      {program.ownerId === profile?.uid ? (
                        <Badge variant="info"><Crown className="mr-1 h-3 w-3 inline" />내 프로그램</Badge>
                      ) : (
                        <Badge variant="success">참여 가능</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{program.description}</p>

                    {/* Earning simulation */}
                    <div className="mt-3 rounded-lg bg-green-50 p-3">
                      <p className="text-xs font-medium text-green-800">
                        <Zap className="mr-1 inline h-3 w-3" />
                        예상 수익: 월 100명 추천 시{" "}
                        <span className="font-bold">
                          {program.commissionType === "percentage"
                            ? `약 $${(100 * 30 * program.commissionValue / 100).toFixed(0)}`
                            : `$${(100 * program.commissionValue).toFixed(0)}`
                          }/월
                        </span>
                      </p>
                    </div>

                    {/* Daily budget burn rate */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{isKo ? "오늘 예산 소진율" : "Today's Budget Burn"}</span>
                        {dailyLimit > 0 ? (
                          <span className="font-semibold text-gray-700">{burnPercent}%</span>
                        ) : (
                          <span className="text-gray-400">{isKo ? "미설정" : "Not set"}</span>
                        )}
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${burnPercent > 80 ? "bg-red-500" : burnPercent > 50 ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(burnPercent, 100)}%` }}
                        />
                      </div>
                      {dailyLimit > 0 ? (
                        <p className="mt-1 text-[10px] text-gray-400">
                          {isKo
                            ? `오늘 $${todaySpent} / $${dailyLimit} 사용 · 자정에 초기화`
                            : `Today $${todaySpent} / $${dailyLimit} spent · Resets at midnight`}
                        </p>
                      ) : (
                        <p className="mt-1 text-[10px] text-gray-400">
                          {isKo ? "캠페인 시작 후 일일 예산이 표시됩니다" : "Daily budget will show after campaign launch"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex shrink-0 flex-col items-end gap-2">
                    <div className="rounded-xl bg-green-100 px-4 py-2 text-center">
                      <p className="text-xl font-bold text-green-700">
                        {program.commissionValue}{program.commissionType === "percentage" ? "%" : "$"}
                      </p>
                      <p className="text-[10px] text-green-600">커미션</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{program.cookieDurationDays}일</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{program.totalAffiliates}명</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center text-xs font-medium text-indigo-600">
                  {program.ownerId === profile?.uid ? "프로그램 관리하기" : "참여하고 레퍼럴 링크 받기"} <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
