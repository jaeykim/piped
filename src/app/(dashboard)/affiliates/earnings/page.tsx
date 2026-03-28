"use client";

import { useEffect, useState } from "react";
import { getAuth_ } from "@/lib/firebase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DollarSign, MousePointer, TrendingUp, Zap } from "lucide-react";

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

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/affiliates/earnings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Earnings",
      value: `$${(data?.totalEarnings || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Clicks",
      value: (data?.totalClicks || 0).toLocaleString(),
      icon: MousePointer,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Conversions",
      value: (data?.totalConversions || 0).toString(),
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Conversion Rate",
      value:
        data?.totalClicks
          ? `${(((data.totalConversions || 0) / data.totalClicks) * 100).toFixed(1)}%`
          : "0%",
      icon: Zap,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
      <p className="mt-2 text-gray-600">
        Track your affiliate performance and commissions.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data?.links && data.links.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Performance by Program
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Program</th>
                    <th className="pb-3 font-medium text-right">Clicks</th>
                    <th className="pb-3 font-medium text-right">
                      Conversions
                    </th>
                    <th className="pb-3 font-medium text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.links.map((link) => (
                    <tr key={link.id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">
                          {link.program?.name || "Unknown"}
                        </p>
                        <code className="text-xs text-gray-400">
                          {link.code}
                        </code>
                      </td>
                      <td className="py-3 text-right text-gray-700">
                        {link.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-gray-700">
                        {link.conversions}
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        ${link.earnings.toFixed(2)}
                      </td>
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
