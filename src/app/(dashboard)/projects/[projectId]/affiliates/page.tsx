"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { Users, Plus, Link as LinkIcon, TrendingUp, Eye, DollarSign } from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";
import type { SiteAnalysis } from "@/types/analysis";

export default function AffiliatesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    commissionType: "percentage" as "percentage" | "fixed",
    commissionValue: 15,
    cookieDurationDays: 30,
  });

  useEffect(() => {
    async function load() {
      // Get analysis for product name
      const analysisSnap = await getDoc(
        doc(getDb(), "projects", projectId, "analysis", "result")
      );
      if (analysisSnap.exists()) {
        const data = analysisSnap.data() as SiteAnalysis;
        setAnalysis(data);
        setForm((f) => ({
          ...f,
          name: `${data.productName} Affiliate Program`,
          description: `Promote ${data.productName} and earn commissions on every referral.`,
        }));
      }

      // Check for existing program
      const programsSnap = await getDocs(
        query(
          collection(getDb(), "affiliatePrograms"),
          where("projectId", "==", projectId)
        )
      );
      if (!programsSnap.empty) {
        setProgram({
          id: programsSnap.docs[0].id,
          ...programsSnap.docs[0].data(),
        } as AffiliateProgram);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/affiliates/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          ...form,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast("success", "Affiliate program created!");
      // Reload
      const data = await res.json();
      setProgram({
        id: data.programId,
        ...form,
        projectId,
        ownerId: profile!.uid,
        status: "active",
        totalAffiliates: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AffiliateProgram);
      setShowForm(false);
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Creation failed"
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (program) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">{program.name}</h2>
              </div>
              <Badge variant="success">{program.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{program.description}</p>

            <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {program.commissionValue}
                  {program.commissionType === "percentage" ? "%" : "$"}
                </p>
                <p className="text-xs text-gray-500">Commission</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {program.cookieDurationDays}d
                </p>
                <p className="text-xs text-gray-500">Cookie Duration</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {program.totalAffiliates}
                </p>
                <p className="text-xs text-gray-500">Affiliates</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700">
                Share this link with influencers:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/affiliates/${program.id}`
                    : `/affiliates/${program.id}`}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/affiliates/${program.id}`
                    );
                    toast("success", "Link copied!");
                  }}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-green-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              Create an Affiliate Program
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Let influencers promote {analysis?.productName || "your product"}{" "}
              and earn commissions.
            </p>
            <Button onClick={() => setShowForm(true)} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Set Up Program
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">
        Create Affiliate Program
      </h1>

      <Card className="mt-6">
        <CardContent className="p-6 space-y-4">
          <Input
            label="Program Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Type
              </label>
              <select
                value={form.commissionType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commissionType: e.target.value as "percentage" | "fixed",
                  })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <Input
              label={`Commission Value (${form.commissionType === "percentage" ? "%" : "$"})`}
              type="number"
              value={form.commissionValue}
              onChange={(e) =>
                setForm({ ...form, commissionValue: +e.target.value })
              }
            />
          </div>

          <Input
            label="Cookie Duration (days)"
            type="number"
            value={form.cookieDurationDays}
            onChange={(e) =>
              setForm({ ...form, cookieDurationDays: +e.target.value })
            }
          />

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} loading={creating}>
              Create Program
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
