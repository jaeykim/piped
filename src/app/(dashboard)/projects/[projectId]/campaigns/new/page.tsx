"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardCopy, Check as CheckIcon } from "lucide-react";
import { getAuth_ } from "@/lib/firebase/client";
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
import { useLocale } from "@/context/locale-context";
import { useAuth } from "@/context/auth-context";
import type { SiteAnalysis } from "@/types/analysis";

type Step = "content" | "targeting" | "budget" | "review";

export default function NewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const { t, locale } = useLocale();
  const { profile } = useAuth();
  const credits = profile?.credits ?? 0;

  const steps: { id: Step; label: string }[] = [
    { id: "content", label: t.campaigns.content },
    { id: "targeting", label: t.campaigns.targeting },
    { id: "budget", label: t.campaigns.budget },
    { id: "review", label: t.campaigns.review },
  ];

  const [step, setStep] = useState<Step>("content");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isKo = locale.startsWith("ko");

  const copyToClipboard = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);
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
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [dailyBudget, setDailyBudget] = useState(15);
  const [budgetMode, setBudgetMode] = useState<"fixed" | "flexible">("fixed");
  const [targetRoas, setTargetRoas] = useState<number>(3);
  const [optimizationEnabled, setOptimizationEnabled] = useState<boolean>(true);
  const [campaignName, setCampaignName] = useState("");
  const [adBalance, setAdBalance] = useState<{ connected: boolean; balance: number | null; amountSpent: number | null; currency?: string; loading: boolean }>({ connected: false, balance: null, amountSpent: null, loading: false });

  // AI-recommended daily budget range (rounded to $5 increments)
  const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
  const recMin = round5(monthlyBudget / 30 * 0.5);
  const recMax = round5(monthlyBudget / 30 * 1.2);
  const recOptimal = round5(monthlyBudget / 30 * 0.8);
  const dailyLimit = Math.floor(monthlyBudget / 30);

  // Influencer campaign config
  const [influencerGoal, setInfluencerGoal] = useState<"visits" | "signups" | "purchases">("signups");
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("fixed");
  const [commissionValue, setCommissionValue] = useState(5);
  const [cookieDays, setCookieDays] = useState(30);
  const [influencerBudget, setInfluencerBudget] = useState(500);

  useEffect(() => {
    async function load() {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(
        `/api/projects/${projectId}?include=analysis,copy,creatives`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const { project } = await res.json();

      if (project?.campaignType) {
        setPlatform(project.campaignType as "meta" | "google" | "influencer");
      }
      if (project?.analysis) {
        const a = project.analysis;
        const data: SiteAnalysis = {
          extractedText: a.extractedText,
          metaTags: {
            title: a.metaTitle,
            description: a.metaDescription,
            ogImage: a.ogImage ?? undefined,
            ogTitle: a.ogTitle ?? undefined,
            ogDescription: a.ogDescription ?? undefined,
            keywords: a.keywords ?? undefined,
          },
          productName: a.productName,
          valueProposition: a.valueProposition,
          targetAudience: a.targetAudience,
          keyFeatures: a.keyFeatures,
          tone: a.tone,
          industry: a.industry,
          brandColors: a.brandColors,
          logoUrl: a.logoUrl ?? undefined,
          screenshots: a.screenshots,
          analyzedAt: new Date(a.analyzedAt),
        };
        setAnalysis(data);
        setCampaignName(`${data.productName} - Campaign`);
      }
      setCopyVariants((project?.copyVariants ?? []) as CopyVariant[]);
      setCreatives(
        ((project?.creatives ?? []) as Creative[]).filter(
          (c) => c.status === "ready"
        )
      );
      setLoading(false);
    }
    load();
  }, [projectId]);

  // Fetch ad platform balance when entering budget step
  useEffect(() => {
    if (step !== "budget" || platform === "influencer") return;
    async function fetchBalance() {
      setAdBalance((prev) => ({ ...prev, loading: true }));
      try {
        const token = await getAuth_().currentUser?.getIdToken();
        const res = await fetch(`/api/campaigns/balance?platform=${platform}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAdBalance({ connected: data.connected, balance: data.balance, amountSpent: data.amountSpent, currency: data.currency, loading: false });
        } else {
          setAdBalance((prev) => ({ ...prev, loading: false }));
        }
      } catch {
        setAdBalance((prev) => ({ ...prev, loading: false }));
      }
    }
    fetchBalance();
  }, [step, platform]);

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
        toast("success", t.campaigns.influencerCreated);
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
        dailyBudget: dailyBudget,
        targeting: {
          ageMin: targeting.ageMin,
          ageMax: targeting.ageMax,
          locations: targeting.locations.split(",").map((s) => s.trim()),
        },
      };

      if (platform === "meta") {
        body.targetRoas = targetRoas;
        body.optimizationEnabled = optimizationEnabled;
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

      toast("success", t.campaigns.created);
      router.push(`/projects/${projectId}/campaigns`);
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : t.campaigns.creationFailed
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
      <h1 className="text-2xl font-bold text-gray-900">{t.campaigns.createCampaign}</h1>

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
          {step === "content" && platform === "influencer" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">{t.campaigns.goalAndCommission}</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.campaigns.goalLabel}</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    { id: "visits" as const, label: t.campaigns.visits, desc: t.campaigns.visitsDesc, icon: "👀", recType: "fixed" as const, recValue: 0.5 },
                    { id: "signups" as const, label: t.campaigns.signups, desc: t.campaigns.signupsDesc, icon: "✍️", recType: "fixed" as const, recValue: 5 },
                    { id: "purchases" as const, label: t.campaigns.purchases, desc: t.campaigns.purchasesDesc, icon: "💰", recType: "percentage" as const, recValue: 15 },
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
                      <p className="mt-1 text-[10px] text-indigo-600">{t.campaigns.recommended}: {g.recValue}{g.recType === "percentage" ? "%" : "$"}/건</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.campaigns.commissionType}</label>
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as "percentage" | "fixed")}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="fixed">{t.campaigns.fixedAmount}</option>
                    <option value="percentage">{t.campaigns.percentage}</option>
                  </select>
                </div>
                <Input
                  label={`커미션 (${commissionType === "percentage" ? "%" : "$"})`}
                  type="number"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(+e.target.value)}
                />
              </div>

              <div>
                <Input
                  label={t.campaigns.cookieDuration}
                  type="number"
                  value={cookieDays}
                  onChange={(e) => setCookieDays(+e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {locale.startsWith("ko")
                    ? "유저가 레퍼럴 링크를 클릭한 후, 이 기간 내에 전환(가입/구매)이 발생하면 해당 인플루언서에게 커미션이 지급됩니다."
                    : "If a conversion (signup/purchase) happens within this period after a user clicks the referral link, the influencer earns the commission."}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>{t.campaigns.estimatedCost}:</strong> 인플루언서가 월 100건 {influencerGoal === "visits" ? "클릭" : influencerGoal === "signups" ? "가입" : "구매"}을 달성하면{" "}
                  <strong>${commissionType === "fixed" ? commissionValue * 100 : "매출의 " + commissionValue + "%"}</strong>
                </p>
              </div>

              {/* Setup guidance */}
              {influencerGoal !== "visits" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <h3 className="text-sm font-bold text-amber-900">
                    {influencerGoal === "signups" ? t.campaigns.signupTrackingGuide : t.campaigns.purchaseTrackingGuide}
                  </h3>
                  {influencerGoal === "signups" ? (
                    <div className="text-xs text-amber-800 space-y-1">
                      <p>✅ <strong>{t.campaigns.autoTracked}</strong></p>
                      <p>📌 <strong>{t.campaigns.externalSignupTracking}</strong></p>
                      <button
                        onClick={() => copyToClipboard("signup-api", `fetch("${window.location.origin}/api/affiliates/convert", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ eventType: "signup" }) })`)}
                        className="w-full text-left mt-1 group/copy relative"
                      >
                        <code className="block bg-white rounded p-2 text-[10px] hover:bg-gray-50 transition-colors cursor-pointer">
                          {`fetch("${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/convert", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ eventType: "signup" }) })`}
                        </code>
                        <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[9px] text-gray-400">
                          {copiedId === "signup-api" ? <><CheckIcon className="h-3 w-3 text-green-500" />{isKo ? "복사됨" : "Copied"}</> : <><ClipboardCopy className="h-3 w-3" />{isKo ? "클릭하여 복사" : "Click to copy"}</>}
                        </span>
                      </button>
                      <div className="mt-2 border-t border-amber-200 pt-2">
                        <p className="text-xs font-bold text-amber-900">💻 {t.campaigns.claudeCodeGuide}</p>
                        <p className="text-xs text-amber-800 mt-1">{t.campaigns.claudeCodeTrackingDesc}</p>
                        <button
                          onClick={() => copyToClipboard("signup-claude", `회원가입 완료 시 ${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/convert 로 POST 요청을 보내는 코드를 추가해줘.\nbody: { eventType: 'signup' }\n쿠키에서 piped_ref 값을 읽어서 헤더나 body에 포함해야 해.`)}
                          className="w-full text-left mt-1 relative"
                        >
                          <code className="block bg-white rounded p-2 text-[10px] text-gray-700 whitespace-pre-wrap hover:bg-gray-50 transition-colors cursor-pointer">
                            {`"회원가입 완료 시 ${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/convert 로 POST 요청을 보내는 코드를 추가해줘.\nbody: { eventType: 'signup' }\n쿠키에서 piped_ref 값을 읽어서 헤더나 body에 포함해야 해."`}
                          </code>
                          <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[9px] text-gray-400">
                            {copiedId === "signup-claude" ? <><CheckIcon className="h-3 w-3 text-green-500" />{isKo ? "복사됨" : "Copied"}</> : <><ClipboardCopy className="h-3 w-3" />{isKo ? "클릭하여 복사" : "Click to copy"}</>}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-800 space-y-1">
                      <p>✅ <strong>{t.campaigns.autoTracked}</strong></p>
                      <p>📌 <strong>{t.campaigns.externalPurchaseTracking}</strong></p>
                      <button
                        onClick={() => copyToClipboard("purchase-api", `fetch("${window.location.origin}/api/affiliates/convert", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ conversionValue: 결제금액, eventType: "purchase" }) })`)}
                        className="w-full text-left mt-1 relative"
                      >
                        <code className="block bg-white rounded p-2 text-[10px] hover:bg-gray-50 transition-colors cursor-pointer">
                          {`fetch("${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/convert", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ conversionValue: 결제금액, eventType: "purchase" }) })`}
                        </code>
                        <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[9px] text-gray-400">
                          {copiedId === "purchase-api" ? <><CheckIcon className="h-3 w-3 text-green-500" />{isKo ? "복사됨" : "Copied"}</> : <><ClipboardCopy className="h-3 w-3" />{isKo ? "클릭하여 복사" : "Click to copy"}</>}
                        </span>
                      </button>
                      <p>💡 {t.campaigns.cookieAutoRead}</p>
                      <div className="mt-2 border-t border-amber-200 pt-2">
                        <p className="text-xs font-bold text-amber-900">💻 {t.campaigns.claudeCodeGuide}</p>
                        <p className="text-xs text-amber-800 mt-1">{t.campaigns.claudeCodeTrackingDesc}</p>
                        <button
                          onClick={() => copyToClipboard("purchase-claude", `결제 완료 시 ${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/convert 로 POST 요청을 보내는 코드를 추가해줘.\nbody: { conversionValue: 결제금액, eventType: 'purchase' }\n쿠키에서 piped_ref 값을 읽어서 헤더나 body에 포함해야 해.`)}
                          className="w-full text-left mt-1 relative"
                        >
                          <code className="block bg-white rounded p-2 text-[10px] text-gray-700 whitespace-pre-wrap hover:bg-gray-50 transition-colors cursor-pointer">
                            {`"결제 완료 시 ${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/convert 로 POST 요청을 보내는 코드를 추가해줘.\nbody: { conversionValue: 결제금액, eventType: 'purchase' }\n쿠키에서 piped_ref 값을 읽어서 헤더나 body에 포함해야 해."`}
                          </code>
                          <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[9px] text-gray-400">
                            {copiedId === "purchase-claude" ? <><CheckIcon className="h-3 w-3 text-green-500" />{isKo ? "복사됨" : "Copied"}</> : <><ClipboardCopy className="h-3 w-3" />{isKo ? "클릭하여 복사" : "Click to copy"}</>}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "content" && platform !== "influencer" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t.campaigns.selectAdCopy}</h2>
                {copyVariants.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">{t.campaigns.noCopy}</p>
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
                <h2 className="text-lg font-semibold">{t.campaigns.selectCreative}</h2>
                {creatives.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">{t.campaigns.noCreative}</p>
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
                            <p className="mt-1 text-[10px] font-bold text-indigo-600">{t.campaigns.selected}</p>
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
              <h2 className="text-lg font-semibold">{t.campaigns.influencerBudget}</h2>
              <Input
                label={t.campaigns.totalBudget}
                type="number"
                value={influencerBudget}
                onChange={(e) => setInfluencerBudget(+e.target.value)}
              />
              {influencerBudget > credits && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <div className="text-xs text-red-700">
                    <p className="font-semibold">
                      {isKo ? "크레딧이 부족합니다" : "Not enough credits"}
                    </p>
                    <p className="mt-0.5">
                      {isKo
                        ? `현재 보유 크레딧: ${credits}. 예산을 줄이거나 크레딧을 충전해주세요.`
                        : `Current balance: ${credits} credits. Reduce the budget or top up your credits.`}
                    </p>
                    <Link href="/settings" className="inline-block mt-1.5 text-xs font-semibold text-red-800 underline hover:text-red-900">
                      {isKo ? "크레딧 충전하기 →" : "Buy Credits →"}
                    </Link>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {t.campaigns.budgetExhausted} {isKo ? "예상" : "Est."} {influencerGoal === "visits" ? (isKo ? "클릭" : "clicks") : influencerGoal === "signups" ? (isKo ? "가입" : "signups") : (isKo ? "구매" : "purchases")}:{" "}
                <strong>{commissionType === "fixed" ? Math.floor(influencerBudget / commissionValue) : (isKo ? "매출 기반" : "revenue-based")}{isKo ? "건" : ""}</strong>
              </p>

              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">{t.campaigns.trackingMetrics}</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>✓ {t.campaigns.referralClicks}</span>
                  <span>✓ {t.campaigns.uniqueVisitors}</span>
                  <span>✓ {t.campaigns.signupConversions}</span>
                  <span>✓ {t.campaigns.purchaseConversions}</span>
                  <span>✓ {t.campaigns.conversionRate}</span>
                  <span>✓ {t.campaigns.performanceByInfluencer}</span>
                  <span>✓ {t.campaigns.commissionStatus}</span>
                  <span>✓ {t.campaigns.roi}</span>
                </div>
              </div>
            </div>
          )}

          {step === "targeting" && platform !== "influencer" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t.campaigns.targeting}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t.campaigns.minAge}
                  type="number"
                  value={targeting.ageMin}
                  onChange={(e) =>
                    setTargeting({ ...targeting, ageMin: +e.target.value })
                  }
                />
                <Input
                  label={t.campaigns.maxAge}
                  type="number"
                  value={targeting.ageMax}
                  onChange={(e) =>
                    setTargeting({ ...targeting, ageMax: +e.target.value })
                  }
                />
              </div>
              <Input
                label={t.campaigns.locations}
                value={targeting.locations}
                onChange={(e) =>
                  setTargeting({ ...targeting, locations: e.target.value })
                }
                placeholder="US, GB, CA"
              />
              <Input
                label={t.campaigns.interests}
                value={targeting.interests}
                onChange={(e) =>
                  setTargeting({ ...targeting, interests: e.target.value })
                }
                placeholder="Technology, Startups, SaaS"
              />
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t.campaigns.budget}
              </h2>

              <Input
                label={t.campaigns.campaignName}
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />

              {platform === "influencer" && (
              <>
                {/* Influencer Daily Budget — step by commission value */}
                {(() => {
                  const stepVal = commissionType === "fixed" ? Math.max(1, commissionValue) : 5;
                  const maxDaily = Math.max(stepVal, Math.floor(influencerBudget / 30 / stepVal) * stepVal);
                  const infRecMin = Math.min(Math.max(stepVal, Math.round(maxDaily * 0.4 / stepVal) * stepVal), maxDaily);
                  const infRecOpt = Math.min(Math.max(stepVal, Math.round(maxDaily * 0.65 / stepVal) * stepVal), maxDaily);
                  const infRecMax = maxDaily;
                  return (
                  <>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🤖</span>
                      <p className="text-sm font-semibold text-indigo-900">
                        {isKo ? "AI 추천 일일 예산" : "AI Recommended Daily Budget"}
                      </p>
                    </div>
                    <p className="text-xs text-indigo-700">
                      {isKo
                        ? `건당 $${commissionValue} 커미션 기준, 하루 ${Math.floor(infRecOpt / stepVal)}건 전환을 목표로 $${infRecOpt}을 추천합니다.`
                        : `At $${commissionValue}/conversion, we recommend $${infRecOpt}/day targeting ~${Math.floor(infRecOpt / stepVal)} conversions.`}
                    </p>
                    <div className="flex gap-2">
                      {[
                        { v: infRecMin, label: isKo ? "절약형" : "Conservative", conv: Math.floor(infRecMin / stepVal) },
                        { v: infRecOpt, label: isKo ? "추천" : "Recommended", conv: Math.floor(infRecOpt / stepVal) },
                        { v: infRecMax, label: isKo ? "공격형" : "Aggressive", conv: Math.floor(infRecMax / stepVal) },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          onClick={() => setDailyBudget(opt.v)}
                          className={`flex-1 rounded-lg border-2 px-2 py-2 text-center transition-all ${
                            dailyBudget === opt.v ? "border-indigo-500 bg-white" : "border-transparent bg-white/60 hover:bg-white"
                          }`}
                        >
                          <p className="text-lg font-bold text-gray-900">${opt.v}</p>
                          <p className="text-[10px] text-gray-500">{opt.label} · {opt.conv}{isKo ? "건/일" : "/day"}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700">
                        {isKo ? "일일 예산 집행 한도" : "Daily Spending Limit"}
                      </label>
                      <span className="text-xs text-gray-400">
                        {isKo ? `$${stepVal} 단위 · 최대 $${maxDaily}/일` : `$${stepVal} steps · Max $${maxDaily}/day`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={stepVal}
                      max={Math.max(stepVal, maxDaily)}
                      step={stepVal}
                      value={Math.min(dailyBudget, maxDaily)}
                      onChange={(e) => setDailyBudget(+e.target.value)}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">${stepVal}</span>
                      <div className="text-center">
                        <span className="text-lg font-bold text-indigo-600">${dailyBudget}</span>
                        <span className="text-xs text-gray-500 ml-1">({Math.floor(dailyBudget / stepVal)}{isKo ? "건/일" : "/day"})</span>
                      </div>
                      <span className="text-xs text-gray-400">${maxDaily}</span>
                    </div>
                  </div>

                  {dailyBudget > 0 && (
                  <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>{isKo ? "총 예산" : "Total Budget"}</span>
                      <span className="font-semibold text-gray-900">${influencerBudget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{isKo ? "일일 한도" : "Daily Limit"}</span>
                      <span className="font-semibold text-gray-900">${dailyBudget} ({Math.floor(dailyBudget / stepVal)}{isKo ? "건" : " conv."})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{isKo ? "예상 소진 기간" : "Est. Duration"}</span>
                      <span className="font-semibold text-gray-900">{Math.floor(influencerBudget / dailyBudget)}{isKo ? "일" : " days"}</span>
                    </div>
                  </div>
                  )}
                  </>
                  );
                })()}
              </>
              )}

              {platform !== "influencer" && (
              <>
              {/* Platform billing notice */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-800">
                  {isKo
                    ? `💡 아래 예산은 ${platform === "meta" ? "Meta Ads" : "Google Ads"} 계정에서 직접 과금됩니다. Piped 크레딧과는 별개이며, 해당 플랫폼에 결제 수단이 등록되어 있어야 합니다.`
                    : `💡 The budget below will be charged directly to your ${platform === "meta" ? "Meta Ads" : "Google Ads"} account. This is separate from Piped credits — ensure you have a payment method set up on the platform.`}
                </p>
              </div>

              {/* Ad platform balance */}
              {adBalance.loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="h-3 w-3 rounded-full border-2 border-gray-300 border-t-indigo-500 animate-spin" />
                  {isKo ? "광고 계정 잔액 조회중..." : "Checking ad account balance..."}
                </div>
              ) : adBalance.connected && adBalance.balance !== null ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">{platform === "meta" ? "📱" : "🔍"}</span>
                    <div>
                      <p className="text-xs font-semibold text-green-900">
                        {platform === "meta" ? "Meta Ads" : "Google Ads"} {isKo ? "계정 잔액" : "Account Balance"}
                      </p>
                      {adBalance.amountSpent !== null && (
                        <p className="text-[10px] text-green-700">
                          {isKo ? "총 지출" : "Total spent"}: ${adBalance.amountSpent.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-lg font-bold text-green-700">${adBalance.balance.toLocaleString()}</p>
                </div>
              ) : adBalance.connected ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    {isKo ? "광고 계정이 연결되었지만 잔액 정보를 가져올 수 없습니다." : "Ad account connected but balance info unavailable."}
                  </p>
                </div>
              ) : null}

              {/* Monthly Budget */}
              <div>
                <Input
                  label={isKo ? "월 예산 (USD)" : "Monthly Budget (USD)"}
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setMonthlyBudget(v);
                    const newLimit = Math.floor(v / 30 * 0.8);
                    if (dailyBudget > Math.floor(v / 30)) setDailyBudget(Math.max(1, newLimit));
                  }}
                />
              </div>

              {/* AI Recommended Daily Budget */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🤖</span>
                  <p className="text-sm font-semibold text-indigo-900">
                    {isKo ? "AI 추천 일일 예산" : "AI Recommended Daily Budget"}
                  </p>
                </div>
                <p className="text-xs text-indigo-700">
                  {isKo
                    ? `월 $${monthlyBudget} 예산 기준, 최적 일일 예산은 $${recMin}–$${recMax} 범위입니다. 초반에는 $${recOptimal}로 시작하고 성과에 따라 조정하는 것을 권장합니다.`
                    : `Based on $${monthlyBudget}/mo budget, optimal daily range is $${recMin}–$${recMax}. We recommend starting at $${recOptimal} and adjusting based on performance.`}
                </p>
                <div className="flex gap-2">
                  {[recMin, recOptimal, recMax].map((v, i) => (
                    <button
                      key={v}
                      onClick={() => setDailyBudget(v)}
                      className={`flex-1 rounded-lg border-2 px-2 py-2 text-center transition-all ${
                        dailyBudget === v ? "border-indigo-500 bg-white" : "border-transparent bg-white/60 hover:bg-white"
                      }`}
                    >
                      <p className="text-lg font-bold text-gray-900">${v}</p>
                      <p className="text-[10px] text-gray-500">
                        {i === 0 ? (isKo ? "절약형" : "Conservative") : i === 1 ? (isKo ? "추천" : "Recommended") : (isKo ? "공격형" : "Aggressive")}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Budget Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    {t.campaigns.dailyBudget}
                  </label>
                  <span className="text-xs text-gray-400">
                    {isKo ? `최대 $${dailyLimit}/일` : `Max $${dailyLimit}/day`}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={Math.max(5, Math.floor(dailyLimit / 5) * 5)}
                  step={5}
                  value={Math.min(Math.round(dailyBudget / 5) * 5, Math.floor(dailyLimit / 5) * 5)}
                  onChange={(e) => setDailyBudget(+e.target.value)}
                  className="w-full accent-indigo-600"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">$5</span>
                  <span className="text-lg font-bold text-indigo-600">${dailyBudget}</span>
                  <span className="text-xs text-gray-400">${Math.floor(dailyLimit / 5) * 5}</span>
                </div>
                {dailyBudget > dailyLimit && (
                  <p className="text-xs text-red-500 mt-1">
                    {isKo
                      ? `일일 예산이 월 예산 기준 한도($${dailyLimit})를 초과합니다.`
                      : `Daily budget exceeds the monthly limit ($${dailyLimit}).`}
                  </p>
                )}
              </div>

              {/* Budget Mode */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  {isKo ? "예산 운용 방식" : "Budget Strategy"}
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => setBudgetMode("fixed")}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      budgetMode === "fixed" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-medium">{isKo ? "📌 고정 예산" : "📌 Fixed Budget"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isKo ? `매일 정확히 $${dailyBudget} 지출` : `Spend exactly $${dailyBudget} daily`}
                    </p>
                  </button>
                  <button
                    onClick={() => setBudgetMode("flexible")}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      budgetMode === "flexible" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-medium">{isKo ? "📈 유동 예산" : "📈 Flexible Budget"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isKo
                        ? `성과 좋은 날 최대 $${Math.round(dailyBudget * 1.5)}까지 자동 증액`
                        : `Auto-boost up to $${Math.round(dailyBudget * 1.5)} on high-performing days`}
                    </p>
                  </button>
                </div>
                {budgetMode === "flexible" && (
                  <p className="text-xs text-gray-500 mt-2">
                    {isKo
                      ? `💡 성과가 좋은 날에는 일일 예산의 150%까지 자동 증액되고, 성과가 낮은 날에는 줄어듭니다. 월 예산($${monthlyBudget})은 초과하지 않습니다.`
                      : `💡 On high-performing days, spend increases up to 150% of daily budget. On low days, it decreases. Monthly budget ($${monthlyBudget}) is never exceeded.`}
                  </p>
                )}
              </div>

              {/* Target ROAS / Autopilot */}
              {platform === "meta" && (
                <div className="rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>🎯</span>
                        <p className="text-sm font-semibold text-violet-900">
                          {isKo ? "ROAS 자동 최적화" : "ROAS Autopilot"}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-violet-700">
                        {isKo
                          ? "Piped가 1시간마다 지표를 읽고 목표 ROAS에 도달할 때까지 광고를 최적화합니다."
                          : "Piped reads metrics hourly and optimizes ads until your target ROAS is hit."}
                      </p>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={optimizationEnabled}
                        onChange={(e) => setOptimizationEnabled(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                  {optimizationEnabled && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-violet-900">
                          {isKo ? "목표 ROAS" : "Target ROAS"}
                        </label>
                        <span className="text-lg font-bold text-violet-700">{targetRoas.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={0.5}
                        value={targetRoas}
                        onChange={(e) => setTargetRoas(+e.target.value)}
                        className="w-full accent-violet-600"
                      />
                      <div className="flex justify-between text-[10px] text-violet-600">
                        <span>1x</span>
                        <span>5x</span>
                        <span>10x</span>
                      </div>
                      <p className="mt-2 text-[11px] text-violet-700">
                        {isKo
                          ? `현재 ROAS가 ${targetRoas}x 미만이면 부진한 광고를 자동 일시정지하고, 위너에 예산을 재분배합니다.`
                          : `If ROAS drops below ${targetRoas}x, Piped pauses underperformers and reallocates budget to winners.`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>{isKo ? "월 예산" : "Monthly Budget"}</span>
                  <span className="font-semibold text-gray-900">${monthlyBudget}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isKo ? "일일 예산" : "Daily Budget"}</span>
                  <span className="font-semibold text-gray-900">
                    {budgetMode === "flexible" ? `$${Math.round(dailyBudget * 0.7)}–$${Math.round(dailyBudget * 1.5)}` : `$${dailyBudget}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isKo ? "예상 운용 기간" : "Est. Duration"}</span>
                  <span className="font-semibold text-gray-900">
                    {dailyBudget > 0 ? `${Math.floor(monthlyBudget / dailyBudget)}${isKo ? "일" : " days"}` : "—"}
                  </span>
                </div>
              </div>
              </>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{t.campaigns.campaignReview}</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">{t.campaigns.type}</span>
                  <span className="font-medium">
                    {platform === "meta" ? "Meta Ads" : platform === "google" ? "Google Ads" : "인플루언서 마케팅"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">{t.campaigns.campaignName}</span>
                  <span className="font-medium">{campaignName}</span>
                </div>
                {platform === "influencer" ? (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">{t.campaigns.goal}</span>
                      <span className="font-medium">{influencerGoal === "visits" ? t.campaigns.visits : influencerGoal === "signups" ? t.campaigns.signups : t.campaigns.purchases}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">{t.campaigns.commissionPerAction}</span>
                      <span className="font-medium">{commissionValue}{commissionType === "percentage" ? "%" : "$"} / 건</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">{t.campaigns.cookiePeriod}</span>
                      <span className="font-medium">{cookieDays}일</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">{t.campaigns.totalBudget}</span>
                      <span className="font-medium">${influencerBudget}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">{t.campaigns.status}</span>
                      <span className="font-medium text-green-600">{t.campaigns.autoCreateAffiliate}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">{t.campaigns.dailyBudget}</span>
                      <span className="font-medium">${dailyBudget}{budgetMode === "flexible" ? ` (${isKo ? "유동" : "flex"})` : ""}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">{t.campaigns.targetInfo}</span>
                      <span className="font-medium">Ages {targeting.ageMin}-{targeting.ageMax}, {targeting.locations}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">{t.campaigns.status}</span>
                      <span className="font-medium text-yellow-600">{t.campaigns.createdAsPaused}</span>
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
          {t.campaigns.back}
        </Button>

        {step === "review" ? (
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={platform === "influencer" && influencerBudget > credits}
          >
            <Megaphone className="mr-2 h-4 w-4" />
            {t.campaigns.createCampaign}
          </Button>
        ) : (
          <Button
            onClick={() => {
              const next = steps[currentStepIndex + 1];
              if (next) setStep(next.id);
            }}
            disabled={!canNext()}
          >
            {t.campaigns.next}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
