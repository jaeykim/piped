"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { Users, Plus, Link as LinkIcon, TrendingUp, Eye, DollarSign, Check, X as XIcon, Image as ImageIcon, Copy, Download } from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";
import type { SiteAnalysis } from "@/types/analysis";
import type { CopyVariant } from "@/types/copy";
import type { Creative } from "@/types/creative";

function ProgramDashboard({ program, creatives, copyVariants, toast }: { program: AffiliateProgram; creatives: Creative[]; copyVariants: CopyVariant[]; toast: (type: "success" | "error" | "info", msg: string) => void }) {
  const { locale } = useLocale();
  const isKo = locale.startsWith("ko");
  const [payouts, setPayouts] = useState<{ id: string; amount: number; status: string; influencerName: string; paymentDetails?: string; createdAt?: { _seconds: number } }[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/affiliates/${program.id}` : "";

  useEffect(() => {
    async function load() {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/affiliates/payouts/manage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
      setLoadingPayouts(false);
    }
    load();
  }, []);

  const handlePayoutAction = async (payoutId: string, action: "approve" | "reject" | "paid") => {
    const token = await getAuth_().currentUser?.getIdToken();
    const res = await fetch("/api/affiliates/payouts/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payoutId, action }),
    });
    if (res.ok) {
      toast("success", action === "approve" ? "승인됨" : action === "paid" ? "지급 완료 처리됨" : "거절됨");
      setPayouts((prev) => prev.map((p) => p.id === payoutId ? { ...p, status: action === "approve" ? "approved" : action === "paid" ? "paid" : "rejected" } : p));
    }
  };

  const statusLabel: Record<string, string> = { pending: "대기중", approved: "승인됨", paid: "지급완료", rejected: "거절됨" };
  const statusVariant: Record<string, "default" | "warning" | "success" | "error" | "info"> = { pending: "warning", approved: "info", paid: "success", rejected: "error" };

  // Demo performance chart
  const perfData = [
    { day: isKo ? "월" : "Mon", clicks: 45, conversions: 3, spend: 15 },
    { day: isKo ? "화" : "Tue", clicks: 32, conversions: 2, spend: 10 },
    { day: isKo ? "수" : "Wed", clicks: 78, conversions: 5, spend: 25 },
    { day: isKo ? "목" : "Thu", clicks: 51, conversions: 3, spend: 15 },
    { day: isKo ? "금" : "Fri", clicks: 95, conversions: 7, spend: 35 },
    { day: isKo ? "토" : "Sat", clicks: 62, conversions: 4, spend: 20 },
    { day: isKo ? "일" : "Sun", clicks: 71, conversions: 5, spend: 25 },
  ];
  const maxClicks = Math.max(...perfData.map((d) => d.clicks));
  const totalClicks = perfData.reduce((s, d) => s + d.clicks, 0);
  const totalConv = perfData.reduce((s, d) => s + d.conversions, 0);
  const totalPayout = perfData.reduce((s, d) => s + d.spend, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">{isKo ? "제휴 프로그램 관리" : "Affiliate Program Management"}</h1>

      {/* Performance Chart — top */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{isKo ? "주간 성과" : "Weekly Performance"}</h2>
            <Badge variant="default">{isKo ? "데모" : "Demo"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{totalClicks}</p>
              <p className="text-[10px] text-gray-500">{isKo ? "클릭" : "Clicks"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{totalConv}</p>
              <p className="text-[10px] text-gray-500">{isKo ? "전환" : "Conversions"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-lg font-bold text-green-600">${totalPayout}</p>
              <p className="text-[10px] text-gray-500">{isKo ? "커미션 지출" : "Commission Spent"}</p>
            </div>
          </div>
          <div className="flex items-end gap-2" style={{ height: 100 }}>
            {perfData.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-indigo-600">{d.clicks}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400"
                  style={{ height: `${(d.clicks / maxClicks) * 70}px`, minHeight: 4 }}
                />
                <span className="text-[10px] text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-gray-400 text-center">
            {isKo ? "캠페인 런칭 후 실제 데이터로 대체됩니다" : "Will show real data after campaign launch"}
          </p>
        </CardContent>
      </Card>

      {/* Program Info */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">{program.name}</h2>
            </div>
            <Badge variant="success">{program.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{program.commissionValue}{program.commissionType === "percentage" ? "%" : "$"}</p>
              <p className="text-xs text-gray-500">{isKo ? "커미션" : "Commission"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{program.cookieDurationDays}{isKo ? "일" : "d"}</p>
              <p className="text-xs text-gray-500">{isKo ? "쿠키 기간" : "Cookie"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{program.totalAffiliates}</p>
              <p className="text-xs text-gray-500">{isKo ? "제휴 파트너" : "Affiliates"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700">{isKo ? "인플루언서에게 공유할 링크:" : "Share with influencers:"}</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm break-all">
                {shareUrl}
              </code>
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast("success", isKo ? "링크 복사됨!" : "Link copied!");
              }}>
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Management */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">{isKo ? "정산 요청 관리" : "Payout Requests"}</h2>
        </CardHeader>
        <CardContent>
          {loadingPayouts ? (
            <div className="py-8 text-center"><Spinner /></div>
          ) : payouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{isKo ? "정산 요청이 없습니다" : "No payout requests"}</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{p.influencerName}</p>
                    <p className="text-lg font-bold text-green-600">${p.amount.toFixed(2)}</p>
                    {p.paymentDetails && <p className="text-xs text-gray-400">{p.paymentDetails}</p>}
                    <p className="text-[10px] text-gray-300">
                      {p.createdAt?._seconds ? new Date(p.createdAt._seconds * 1000).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[p.status] || "default"}>{statusLabel[p.status] || p.status}</Badge>
                    {p.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => handlePayoutAction(p.id, "approve")}>
                          <Check className="mr-1 h-3 w-3" />{isKo ? "승인" : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePayoutAction(p.id, "reject")}>
                          <XIcon className="mr-1 h-3 w-3" />{isKo ? "거절" : "Reject"}
                        </Button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <Button size="sm" onClick={() => handlePayoutAction(p.id, "paid")}>
                        <DollarSign className="mr-1 h-3 w-3" />{isKo ? "지급완료" : "Mark Paid"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promotion Materials */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">{isKo ? "인플루언서 홍보 소재" : "Influencer Promotion Materials"}</h2>
          <p className="mt-1 text-xs text-gray-500">
            {isKo ? "인플루언서들이 프로그램에 참여하면 아래 소재를 복사하여 홍보합니다." : "Influencers who join will copy these materials for their promotions."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ad Images */}
          {creatives.length > 0 && (
            <div className="rounded-lg bg-purple-50 p-4">
              <h3 className="font-medium text-purple-900 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" />
                {isKo ? "광고 이미지" : "Ad Images"}
                <span className="text-xs font-normal text-purple-600">({creatives.length})</span>
              </h3>
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
                    <div className="p-1.5">
                      <p className="text-[10px] text-gray-400">{c.platform} · {c.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Marketing Copy */}
          {copyVariants.length > 0 && (
            <div className="rounded-lg bg-indigo-50 p-4">
              <h3 className="font-medium text-indigo-900">{isKo ? "마케팅 문구" : "Marketing Copy"} <span className="text-xs font-normal text-indigo-600">({copyVariants.length})</span></h3>
              <div className="mt-3 space-y-2">
                {copyVariants.filter((c) => ["headline", "social", "ad_meta", "cta"].includes(c.type)).slice(0, 6).map((c) => {
                  const displayText = c.editedContent || c.content;
                  const typeLabel: Record<string, string> = isKo
                    ? { headline: "헤드라인", social: "소셜", ad_meta: "Meta 광고", cta: "CTA" }
                    : { headline: "Headline", social: "Social", ad_meta: "Meta Ad", cta: "CTA" };
                  return (
                    <div key={c.id} className="flex items-start gap-2 rounded bg-white p-3 text-sm">
                      <Badge variant="default" className="shrink-0 mt-0.5">{typeLabel[c.type] || c.type}</Badge>
                      <p className="flex-1 text-gray-700 break-words">{displayText.length > 150 ? displayText.slice(0, 150) + "..." : displayText}</p>
                      <button
                        onClick={() => copyText(c.id, `${displayText}\n${shareUrl}`)}
                        className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedId === c.id ? "✓" : isKo ? "복사" : "Copy"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {creatives.length === 0 && copyVariants.length === 0 && (
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">
                {isKo ? "아직 생성된 홍보 소재가 없습니다. 프로젝트에서 카피와 크리에이티브를 먼저 생성하세요." : "No materials yet. Generate copy and creatives in the project first."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Management */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">정산 요청 관리</h2>
        </CardHeader>
        <CardContent>
          {loadingPayouts ? (
            <div className="py-8 text-center"><Spinner /></div>
          ) : payouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">정산 요청이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{p.influencerName}</p>
                    <p className="text-lg font-bold text-green-600">${p.amount.toFixed(2)}</p>
                    {p.paymentDetails && <p className="text-xs text-gray-400">{p.paymentDetails}</p>}
                    <p className="text-[10px] text-gray-300">
                      {p.createdAt?._seconds ? new Date(p.createdAt._seconds * 1000).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[p.status] || "default"}>{statusLabel[p.status] || p.status}</Badge>
                    {p.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => handlePayoutAction(p.id, "approve")}>
                          <Check className="mr-1 h-3 w-3" />승인
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePayoutAction(p.id, "reject")}>
                          <XIcon className="mr-1 h-3 w-3" />거절
                        </Button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <Button size="sm" onClick={() => handlePayoutAction(p.id, "paid")}>
                        <DollarSign className="mr-1 h-3 w-3" />지급완료
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AffiliatesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [copyVariants, setCopyVariants] = useState<CopyVariant[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    commissionType: "percentage" as "percentage" | "fixed",
    commissionValue: 15,
    cookieDurationDays: 30,
  });

  useEffect(() => {
    async function load() {
      const token = await getAuth_().currentUser?.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [projRes, programsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}?include=analysis,creatives,copy`, {
          headers,
        }),
        fetch(`/api/affiliates/programs?projectId=${projectId}`, { headers }),
      ]);

      if (projRes.ok) {
        const { project } = await projRes.json();
        if (project?.analysis) {
          const a = project.analysis;
          const data: SiteAnalysis = {
            extractedText: a.extractedText,
            metaTags: { title: a.metaTitle, description: a.metaDescription },
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
          setForm((f) => ({
            ...f,
            name: `${data.productName} Affiliate Program`,
            description: `Promote ${data.productName} and earn commissions on every referral.`,
          }));
        }
        setCreatives(
          ((project?.creatives ?? []) as Creative[]).filter(
            (c) => c.status === "ready"
          )
        );
        setCopyVariants((project?.copyVariants ?? []) as CopyVariant[]);
      }

      if (programsRes.ok) {
        const { programs } = await programsRes.json();
        if (programs?.length) setProgram(programs[0] as AffiliateProgram);
      }

      setLoading(false);
    }
    load();
  }, [projectId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/affiliates/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          ...form,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast("success", "Affiliate program created!");
      // Reload
      const data = await res.json();
      setProgram({
        id: data.programId,
        ...form,
        projectId,
        ownerId: profile!.uid,
        status: "active",
        totalAffiliates: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AffiliateProgram);
      setShowForm(false);
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Creation failed"
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (program) {
    return <ProgramDashboard program={program} creatives={creatives} copyVariants={copyVariants} toast={toast} />;
  }

  if (!showForm) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-green-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              Create an Affiliate Program
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Let influencers promote {analysis?.productName || "your product"}{" "}
              and earn commissions.
            </p>
            <Button onClick={() => setShowForm(true)} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Set Up Program
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">
        Create Affiliate Program
      </h1>

      <Card className="mt-6">
        <CardContent className="p-6 space-y-4">
          <Input
            label="Program Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Type
              </label>
              <select
                value={form.commissionType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commissionType: e.target.value as "percentage" | "fixed",
                  })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <Input
              label={`Commission Value (${form.commissionType === "percentage" ? "%" : "$"})`}
              type="number"
              value={form.commissionValue}
              onChange={(e) =>
                setForm({ ...form, commissionValue: +e.target.value })
              }
            />
          </div>

          <Input
            label="Cookie Duration (days)"
            type="number"
            value={form.cookieDurationDays}
            onChange={(e) =>
              setForm({ ...form, cookieDurationDays: +e.target.value })
            }
          />

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} loading={creating}>
              Create Program
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
