"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Users, DollarSign, Clock, Plus } from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";

export default function BrowseProgramsPage() {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  async function loadPrograms() {
    const q = query(
      collection(getDb(), "affiliatePrograms"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setPrograms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AffiliateProgram));
    setLoading(false);
  }

  useEffect(() => { loadPrograms(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/affiliates/seed", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast("success", "데모 프로그램이 생성되었습니다!");
        await loadPrograms();
      } else {
        throw new Error("Seed failed");
      }
    } catch {
      toast("error", "데모 생성 실패");
    }
    setSeeding(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제휴 프로그램 둘러보기</h1>
          <p className="mt-1 text-sm text-gray-500">제품을 홍보하고 커미션을 받으세요</p>
        </div>
        {programs.length === 0 && (
          <Button onClick={handleSeed} loading={seeding} variant="outline" size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            데모 프로그램 생성
          </Button>
        )}
      </div>

      {programs.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">프로그램이 없습니다</p>
            <p className="mt-1 text-sm text-gray-500">데모 프로그램을 생성해서 테스트해보세요</p>
            <Button onClick={handleSeed} loading={seeding} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              데모 프로그램 생성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Link key={program.id} href={`/affiliates/${program.id}`}>
              <Card className="h-full transition-all hover:shadow-md hover:border-indigo-200">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900">{program.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{program.description}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-bold text-gray-900">
                        {program.commissionValue}{program.commissionType === "percentage" ? "%" : "$"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">{program.cookieDurationDays}일</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-gray-600">{program.totalAffiliates}</span>
                    </div>
                  </div>
                  <Badge variant="success" className="mt-3">참여 가능</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
