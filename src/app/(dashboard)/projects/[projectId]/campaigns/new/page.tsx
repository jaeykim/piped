"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  ArrowRight,
  Megaphone,
  Target,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import type { CopyVariant } from "@/types/copy";
import type { Creative } from "@/types/creative";
import type { SiteAnalysis } from "@/types/analysis";

type Step = "platform" | "content" | "targeting" | "budget" | "review";

const steps: { id: Step; label: string }[] = [
  { id: "platform", label: "Platform" },
  { id: "content", label: "Content" },
  { id: "targeting", label: "Targeting" },
  { id: "budget", label: "Budget" },
  { id: "review", label: "Review" },
];

export default function NewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("platform");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [copyVariants, setCopyVariants] = useState<CopyVariant[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);

  // Campaign config
  const [platform, setPlatform] = useState<"meta" | "google">("meta");
  const [selectedCopy, setSelectedCopy] = useState<string>("");
  const [selectedCreative, setSelectedCreative] = useState<string>("");
  const [targeting, setTargeting] = useState({
    ageMin: 18,
    ageMax: 65,
    locations: "US",
    interests: "",
  });
  const [budget, setBudget] = useState({ amount: 20, type: "daily" as const });
  const [campaignName, setCampaignName] = useState("");

  useEffect(() => {
    async function load() {
      const [analysisSnap, copySnap, creativeSnap] = await Promise.all([
        getDoc(doc(getDb(), "projects", projectId, "analysis", "result")),
        getDocs(
          query(
            collection(getDb(), "projects", projectId, "copyVariants"),
            orderBy("createdAt", "desc")
          )
        ),
        getDocs(
          query(
            collection(getDb(), "projects", projectId, "creatives"),
            orderBy("createdAt", "desc")
          )
        ),
      ]);

      if (analysisSnap.exists()) {
        const data = analysisSnap.data() as SiteAnalysis;
        setAnalysis(data);
        setCampaignName(`${data.productName} - Campaign`);
      }

      setCopyVariants(
        copySnap.docs.map((d) => ({ id: d.id, ...d.data() }) as CopyVariant)
      );
      setCreatives(
        creativeSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Creative)
          .filter((c) => c.status === "ready")
      );
      setLoading(false);
    }
    load();
  }, [projectId]);

  const currentStepIndex = steps.findIndex((s) => s.id === step);
  const canNext = () => {
    if (step === "content") return selectedCopy && selectedCreative;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const endpoint =
        platform === "meta"
          ? "/api/campaigns/meta/create"
          : "/api/campaigns/google/create";

      const copyData = copyVariants.find((c) => c.id === selectedCopy);
      const creativeData = creatives.find((c) => c.id === selectedCreative);

      const body: Record<string, unknown> = {
        projectId,
        name: campaignName,
        objective: "traffic",
        dailyBudget: budget.amount,
        targeting: {
          ageMin: targeting.ageMin,
          ageMax: targeting.ageMax,
          locations: targeting.locations.split(",").map((s) => s.trim()),
        },
      };

      if (platform === "meta") {
        let adData = { primaryText: "", headline: "", description: "" };
        try {
          adData = JSON.parse(copyData?.content || "{}");
        } catch {
          adData = {
            primaryText: copyData?.content || "",
            headline: analysis?.productName || "",
            description: "",
          };
        }
        body.creativeUrl = creativeData?.imageUrl;
        body.primaryText = adData.primaryText;
        body.headline = adData.headline;
        body.linkDescription = adData.description;
        body.destinationUrl = analysis?.metaTags?.ogTitle
          ? `https://${analysis.metaTags.ogTitle}`
          : "";
      } else {
        body.headlines = [
          analysis?.productName || "Try It Now",
          "Get Started Free",
          "Learn More",
        ];
        body.descriptions = [
          copyData?.content || analysis?.valueProposition || "",
          analysis?.valueProposition || "",
        ];
        body.finalUrl = analysis?.metaTags?.ogTitle || "";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast("success", "Campaign created successfully!");
      router.push(`/projects/${projectId}/campaigns`);
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Campaign creation failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                i < currentStepIndex
                  ? "bg-green-100 text-green-700"
                  : i === currentStepIndex
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < currentStepIndex ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm ${
                i === currentStepIndex
                  ? "font-medium text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="mx-3 h-px w-8 bg-gray-200" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="mt-6">
        <CardContent className="p-6">
          {step === "platform" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Choose Platform</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["meta", "google"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      platform === p
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Megaphone className="h-6 w-6 text-indigo-600" />
                    <p className="mt-2 font-medium">
                      {p === "meta" ? "Meta Ads" : "Google Ads"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {p === "meta"
                        ? "Facebook & Instagram ads"
                        : "Search & display ads"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "content" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Select Ad Copy</h2>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {copyVariants
                    .filter((c) =>
                      platform === "meta"
                        ? c.type === "ad_meta" || c.type === "headline"
                        : c.type === "ad_google" || c.type === "headline"
                    )
                    .map((c) => (
                      <label
                        key={c.id}
                        className={`block cursor-pointer rounded-lg border p-3 text-sm ${
                          selectedCopy === c.id
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="copy"
                          value={c.id}
                          checked={selectedCopy === c.id}
                          onChange={() => setSelectedCopy(c.id)}
                          className="sr-only"
                        />
                        {c.content.length < 200
                          ? c.content
                          : c.content.slice(0, 200) + "..."}
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Select Creative</h2>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {creatives.filter((c) => c.imageUrl).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCreative(c.id)}
                      className={`overflow-hidden rounded-lg border-2 ${
                        selectedCreative === c.id
                          ? "border-indigo-600"
                          : "border-gray-200"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.imageUrl}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "targeting" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Targeting
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Min Age"
                  type="number"
                  value={targeting.ageMin}
                  onChange={(e) =>
                    setTargeting({ ...targeting, ageMin: +e.target.value })
                  }
                />
                <Input
                  label="Max Age"
                  type="number"
                  value={targeting.ageMax}
                  onChange={(e) =>
                    setTargeting({ ...targeting, ageMax: +e.target.value })
                  }
                />
              </div>
              <Input
                label="Locations (comma-separated country codes)"
                value={targeting.locations}
                onChange={(e) =>
                  setTargeting({ ...targeting, locations: e.target.value })
                }
                placeholder="US, GB, CA"
              />
              <Input
                label="Interests (optional)"
                value={targeting.interests}
                onChange={(e) =>
                  setTargeting({ ...targeting, interests: e.target.value })
                }
                placeholder="Technology, Startups, SaaS"
              />
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget
              </h2>
              <Input
                label="Campaign Name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
              <Input
                label="Daily Budget (USD)"
                type="number"
                value={budget.amount}
                onChange={(e) =>
                  setBudget({ ...budget, amount: +e.target.value })
                }
              />
              <p className="text-sm text-gray-500">
                Estimated monthly spend: ${(budget.amount * 30).toLocaleString()}
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Review Campaign</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Platform</span>
                  <span className="font-medium">
                    {platform === "meta" ? "Meta Ads" : "Google Ads"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium">{campaignName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Daily Budget</span>
                  <span className="font-medium">${budget.amount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Targeting</span>
                  <span className="font-medium">
                    Ages {targeting.ageMin}-{targeting.ageMax},{" "}
                    {targeting.locations}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-yellow-600">
                    Will be created as PAUSED
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-4 flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const prev = steps[currentStepIndex - 1];
            if (prev) setStep(prev.id);
            else router.back();
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step === "review" ? (
          <Button onClick={handleSubmit} loading={submitting}>
            <Megaphone className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        ) : (
          <Button
            onClick={() => {
              const next = steps[currentStepIndex + 1];
              if (next) setStep(next.id);
            }}
            disabled={!canNext()}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
