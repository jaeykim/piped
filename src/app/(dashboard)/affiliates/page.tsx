"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Users, DollarSign, Clock } from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";

export default function BrowseProgramsPage() {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = query(
        collection(getDb(), "affiliatePrograms"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setPrograms(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AffiliateProgram)
      );
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Browse Affiliate Programs
      </h1>
      <p className="mt-2 text-gray-600">
        Find products to promote and earn commissions.
      </p>

      {programs.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              No Programs Yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Check back soon for new affiliate opportunities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Link key={program.id} href={`/affiliates/${program.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900">
                    {program.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {program.description}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-medium">
                        {program.commissionValue}
                        {program.commissionType === "percentage" ? "%" : "$"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{program.cookieDurationDays}d cookie</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="info">
                      {program.totalAffiliates} affiliates
                    </Badge>
                    <span className="text-xs text-indigo-600 font-medium">
                      Join &rarr;
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
