"use client";

import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CampaignsPage() {
  const { profile } = useAuth();
  const { locale } = useLocale();
  const isKo = locale.startsWith("ko");
  const metaConnected = !!profile?.integrations?.meta?.accessToken;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isKo ? "캠페인" : "Campaigns"}
          </h1>
          <p className="mt-1 text-gray-600">
            {isKo
              ? "메타 광고 캠페인을 생성하고 ROAS 자동화 루프를 돌리세요."
              : "Create Meta ad campaigns and run them on the ROAS optimization loop."}
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
            <p className="text-sm font-medium text-amber-900">
              {isKo
                ? "캠페인을 만들려면 먼저 메타 광고 계정을 연결하세요."
                : "Connect your Meta ad account first to create campaigns."}
            </p>
            <Link href="/settings">
              <Button className="mt-4" size="sm">
                {isKo ? "메타 연결하기" : "Connect Meta"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {metaConnected && (
        <Card className="mt-6">
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 font-medium text-gray-900">
              {isKo ? "아직 캠페인이 없습니다" : "No campaigns yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isKo
                ? "캠페인 위저드는 곧 공개됩니다. 그 전까지 프로젝트에서 광고 소재를 만들어두세요."
                : "Campaign wizard coming soon. Generate creatives in projects in the meantime."}
            </p>
            <Link href="/projects/new">
              <Button className="mt-4" variant="outline">
                {isKo ? "프로젝트 만들기" : "Create a project"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
