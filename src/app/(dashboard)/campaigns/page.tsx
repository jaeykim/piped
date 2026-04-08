"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Target,
  AlertCircle,
  Copy,
} from "lucide-react";
import { getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

interface CampaignDoc {
  id: string;
  name: string;
  platform: "meta" | "google";
  status: "active" | "paused" | "archived";
  platformCampaignId?: string;
  budget?: { amount: number; currency: string; type: string };
  targetRoas?: number | null;
  optimizationEnabled?: boolean;
  createdAt?: { seconds: number };
  creativeThumbnail?: string | null;
  projectName?: string | null;
}

export default function CampaignsPage() {
  const { profile } = useAuth();
  const { locale } = useLocale();
  const { toast } = useToast();
  const isKo = locale.startsWith("ko");
  const metaConnected = !!profile?.integrations?.meta?.accessToken;

  const [campaigns, setCampaigns] = useState<CampaignDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setCampaigns(data.campaigns as CampaignDoc[]);
    } catch {
      toast("error", isKo ? "캠페인 불러오기 실패" : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [profile, toast, isKo]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = async (c: CampaignDoc) => {
    if (!c.platformCampaignId) return;
    const nextStatus = c.status === "active" ? "PAUSED" : "ACTIVE";
    setUpdatingId(c.id);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/campaigns/meta/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignDocId: c.id,
          adId: c.platformCampaignId,
          status: nextStatus,
        }),
      });
      if (!res.ok) throw new Error("update failed");
      setCampaigns((prev) =>
        prev.map((x) =>
          x.id === c.id
            ? { ...x, status: nextStatus === "ACTIVE" ? "active" : "paused" }
            : x
        )
      );
      toast(
        "success",
        nextStatus === "ACTIVE"
          ? isKo
            ? "재개됨"
            : "Resumed"
          : isKo
          ? "일시정지됨"
          : "Paused"
      );
    } catch {
      toast("error", isKo ? "변경 실패" : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClone = async (c: CampaignDoc) => {
    setCloningId(c.id);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch(`/api/campaigns/${c.id}/clone`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "clone failed");
      }
      toast("success", isKo ? "복제됨 (일시정지 상태)" : "Cloned (paused)");
      load();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : isKo ? "복제 실패" : "Clone failed");
    } finally {
      setCloningId(null);
    }
  };

  const statusBadge = (s: string) => {
    if (s === "active")
      return <Badge variant="success">{isKo ? "운영중" : "Active"}</Badge>;
    if (s === "paused")
      return <Badge variant="warning">{isKo ? "일시정지" : "Paused"}</Badge>;
    return <Badge>{s}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isKo ? "캠페인" : "Campaigns"}
          </h1>
          <p className="mt-1 text-gray-600">
            {isKo
              ? "메타 광고 캠페인을 ROAS 자동화 루프로 운영하세요."
              : "Run your Meta ad campaigns on the ROAS optimization loop."}
          </p>
        </div>
        <Link href="/projects/new">
          <Button disabled={!metaConnected}>
            <Plus className="mr-2 h-4 w-4" />
            {isKo ? "새 캠페인" : "New Campaign"}
          </Button>
        </Link>
      </div>

      {!metaConnected && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {isKo
                    ? "캠페인을 만들려면 먼저 메타 광고 계정을 연결하세요."
                    : "Connect your Meta ad account first to create campaigns."}
                </p>
                <Link href="/settings">
                  <Button className="mt-3" size="sm">
                    {isKo ? "메타 연결하기" : "Connect Meta"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {metaConnected && loading && (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {metaConnected && !loading && campaigns.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 font-medium text-gray-900">
              {isKo ? "아직 캠페인이 없습니다" : "No campaigns yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isKo
                ? "프로젝트를 만들고 광고 소재를 생성한 뒤 캠페인을 발행하세요."
                : "Create a project, generate creatives, then launch a campaign."}
            </p>
            <Link href="/projects/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                {isKo ? "프로젝트 만들기" : "Create a project"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {metaConnected && !loading && campaigns.length > 0 && (
        <div className="mt-6 space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-4">
                {/* Creative thumbnail */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {c.creativeThumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.creativeThumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                      no img
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-gray-900">{c.name}</p>
                    {statusBadge(c.status)}
                    <Badge variant="info">{c.platform.toUpperCase()}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    {c.projectName && (
                      <span className="text-gray-400">📁 {c.projectName}</span>
                    )}
                    {c.budget && (
                      <span>
                        ${c.budget.amount}/{isKo ? "일" : "day"}
                      </span>
                    )}
                    {c.optimizationEnabled && c.targetRoas != null && (
                      <span className="inline-flex items-center gap-1 text-violet-700">
                        <Target className="h-3 w-3" />
                        {isKo ? "목표" : "Target"} {c.targetRoas}x ROAS
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={updatingId === c.id}
                    onClick={() => handleToggleStatus(c)}
                  >
                    {c.status === "active" ? (
                      <>
                        <Pause className="mr-1 h-3.5 w-3.5" />
                        {isKo ? "일시정지" : "Pause"}
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 h-3.5 w-3.5" />
                        {isKo ? "재개" : "Resume"}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={cloningId === c.id}
                    onClick={() => handleClone(c)}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    {isKo ? "복제" : "Clone"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
