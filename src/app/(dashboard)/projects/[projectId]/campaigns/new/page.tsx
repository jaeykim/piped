"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  ArrowRight,
  Megaphone,
  Target,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import type { CopyVariant } from "@/types/copy";
import type { Creative } from "@/types/creative";
import type { SiteAnalysis } from "@/types/analysis";

type Step = "platform" | "content" | "targeting" | "budget" | "review";

const steps: { id: Step; label: string }[] = [
  { id: "platform", label: "Platform" },
  { id: "content", label: "Content" },
  { id: "targeting", label: "Targeting" },
  { id: "budget", label: "Budget" },
  { id: "review", label: "Review" },
];

export default function NewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("platform");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [copyVariants, setCopyVariants] = useState<CopyVariant[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);

  // Campaign config
  const [platform, setPlatform] = useState<"meta" | "google" | "influencer">("meta");
  const [selectedCopy, setSelectedCopy] = useState<string>("");
  const [selectedCreative, setSelectedCreative] = useState<string>("");
  const [targeting, setTargeting] = useState({
    ageMin: 18,
    ageMax: 65,
    locations: "US",
    interests: "",
  });
  const [budget, setBudget] = useState({ amount: 20, type: "daily" as const });
  const [campaignName, setCampaignName] = useState("");

  // Influencer campaign config
  const [influencerGoal, setInfluencerGoal] = useState<"visits" | "signups" | "purchases">("signups");
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("fixed");
  const [commissionValue, setCommissionValue] = useState(5);
  const [cookieDays, setCookieDays] = useState(30);
  const [influencerBudget, setInfluencerBudget] = useState(500);

  useEffect(() => {
    async function load() {
      const [analysisSnap, copySnap, creativeSnap] = await Promise.all([
        getDoc(doc(getDb(), "projects", projectId, "analysis", "result")),
        getDocs(
          query(
            collection(getDb(), "projects", projectId, "copyVariants"),
            orderBy("createdAt", "desc")
          )
        ),
        getDocs(
          query(
            collection(getDb(), "projects", projectId, "creatives"),
            orderBy("createdAt", "desc")
          )
        ),
      ]);

      if (analysisSnap.exists()) {
        const data = analysisSnap.data() as SiteAnalysis;
        setAnalysis(data);
        setCampaignName(`${data.productName} - Campaign`);
      }

      setCopyVariants(
        copySnap.docs.map((d) => ({ id: d.id, ...d.data() }) as CopyVariant)
      );
      setCreatives(
        creativeSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Creative)
          .filter((c) => c.status === "ready")
      );
      setLoading(false);
    }
    load();
  }, [projectId]);

  const currentStepIndex = steps.findIndex((s) => s.id === step);
  const canNext = () => {
    return true; // all steps are optional — user can proceed freely
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();

      // Influencer campaign — create affiliate program
      if (platform === "influencer") {
        const res = await fetch("/api/affiliates/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            projectId,
            name: campaignName || `${analysis?.productName} 인플루언서 캠페인`,
            description: `${analysis?.productName} 제휴 프로그램 — ${influencerGoal === "visits" ? "방문" : influencerGoal === "signups" ? "가입" : "구매"}당 ${commissionValue}${commissionType === "percentage" ? "%" : "$"} 커미션`,
            commissionType,
            commissionValue,
            cookieDurationDays: cookieDays,
          }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        toast("success", "인플루언서 캠페인이 생성되었습니다!");
        router.push(`/projects/${projectId}/affiliates`);
        return;
      }

      const endpoint =
        platform === "meta"
          ? "/api/campaigns/meta/create"
          : "/api/campaigns/google/create";

      const copyData = copyVariants.find((c) => c.id === selectedCopy);
      const creativeData = creatives.find((c) => c.id === selectedCreative);

      const body: Record<string, unknown> = {
        projectId,
        name: campaignName,
        objective: "traffic",
        dailyBudget: budget.amount,
        targeting: {
          ageMin: targeting.ageMin,
          ageMax: targeting.ageMax,
          locations: targeting.locations.split(",").map((s) => s.trim()),
        },
      };

      if (platform === "meta") {
        let adData = { primaryText: "", headline: "", description: "" };
        try {
          adData = JSON.parse(copyData?.content || "{}");
        } catch {
          adData = {
            primaryText: copyData?.content || "",
            headline: analysis?.productName || "",
            description: "",
          };
        }
        body.creativeUrl = creativeData?.imageUrl;
        body.primaryText = adData.primaryText;
        body.headline = adData.headline;
        body.linkDescription = adData.description;
        body.destinationUrl = analysis?.metaTags?.ogTitle
          ? `https://${analysis.metaTags.ogTitle}`
          : "";
      } else {
        body.headlines = [
          analysis?.productName || "Try It Now",
          "Get Started Free",
          "Learn More",
        ];
        body.descriptions = [
          copyData?.content || analysis?.valueProposition || "",
          analysis?.valueProposition || "",
        ];
        body.finalUrl = analysis?.metaTags?.ogTitle || "";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast("success", "Campaign created successfully!");
      router.push(`/projects/${projectId}/campaigns`);
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Campaign creation failed"
      );
    } finally {
      setSubmitting(false);
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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                i < currentStepIndex
                  ? "bg-green-100 text-green-700"
                  : i === currentStepIndex
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < currentStepIndex ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm ${
                i === currentStepIndex
                  ? "font-medium text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="mx-3 h-px w-8 bg-gray-200" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="mt-6">
        <CardContent className="p-6">
          {step === "platform" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">캠페인 유형 선택</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  { id: "influencer" as const, name: "인플루언서 마케팅", desc: "성과가 나올 때만 비용 발생", icon: "🤝" },
                  { id: "meta" as const, name: "Meta Ads", desc: "Facebook & Instagram 광고", icon: "📱" },
                  { id: "google" as const, name: "Google Ads", desc: "검색 & 디스플레이 광고", icon: "🔍" },
                ]).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      platform === p.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <p className="mt-2 font-medium">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "content" && platform === "influencer" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">성과 목표 & 커미션 설정</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">성과 목표</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    { id: "visits" as const, label: "방문", desc: "링크 클릭당 커미션", icon: "👀", recType: "fixed" as const, recValue: 0.5 },
                    { id: "signups" as const, label: "가입", desc: "회원가입당 커미션", icon: "✍️", recType: "fixed" as const, recValue: 5 },
                    { id: "purchases" as const, label: "구매", desc: "구매 전환당 커미션", icon: "💰", recType: "percentage" as const, recValue: 15 },
                  ]).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setInfluencerGoal(g.id);
                        setCommissionType(g.recType);
                        setCommissionValue(g.recValue);
                      }}
                      className={`rounded-lg border-2 p-3 text-left transition-all ${
                        influencerGoal === g.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200"
                      }`}
                    >
                      <span className="text-lg">{g.icon}</span>
                      <p className="mt-1 text-sm font-medium">{g.label}</p>
                      <p className="text-xs text-gray-500">{g.desc}</p>
                      <p className="mt-1 text-[10px] text-indigo-600">추천: {g.recValue}{g.recType === "percentage" ? "%" : "$"}/건</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">커미션 유형</label>
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as "percentage" | "fixed")}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="fixed">고정 금액 ($)</option>
                    <option value="percentage">비율 (%)</option>
                  </select>
                </div>
                <Input
                  label={`커미션 (${commissionType === "percentage" ? "%" : "$"})`}
                  type="number"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(+e.target.value)}
                />
              </div>

              <Input
                label="쿠키 유효 기간 (일)"
                type="number"
                value={cookieDays}
                onChange={(e) => setCookieDays(+e.target.value)}
              />

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>예상 비용:</strong> 인플루언서가 월 100건 {influencerGoal === "visits" ? "클릭" : influencerGoal === "signups" ? "가입" : "구매"}을 달성하면{" "}
                  <strong>${commissionType === "fixed" ? commissionValue * 100 : "매출의 " + commissionValue + "%"}</strong>
                </p>
              </div>

              {/* Setup guidance */}
              {influencerGoal !== "visits" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <h3 className="text-sm font-bold text-amber-900">
                    {influencerGoal === "signups" ? "가입 추적 설정 안내" : "구매 추적 설정 안내"}
                  </h3>
                  {influencerGoal === "signups" ? (
                    <div className="text-xs text-amber-800 space-y-1">
                      <p>✅ <strong>자동 추적됨:</strong> Piped를 통해 가입한 유저는 레퍼럴 쿠키로 자동 추적됩니다.</p>
                      <p>📌 <strong>외부 서비스 가입 추적:</strong> 가입 완료 페이지에 아래 코드를 추가하세요:</p>
                      <code className="block bg-white rounded p-2 text-[10px] mt-1">
                        {`fetch("${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/convert", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ eventType: "signup" }) })`}
                      </code>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-800 space-y-1">
                      <p>✅ <strong>Piped 크레딧 구매:</strong> 자동으로 추적됩니다.</p>
                      <p>📌 <strong>외부 결제 추적:</strong> 결제 완료 시 아래 코드를 호출하세요:</p>
                      <code className="block bg-white rounded p-2 text-[10px] mt-1">
                        {`fetch("${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/convert", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ conversionValue: 결제금액, eventType: "purchase" }) })`}
                      </code>
                      <p>💡 레퍼럴 쿠키 (piped_ref)가 자동으로 읽혀서 인플루언서에게 커미션이 지급됩니다.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "content" && platform !== "influencer" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Select Ad Copy</h2>
                {copyVariants.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">생성된 카피가 없습니다. 먼저 Copy 단계에서 문구를 생성하세요.</p>
                ) : null}
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {copyVariants
                    .filter((c) =>
                      platform === "meta"
                        ? c.type === "ad_meta" || c.type === "headline" || c.type === "description_short"
                        : c.type === "ad_google" || c.type === "headline" || c.type === "description_short"
                    )
                    .map((c) => (
                      <label
                        key={c.id}
                        className={`block cursor-pointer rounded-lg border p-3 text-sm ${
                          selectedCopy === c.id
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="copy"
                          value={c.id}
                          checked={selectedCopy === c.id}
                          onChange={() => setSelectedCopy(c.id)}
                          className="sr-only"
                        />
                        {c.content.length < 200
                          ? c.content
                          : c.content.slice(0, 200) + "..."}
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Select Creative</h2>
                {creatives.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">생성된 크리에이티브가 없습니다. 먼저 Ad Creatives에서 이미지를 생성하세요.</p>
                ) : (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {creatives.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCreative(c.id)}
                      className={`overflow-hidden rounded-lg border-2 ${
                        selectedCreative === c.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="aspect-square flex items-center justify-center bg-gray-50 p-2">
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-700">{c.platform}</p>
                          <p className="text-[10px] text-gray-400">{c.size}</p>
                          {selectedCreative === c.id && (
                            <p className="mt-1 text-[10px] font-bold text-indigo-600">선택됨</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                )}
              </div>
            </div>
          )}

          {step === "targeting" && platform === "influencer" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">인플루언서 캠페인 예산</h2>
              <Input
                label="총 예산 (USD)"
                type="number"
                value={influencerBudget}
                onChange={(e) => setInfluencerBudget(+e.target.value)}
              />
              <p className="text-sm text-gray-500">
                예산 소진 시 캠페인이 자동 중지됩니다. 예상 {influencerGoal === "visits" ? "클릭" : influencerGoal === "signups" ? "가입" : "구매"} 수:{" "}
                <strong>{commissionType === "fixed" ? Math.floor(influencerBudget / commissionValue) : "매출 기반"}건</strong>
              </p>

              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">추적 지표</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>✓ 레퍼럴 클릭 수</span>
                  <span>✓ 고유 방문자 수</span>
                  <span>✓ 회원가입 전환</span>
                  <span>✓ 구매 전환</span>
                  <span>✓ 전환율 (CVR)</span>
                  <span>✓ 인플루언서별 성과</span>
                  <span>✓ 커미션 지급 현황</span>
                  <span>✓ ROI (투자 대비 수익)</span>
                </div>
              </div>
            </div>
          )}

          {step === "targeting" && platform !== "influencer" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Targeting
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Min Age"
                  type="number"
                  value={targeting.ageMin}
                  onChange={(e) =>
                    setTargeting({ ...targeting, ageMin: +e.target.value })
                  }
                />
                <Input
                  label="Max Age"
                  type="number"
                  value={targeting.ageMax}
                  onChange={(e) =>
                    setTargeting({ ...targeting, ageMax: +e.target.value })
                  }
                />
              </div>
              <Input
                label="Locations (comma-separated country codes)"
                value={targeting.locations}
                onChange={(e) =>
                  setTargeting({ ...targeting, locations: e.target.value })
                }
                placeholder="US, GB, CA"
              />
              <Input
                label="Interests (optional)"
                value={targeting.interests}
                onChange={(e) =>
                  setTargeting({ ...targeting, interests: e.target.value })
                }
                placeholder="Technology, Startups, SaaS"
              />
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget
              </h2>
              <Input
                label="Campaign Name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
              <Input
                label="Daily Budget (USD)"
                type="number"
                value={budget.amount}
                onChange={(e) =>
                  setBudget({ ...budget, amount: +e.target.value })
                }
              />
              <p className="text-sm text-gray-500">
                Estimated monthly spend: ${(budget.amount * 30).toLocaleString()}
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">캠페인 확인</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">유형</span>
                  <span className="font-medium">
                    {platform === "meta" ? "Meta Ads" : platform === "google" ? "Google Ads" : "인플루언서 마케팅"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">캠페인명</span>
                  <span className="font-medium">{campaignName}</span>
                </div>
                {platform === "influencer" ? (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">성과 목표</span>
                      <span className="font-medium">{influencerGoal === "visits" ? "방문" : influencerGoal === "signups" ? "가입" : "구매"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">커미션</span>
                      <span className="font-medium">{commissionValue}{commissionType === "percentage" ? "%" : "$"} / 건</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">쿠키 기간</span>
                      <span className="font-medium">{cookieDays}일</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">총 예산</span>
                      <span className="font-medium">${influencerBudget}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">상태</span>
                      <span className="font-medium text-green-600">제휴 프로그램 자동 생성</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">일일 예산</span>
                      <span className="font-medium">${budget.amount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">타겟</span>
                      <span className="font-medium">Ages {targeting.ageMin}-{targeting.ageMax}, {targeting.locations}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">상태</span>
                      <span className="font-medium text-yellow-600">PAUSED로 생성</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-4 flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const prev = steps[currentStepIndex - 1];
            if (prev) setStep(prev.id);
            else router.back();
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step === "review" ? (
          <Button onClick={handleSubmit} loading={submitting}>
            <Megaphone className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        ) : (
          <Button
            onClick={() => {
              const next = steps[currentStepIndex + 1];
              if (next) setStep(next.id);
            }}
            disabled={!canNext()}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
