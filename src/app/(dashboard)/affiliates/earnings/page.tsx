"use client";

import { useEffect, useState } from "react";
import { getAuth_ } from "@/lib/firebase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  DollarSign, MousePointer, TrendingUp, Zap, Wallet, ArrowUpRight, Clock,
} from "lucide-react";

interface EarningsData {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  links: {
    id: string;
    code: string;
    clicks: number;
    conversions: number;
    earnings: number;
    program?: { name: string; commissionValue: number; commissionType: string };
  }[];
}

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

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const token = await getAuth_().currentUser?.getIdToken();
      const [earningsRes, payoutsRes] = await Promise.all([
        fetch("/api/affiliates/earnings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/affiliates/payouts", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (earningsRes.ok) setData(await earningsRes.json());
      if (payoutsRes.ok) setPayoutData(await payoutsRes.json());
      setLoading(false);
    }
    load();
  }, []);

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 10) {
      toast("error", "최소 출금 금액은 $10입니다");
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
      toast("success", `$${amount.toFixed(2)} 출금 요청이 접수되었습니다`);
      setPayoutAmount("");
      // Reload
      const payoutsRes = await fetch("/api/affiliates/payouts", { headers: { Authorization: `Bearer ${token}` } });
      if (payoutsRes.ok) setPayoutData(await payoutsRes.json());
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "출금 요청 실패");
    }
    setRequesting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  const stats = [
    { label: "총 수익", value: `$${(data?.totalEarnings || 0).toFixed(2)}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "출금 가능", value: `$${(payoutData?.availableBalance || 0).toFixed(2)}`, icon: Wallet, color: "bg-indigo-50 text-indigo-600" },
    { label: "총 클릭", value: (data?.totalClicks || 0).toLocaleString(), icon: MousePointer, color: "bg-blue-50 text-blue-600" },
    { label: "전환율", value: data?.totalClicks ? `${(((data.totalConversions || 0) / data.totalClicks) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">수익 & 정산</h1>
      <p className="mt-1 text-sm text-gray-500">제휴 프로그램 성과와 수익을 확인하고 정산을 요청하세요</p>

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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Payout Request */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-900">출금 요청</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">
              출금 가능 금액: <span className="font-bold text-indigo-600">${(payoutData?.availableBalance || 0).toFixed(2)}</span>
              <span className="text-xs text-gray-400"> (최소 $10)</span>
            </p>
            <Input
              label="출금 금액 (USD)"
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="10.00"
            />
            <Input
              label="입금 정보 (계좌번호 등)"
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              placeholder="은행명, 계좌번호, 예금주"
            />
            <Button
              onClick={handleRequestPayout}
              loading={requesting}
              disabled={(payoutData?.availableBalance || 0) < 10}
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              출금 요청하기
            </Button>
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">정산 내역</h2>
            </div>
          </CardHeader>
          <CardContent>
            {!payoutData?.payouts?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">정산 내역이 없습니다</p>
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

      {/* Performance by Program */}
      {data?.links && data.links.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">프로그램별 성과</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">프로그램</th>
                    <th className="pb-3 font-medium text-right">클릭</th>
                    <th className="pb-3 font-medium text-right">전환</th>
                    <th className="pb-3 font-medium text-right">수익</th>
                  </tr>
                </thead>
                <tbody>
                  {data.links.map((link) => (
                    <tr key={link.id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{link.program?.name || "Unknown"}</p>
                        <code className="text-xs text-gray-400">{link.code}</code>
                      </td>
                      <td className="py-3 text-right text-gray-700">{link.clicks.toLocaleString()}</td>
                      <td className="py-3 text-right text-gray-700">{link.conversions}</td>
                      <td className="py-3 text-right font-medium text-green-600">${link.earnings.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
