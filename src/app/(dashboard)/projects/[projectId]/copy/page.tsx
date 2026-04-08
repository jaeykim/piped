"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";
import type { CopyVariant, CopyType } from "@/types/copy";

const LANGUAGES = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
];

const TYPE_ORDER: CopyType[] = ["headline", "description_short", "ad_meta", "ad_google", "cta", "social", "description_long"];

export default function CopyPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const { t, locale } = useLocale();
  const isKo = locale.startsWith("ko");

  // Auto-detect language from locale
  const defaultLang = LANGUAGES.find((l) => locale.startsWith(l.code))?.code || "ko";
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLang);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const typeLabels: Record<CopyType, string> = {
    headline: t.copy.headlines,
    description_short: t.copy.shortDesc,
    description_long: t.copy.longDesc,
    ad_meta: t.copy.metaAds,
    ad_google: t.copy.googleAds,
    social: t.copy.socialPosts,
    cta: t.copy.ctas,
  };

  const loadVariants = useCallback(async () => {
    const token = await getAuth_().currentUser?.getIdToken();
    const res = await fetch(`/api/projects/${projectId}?include=copy`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { project } = await res.json();
      setVariants((project?.copyVariants ?? []) as CopyVariant[]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const langLabel = LANGUAGES.find((l) => l.code === selectedLanguage)?.label;
      const res = await fetch("/api/copy/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          language: langLabel,
          country: selectedLanguage === "ko" ? "대한민국" : selectedLanguage === "ja" ? "日本" : selectedLanguage === "zh" ? "中国" : "Global",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast("success", t.copy.generated);
      await loadVariants();
      refreshProfile();
    } catch (error) {
      toast("error", error instanceof Error ? error.message : t.common.error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveEdit = async (variantId: string) => {
    const token = await getAuth_().currentUser?.getIdToken();
    await fetch(`/api/copy/${variantId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ editedContent: editText }),
    });
    setEditingId(null);
    loadVariants();
    toast("success", t.copy.copyUpdated);
  };

  const langInfo = LANGUAGES.find((l) => l.code === selectedLanguage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // ─── No variants: simple generate button ───
  if (variants.length === 0 && !generating) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">{t.copy.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{isKo ? "AI가 광고 문구를 자동으로 생성합니다" : "AI generates ad copy automatically"}</p>

        <Card className="mt-8">
          <CardContent className="py-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-indigo-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              {isKo ? "광고 문구 생성" : "Generate Ad Copy"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isKo ? "헤드라인, 설명, 광고 카피, CTA를 한번에 만들어줍니다" : "Headlines, descriptions, ad copy, and CTAs — all at once"}
            </p>

            {/* Language selector — compact inline */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">{isKo ? "언어:" : "Language:"}</span>
              <div className="relative">
                <button
                  onClick={() => setShowLangPicker(!showLangPicker)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:border-gray-300"
                >
                  <span>{langInfo?.flag}</span>
                  <span className="font-medium">{langInfo?.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
                {showLangPicker && (
                  <div className="absolute top-full left-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setSelectedLanguage(l.code); setShowLangPicker(false); }}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 ${
                          selectedLanguage === l.code ? "bg-indigo-50 text-indigo-700" : ""
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleGenerate} size="lg" className="mt-6">
              <Sparkles className="mr-2 h-4 w-4" />
              {t.copy.generateButton} (10 {t.common.credits})
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Generating state ───
  if (generating) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">{t.copy.title}</h1>
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-lg font-medium text-gray-900">{t.copy.generating}</p>
            <p className="mt-1 text-sm text-gray-500">{t.copy.generatingDesc}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Results — flat card list grouped by type ───
  const sortedVariants = [...variants].sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a.type);
    const bi = TYPE_ORDER.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Group by type
  let lastType: CopyType | null = null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.copy.title}</h1>
        <Button variant="outline" onClick={handleGenerate} loading={generating} size="sm">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          {isKo ? "다시 생성" : "Regenerate"}
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {sortedVariants.map((v) => {
          const displayContent = v.editedContent || v.content;
          const isAd = v.type === "ad_meta" || v.type === "ad_google";
          let adData: Record<string, string> | null = null;
          if (isAd) { try { adData = JSON.parse(displayContent); } catch {} }

          // Section header when type changes
          const showHeader = v.type !== lastType;
          lastType = v.type;

          return (
            <div key={v.id}>
              {showHeader && (
                <p className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {typeLabels[v.type]}
                </p>
              )}
              <Card className="group">
                <CardContent className="flex items-start gap-3 py-3">
                  {editingId === v.id ? (
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(v.id)}>
                          <Check className="mr-1 h-3 w-3" />{isKo ? "저장" : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="mr-1 h-3 w-3" />{isKo ? "취소" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => { setEditingId(v.id); setEditText(displayContent); }}
                      >
                        {adData ? (
                          <div className="space-y-1 text-sm">
                            {Object.entries(adData).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium text-gray-400 text-xs">{key}: </span>
                                <span className="text-gray-900">{value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{displayContent}</p>
                        )}
                        {v.isEdited && (
                          <Badge variant="info" className="mt-1 text-[10px]">{isKo ? "수정됨" : "Edited"}</Badge>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(v.id, displayContent)}
                        className="shrink-0 rounded p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      >
                        {copiedId === v.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Next Step */}
      <div className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <ImageIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{t.copy.nextCreatives}</p>
            <p className="text-sm text-gray-500">{t.copy.nextCreativesDesc}</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/creatives`}>
          <Button>
            {t.copy.continue}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
