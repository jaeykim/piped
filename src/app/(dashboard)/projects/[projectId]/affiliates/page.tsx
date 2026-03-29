"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { Users, Plus, Link as LinkIcon, TrendingUp, Eye, DollarSign, Check, X as XIcon } from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";
import type { SiteAnalysis } from "@/types/analysis";

function ProgramDashboard({ program, toast }: { program: AffiliateProgram; toast: (type: "success" | "error" | "info", msg: string) => void }) {
  const [payouts, setPayouts] = useState<{ id: string; amount: number; status: string; influencerName: string; paymentDetails?: string; createdAt?: { _seconds: number } }[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);

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

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">제휴 프로그램 관리</h1>

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
              <p className="text-xs text-gray-500">커미션</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{program.cookieDurationDays}일</p>
              <p className="text-xs text-gray-500">쿠키 기간</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{program.totalAffiliates}</p>
              <p className="text-xs text-gray-500">제휴 파트너</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700">인플루언서에게 공유할 링크:</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/affiliates/${program.id}` : ""}
              </code>
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/affiliates/${program.id}`);
                toast("success", "링크 복사됨!");
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

  const [form, setForm] = useState({
    name: "",
    description: "",
    commissionType: "percentage" as "percentage" | "fixed",
    commissionValue: 15,
    cookieDurationDays: 30,
  });

  useEffect(() => {
    async function load() {
      // Get analysis for product name
      const analysisSnap = await getDoc(
        doc(getDb(), "projects", projectId, "analysis", "result")
      );
      if (analysisSnap.exists()) {
        const data = analysisSnap.data() as SiteAnalysis;
        setAnalysis(data);
        setForm((f) => ({
          ...f,
          name: `${data.productName} Affiliate Program`,
          description: `Promote ${data.productName} and earn commissions on every referral.`,
        }));
      }

      // Check for existing program
      const programsSnap = await getDocs(
        query(
          collection(getDb(), "affiliatePrograms"),
          where("projectId", "==", projectId)
        )
      );
      if (!programsSnap.empty) {
        setProgram({
          id: programsSnap.docs[0].id,
          ...programsSnap.docs[0].data(),
        } as AffiliateProgram);
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
    return <ProgramDashboard program={program} toast={toast} />;
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
