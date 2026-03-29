"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  collection, getDocs, query, where, orderBy,
} from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  Plus, Megaphone, TrendingUp, DollarSign, Eye, MousePointer,
  ArrowRight, Users, RefreshCw, Play, Pause, BarChart3, Target,
} from "lucide-react";
import type { Campaign } from "@/types/campaign";

export default function CampaignsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadCampaigns() {
    const q = query(
      collection(getDb(), "campaigns"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign));
    setLoading(false);
  }

  useEffect(() => { loadCampaigns(); }, [projectId]);

  // Aggregate metrics across all campaigns
  const totalMetrics = campaigns.reduce((acc, c) => {
    if (!c.metrics) return acc;
    return {
      impressions: acc.impressions + (c.metrics.impressions || 0),
      clicks: acc.clicks + (c.metrics.clicks || 0),
      spend: acc.spend + (c.metrics.spend || 0),
      conversions: acc.conversions + (c.metrics.conversions || 0),
    };
  }, { impressions: 0, clicks: 0, spend: 0, conversions: 0 });

  const totalCTR = totalMetrics.impressions > 0
    ? (totalMetrics.clicks / totalMetrics.impressions * 100) : 0;
  const totalCPC = totalMetrics.clicks > 0
    ? (totalMetrics.spend / totalMetrics.clicks) : 0;
  const totalROAS = totalMetrics.spend > 0 && totalMetrics.conversions > 0
    ? ((totalMetrics.conversions * 50) / totalMetrics.spend) : 0;

  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      for (const campaign of campaigns) {
        if (!campaign.platformCampaignId) continue;
        const endpoint = campaign.platform === "meta"
          ? "/api/campaigns/meta/metrics"
          : null; // Google metrics would be similar
        if (!endpoint) continue;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ campaignId: campaign.platformCampaignId }),
        });
        if (res.ok) {
          const { metrics } = await res.json();
          // Update Firestore
          const { doc, updateDoc } = await import("firebase/firestore");
          await updateDoc(doc(getDb(), "campaigns", campaign.id), { metrics, updatedAt: new Date() });
        }
      }
      await loadCampaigns();
      toast("success", "지표가 업데이트되었습니다");
    } catch (e) {
      toast("error", "지표 업데이트 실패");
    }
    setRefreshing(false);
  };

  const handleToggleAd = async (campaign: Campaign) => {
    if (campaign.platform !== "meta" || !campaign.platformCampaignId) return;
    const newStatus = campaign.status === "active" ? "PAUSED" : "ACTIVE";
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/campaigns/meta/control", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adId: campaign.platformCampaignId, status: newStatus }),
      });
      if (res.ok) {
        const { doc, updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(getDb(), "campaigns", campaign.id), {
          status: newStatus === "ACTIVE" ? "active" : "paused",
        });
        await loadCampaigns();
        toast("success", newStatus === "ACTIVE" ? "광고가 시작되었습니다" : "광고가 중지되었습니다");
      }
    } catch {
      toast("error", "광고 상태 변경 실패");
    }
  };

  const statusVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
    draft: "default", pending: "warning", active: "success",
    paused: "info", completed: "default", error: "error",
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">캠페인 대시보드</h1>
        <div className="flex gap-2">
          {campaigns.length > 0 && (
            <Button variant="outline" onClick={handleRefreshMetrics} loading={refreshing} size="sm">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              지표 새로고침
            </Button>
          )}
          <Link href={`/projects/${projectId}/campaigns/new`}>
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              새 캠페인
            </Button>
          </Link>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-orange-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">캠페인이 없습니다</p>
            <p className="mt-1 text-sm text-gray-500">첫 번째 광고 캠페인을 만들어보세요</p>
            <Link href={`/projects/${projectId}/campaigns/new`}>
              <Button className="mt-6"><Plus className="mr-2 h-4 w-4" />캠페인 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Aggregate Dashboard ─── */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "총 노출수", value: totalMetrics.impressions.toLocaleString(), icon: Eye, color: "text-blue-600 bg-blue-50" },
              { label: "총 클릭수", value: totalMetrics.clicks.toLocaleString(), sub: `CTR ${totalCTR.toFixed(2)}%`, icon: MousePointer, color: "text-indigo-600 bg-indigo-50" },
              { label: "총 지출", value: `$${totalMetrics.spend.toFixed(2)}`, sub: `CPC $${totalCPC.toFixed(2)}`, icon: DollarSign, color: "text-orange-600 bg-orange-50" },
              { label: "ROAS", value: totalROAS > 0 ? `${totalROAS.toFixed(1)}x` : "-", sub: `전환 ${totalMetrics.conversions}건`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        {stat.sub && <p className="text-[10px] text-gray-400">{stat.sub}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ─── Campaign List ─── */}
          <h2 className="mt-8 text-sm font-semibold text-gray-500 uppercase tracking-wider">캠페인 목록</h2>
          <div className="mt-3 space-y-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="transition-all hover:shadow-md">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        campaign.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                      }`}>
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                          <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
                          <Badge variant="default">{campaign.platform === "meta" ? "Meta" : "Google"}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          ${campaign.budget.amount}/{campaign.budget.type}
                        </p>
                      </div>
                    </div>
                    {campaign.platform === "meta" && campaign.platformCampaignId && (
                      <Button
                        size="sm"
                        variant={campaign.status === "active" ? "outline" : "primary"}
                        onClick={() => handleToggleAd(campaign)}
                      >
                        {campaign.status === "active" ? (
                          <><Pause className="mr-1.5 h-3.5 w-3.5" />중지</>
                        ) : (
                          <><Play className="mr-1.5 h-3.5 w-3.5" />시작</>
                        )}
                      </Button>
                    )}
                  </div>

                  {campaign.metrics && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 rounded-lg bg-gray-50 p-3">
                      {[
                        { label: "노출", value: campaign.metrics.impressions.toLocaleString() },
                        { label: "클릭", value: campaign.metrics.clicks.toLocaleString() },
                        { label: "CTR", value: `${((campaign.metrics as unknown as Record<string, number>).ctr || 0).toFixed(2)}%` },
                        { label: "지출", value: `$${campaign.metrics.spend.toFixed(2)}` },
                        { label: "CPC", value: `$${((campaign.metrics as unknown as Record<string, number>).cpc || 0).toFixed(2)}` },
                        { label: "전환", value: campaign.metrics.conversions.toString() },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <p className="text-sm font-semibold text-gray-900">{s.value}</p>
                          <p className="text-[10px] text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Next Step */}
          <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">다음: 제휴 프로그램</p>
                <p className="text-sm text-gray-500">인플루언서가 제품을 홍보하고 커미션을 받습니다</p>
              </div>
            </div>
            <Link href={`/projects/${projectId}/affiliates`}>
              <Button>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
