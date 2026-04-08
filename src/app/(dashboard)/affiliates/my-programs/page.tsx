"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  Link as LinkIcon,
  MousePointer,
  DollarSign,
  Copy,
  Check,
  Wallet,
  ArrowUpRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { AffiliateLink } from "@/types/affiliate";

interface PayoutData {
  payouts: { id: string; amount: number; status: string; paymentMethod: string; createdAt: { _seconds: number } }[];
  totalEarnings: number;
  availableBalance: number;
}

const statusLabels: Record<string, string> = {
  pending: "대기중", approved: "승인됨", paid: "지급완료", rejected: "거절됨",
};
const statusVariant: Record<string, "default" | "info" | "success" | "warning" | "error"> = {
  pending: "warning", approved: "info", paid: "success", rejected: "error",
};

export default function MyProgramsPage() {
  const { profile } = useAuth();
  const { locale } = useLocale();
  const isKo = locale === "ko";
  const { toast } = useToast();
  const [links, setLinks] = useState<(AffiliateLink & { programName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<{ totalEarnings: number; totalClicks: number; totalConversions: number } | null>(null);
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");

  async function loadLinks() {
    if (!profile) return;
    const token = await getAuth_().currentUser?.getIdToken();

    const [earningsRes, payoutsRes] = await Promise.all([
      fetch("/api/affiliates/earnings", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/affiliates/payouts", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (earningsRes.ok) {
      const data = await earningsRes.json();
      setEarningsData(data);
      // earnings already includes the joined `program` object
      const enriched = (data.links || []).map(
        (link: AffiliateLink & { program?: { name?: string } }) => ({
          ...link,
          programName: link.program?.name ?? "Unknown",
        })
      );
      setLinks(enriched);
    }
    if (payoutsRes.ok) setPayoutData(await payoutsRes.json());

    setLoading(false);
  }

  useEffect(() => { loadLinks(); }, [profile]);

  const handleCopy = (code: string, id: string) => {
    const url = `${window.location.origin}/api/affiliates/track?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 10) {
      toast("error", isKo ? "최소 출금 금액은 $10입니다" : "Minimum payout is $10");
      return;
    }
    setRequesting(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/affiliates/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, paymentMethod: "bank_transfer", paymentDetails }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast("success", isKo ? `$${amount.toFixed(2)} 출금 요청이 접수되었습니다` : `Payout request for $${amount.toFixed(2)} submitted`);
      setPayoutAmount("");
      // Reload payout data
      const payoutsRes = await fetch("/api/affiliates/payouts", { headers: { Authorization: `Bearer ${token}` } });
      if (payoutsRes.ok) setPayoutData(await payoutsRes.json());
    } catch (error) {
      toast("error", error instanceof Error ? error.message : (isKo ? "출금 요청 실패" : "Payout request failed"));
    }
    setRequesting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  const stats = [
    { label: isKo ? "총 수익" : "Total Earnings", value: `$${(earningsData?.totalEarnings || 0).toFixed(2)}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: isKo ? "출금 가능" : "Available", value: `$${(payoutData?.availableBalance || 0).toFixed(2)}`, icon: Wallet, color: "bg-indigo-50 text-indigo-600" },
    { label: isKo ? "총 클릭" : "Total Clicks", value: (earningsData?.totalClicks || 0).toLocaleString(), icon: MousePointer, color: "bg-blue-50 text-blue-600" },
    { label: isKo ? "전환율" : "Conv. Rate", value: earningsData?.totalClicks ? `${(((earningsData.totalConversions || 0) / earningsData.totalClicks) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">{isKo ? "내 프로그램" : "My Programs"}</h1>
      <p className="mt-1 text-sm text-gray-500">{isKo ? "참여 중인 제휴 프로그램과 레퍼럴 링크" : "Your affiliate programs and referral links"}</p>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Program List */}
      {links.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-600">{isKo ? "참여 중인 프로그램이 없습니다" : "No programs yet"}</p>
            <Link href="/affiliates" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-700">
              {isKo ? "프로그램 둘러보기 →" : "Browse programs →"}
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
                      <code className="text-xs text-gray-400">{isKo ? "코드" : "Code"}: {link.code}</code>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{link.clicks}</p>
                        <p className="text-[10px] text-gray-400">{isKo ? "클릭" : "Clicks"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{link.conversions}</p>
                        <p className="text-[10px] text-gray-400">{isKo ? "전환" : "Conv."}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">${link.earnings.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400">{isKo ? "수익" : "Earnings"}</p>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payout Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Payout Request */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-900">{isKo ? "출금 요청" : "Request Payout"}</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">
              {isKo ? "출금 가능 금액" : "Available balance"}: <span className="font-bold text-indigo-600">${(payoutData?.availableBalance || 0).toFixed(2)}</span>
              <span className="text-xs text-gray-400"> ({isKo ? "최소 $10" : "min. $10"})</span>
            </p>
            <Input
              label={isKo ? "출금 금액 (USD)" : "Payout amount (USD)"}
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="10.00"
            />
            <Input
              label={isKo ? "입금 정보 (계좌번호 등)" : "Payment details (bank account, etc.)"}
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              placeholder={isKo ? "은행명, 계좌번호, 예금주" : "Bank name, account number, holder"}
            />
            <Button
              onClick={handleRequestPayout}
              loading={requesting}
              disabled={(payoutData?.availableBalance || 0) < 10}
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isKo ? "출금 요청하기" : "Request Payout"}
            </Button>
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">{isKo ? "정산 내역" : "Payout History"}</h2>
            </div>
          </CardHeader>
          <CardContent>
            {!payoutData?.payouts?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">{isKo ? "정산 내역이 없습니다" : "No payout history"}</p>
            ) : (
              <div className="space-y-2">
                {payoutData.payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">${p.amount.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">
                        {p.createdAt?._seconds ? new Date(p.createdAt._seconds * 1000).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <Badge variant={statusVariant[p.status] || "default"}>
                      {statusLabels[p.status] || p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
