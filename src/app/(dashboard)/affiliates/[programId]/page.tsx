"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  DollarSign,
  Clock,
  Users,
  Link as LinkIcon,
  Check,
  Copy,
} from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.programId as string;
  const { profile, activeRole } = useAuth();
  const { toast } = useToast();

  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(getDb(), "affiliatePrograms", programId));
      if (snap.exists()) {
        setProgram({ id: snap.id, ...snap.data() } as AffiliateProgram);
      }
      setLoading(false);
    }
    load();
  }, [programId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/affiliates/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ programId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const data = await res.json();
      setAffiliateCode(data.code);
      toast(
        "success",
        data.alreadyJoined
          ? "You already joined this program!"
          : "Successfully joined!"
      );
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Failed to join"
      );
    } finally {
      setJoining(false);
    }
  };

  const trackingUrl = affiliateCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/track?code=${affiliateCode}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="py-20 text-center text-gray-500">Program not found</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{program.name}</h1>
            <Badge variant="success">{program.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">{program.description}</p>

          <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
            <div className="text-center">
              <DollarSign className="mx-auto h-5 w-5 text-green-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {program.commissionValue}
                {program.commissionType === "percentage" ? "%" : "$"}
              </p>
              <p className="text-xs text-gray-500">Per Referral</p>
            </div>
            <div className="text-center">
              <Clock className="mx-auto h-5 w-5 text-blue-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {program.cookieDurationDays}
              </p>
              <p className="text-xs text-gray-500">Day Cookie</p>
            </div>
            <div className="text-center">
              <Users className="mx-auto h-5 w-5 text-purple-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {program.totalAffiliates}
              </p>
              <p className="text-xs text-gray-500">Affiliates</p>
            </div>
          </div>

          {affiliateCode ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="h-5 w-5" />
                  <p className="font-medium">
                    You&apos;re in! Here&apos;s your tracking link:
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded bg-white px-3 py-2 text-sm border border-green-200 break-all">
                    {trackingUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(trackingUrl || "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Share this link with your audience. You&apos;ll earn{" "}
                {program.commissionValue}
                {program.commissionType === "percentage" ? "%" : "$"} for every
                referred conversion.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              loading={joining}
              className="w-full"
              size="lg"
              disabled={activeRole !== "influencer"}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              {activeRole === "influencer"
                ? "Join Program"
                : "Influencer 모드로 전환하여 참여하세요"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
