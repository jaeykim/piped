"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Megaphone, TrendingUp, DollarSign, Eye, MousePointer, ArrowRight, Users } from "lucide-react";
import type { Campaign } from "@/types/campaign";

export default function CampaignsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = query(
        collection(getDb(), "campaigns"),
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setCampaigns(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign)
      );
      setLoading(false);
    }
    load();
  }, [projectId]);

  const statusVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
    draft: "default",
    pending: "warning",
    active: "success",
    paused: "info",
    completed: "default",
    error: "error",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <Link href={`/projects/${projectId}/campaigns/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-orange-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              No Campaigns Yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Launch your first ad campaign on Meta or Google.
            </p>
            <Link href={`/projects/${projectId}/campaigns/new`}>
              <Button className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {campaign.name}
                      </p>
                      <Badge variant={statusVariant[campaign.status]}>
                        {campaign.status}
                      </Badge>
                      <Badge>
                        {campaign.platform === "meta" ? "Meta Ads" : "Google Ads"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {campaign.objective} &middot; ${campaign.budget.amount}/
                      {campaign.budget.type}
                    </p>
                  </div>
                </div>

                {campaign.metrics && (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {[
                      { label: "노출", value: campaign.metrics.impressions.toLocaleString(), icon: Eye },
                      { label: "클릭", value: campaign.metrics.clicks.toLocaleString(), icon: MousePointer },
                      { label: "CTR", value: `${(campaign.metrics.ctr || 0).toFixed(2)}%`, icon: MousePointer },
                      { label: "지출", value: `$${campaign.metrics.spend.toFixed(2)}`, icon: DollarSign },
                      { label: "CPC", value: `$${(campaign.metrics.cpc || 0).toFixed(2)}`, icon: DollarSign },
                      { label: "전환", value: campaign.metrics.conversions.toString(), icon: TrendingUp },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="text-center">
                          <Icon className="mx-auto h-4 w-4 text-gray-400" />
                          <p className="mt-1 text-lg font-semibold text-gray-900">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Next Step */}
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Next: Affiliate Program</p>
            <p className="text-sm text-gray-500">Let influencers promote your product and earn commissions</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/affiliates`}>
          <Button>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
