"use client";

import { BarChart3 } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  const { locale } = useLocale();
  const isKo = locale.startsWith("ko");

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isKo ? "리포트" : "Reports"}
        </h1>
        <p className="mt-1 text-gray-600">
          {isKo
            ? "지출, CTR, CPA, ROAS를 일별로 추적하세요."
            : "Track daily spend, CTR, CPA, and ROAS across all campaigns."}
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="py-16 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 font-medium text-gray-900">
            {isKo ? "지표 대시보드 준비 중" : "Metrics dashboard coming soon"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {isKo
              ? "메타 인사이트 API 기반 일별 차트와 캠페인별 ROAS 리포트가 곧 공개됩니다."
              : "Daily charts and per-campaign ROAS reports powered by Meta Insights API are on the way."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
