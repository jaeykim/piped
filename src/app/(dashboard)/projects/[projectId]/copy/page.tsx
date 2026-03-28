"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  Heart,
  Edit3,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import type { CopyVariant, CopyType } from "@/types/copy";

const typeLabels: Record<CopyType, string> = {
  headline: "Headlines",
  description_short: "Short Descriptions",
  description_long: "Long Descriptions",
  ad_meta: "Meta Ads",
  ad_google: "Google Ads",
  social: "Social Posts",
  cta: "CTAs",
};

function CopyCard({
  variant,
  projectId,
  onUpdate,
}: {
  variant: CopyVariant;
  projectId: string;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(variant.editedContent || variant.content);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const isAdCopy = variant.type === "ad_meta" || variant.type === "ad_google";
  let displayContent = variant.editedContent || variant.content;
  let adData: Record<string, string> | null = null;

  if (isAdCopy) {
    try {
      adData = JSON.parse(displayContent);
    } catch {
      // Not JSON, display as-is
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFavorite = async () => {
    await updateDoc(
      doc(getDb(), "projects", projectId, "copyVariants", variant.id),
      { isFavorited: !variant.isFavorited }
    );
    onUpdate();
  };

  const handleSaveEdit = async () => {
    await updateDoc(
      doc(getDb(), "projects", projectId, "copyVariants", variant.id),
      { editedContent: editText, isEdited: true }
    );
    setEditing(false);
    onUpdate();
    toast("success", "Copy updated");
  };

  return (
    <Card className="group">
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="mr-1 h-3 w-3" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {adData ? (
              <div className="space-y-2 text-sm">
                {Object.entries(adData).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium text-gray-500">{key}: </span>
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {displayContent}
              </p>
            )}
            {variant.isEdited && (
              <Badge variant="info" className="mt-2">
                Edited
              </Badge>
            )}
            <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleFavorite}
                className={`rounded p-1.5 hover:bg-gray-100 ${
                  variant.isFavorited
                    ? "text-red-500"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Favorite"
              >
                <Heart
                  className="h-4 w-4"
                  fill={variant.isFavorited ? "currentColor" : "none"}
                />
              </button>
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Edit"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function CopyPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const loadVariants = async () => {
    const q = query(
      collection(getDb(), "projects", projectId, "copyVariants"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setVariants(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CopyVariant)
    );
    setLoading(false);
  };

  useEffect(() => {
    loadVariants();
  }, [projectId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/copy/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast("success", "Marketing copy generated!");
      await loadVariants();
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Generation failed"
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Copy</h1>
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-indigo-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              Generate Marketing Copy
            </p>
            <p className="mt-1 text-sm text-gray-500">
              AI will create headlines, descriptions, ad copy, and social posts
              based on your website analysis.
            </p>
            <Button
              onClick={handleGenerate}
              loading={generating}
              className="mt-6"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate All Copy
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const types = Object.keys(typeLabels) as CopyType[];
  const tabs = types
    .filter((type) => variants.some((v) => v.type === type))
    .map((type) => ({
      id: type,
      label: `${typeLabels[type]} (${variants.filter((v) => v.type === type).length})`,
      content: (
        <div className="space-y-3">
          {variants
            .filter((v) => v.type === type)
            .map((v) => (
              <CopyCard
                key={v.id}
                variant={v}
                projectId={projectId}
                onUpdate={loadVariants}
              />
            ))}
        </div>
      ),
    }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Copy</h1>
        <Button
          variant="outline"
          onClick={handleGenerate}
          loading={generating}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate All
        </Button>
      </div>
      <div className="mt-6">
        <Tabs tabs={tabs} />
      </div>

      {/* Next Step */}
      <div className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <ImageIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Next: Generate Ad Creatives</p>
            <p className="text-sm text-gray-500">Create stunning visuals powered by Nano Banana 2</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/creatives`}>
          <Button>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
