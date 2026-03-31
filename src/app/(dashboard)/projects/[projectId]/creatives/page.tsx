"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import {
  Image,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Megaphone,
  CheckCircle,
  Type,
  Zap,
  Star,
  Clock,
  Heart,
  Target,
  X,
  Edit3,
  Package,
  Video,
  ArrowLeftRight,
  Timer,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import {
  CREATIVE_CONCEPTS,
  CREATIVE_SUBJECTS,
  type CreativeConcept,
  type CreativeSubject,
} from "@/types/creative";
import { AD_STYLE_REFERENCES } from "@/lib/services/style-references";
import type { CopyVariant } from "@/types/copy";
import { CreativeEditor, type CreativeEditorData } from "@/components/creative-editor";
import { CreativePreview } from "@/components/creative-preview";

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

const COUNTRIES = [
  { code: "KR", label: "대한민국", flag: "🇰🇷" },
  { code: "US", label: "미국", flag: "🇺🇸" },
  { code: "JP", label: "일본", flag: "🇯🇵" },
  { code: "CN", label: "중국", flag: "🇨🇳" },
  { code: "GB", label: "영국", flag: "🇬🇧" },
  { code: "DE", label: "독일", flag: "🇩🇪" },
  { code: "FR", label: "프랑스", flag: "🇫🇷" },
  { code: "BR", label: "브라질", flag: "🇧🇷" },
  { code: "IN", label: "인도", flag: "🇮🇳" },
  { code: "VN", label: "베트남", flag: "🇻🇳" },
  { code: "TH", label: "태국", flag: "🇹🇭" },
  { code: "GLOBAL", label: "글로벌 (전체)", flag: "🌏" },
];

interface DerivedFormat {
  size: string;
  label: string;
  platform: string;
  baseImage: string;
}

interface GeneratedCreative {
  id: string;
  baseImage: string;
  hookText: string;
  subheadline: string;
  cta: string;
  productName: string;
  brandColor: string;
  isComplete: boolean; // true = graphic card with text baked in, no overlay needed
  size: string;
  platform: string;
  concept: CreativeConcept;
  formats: DerivedFormat[];
}

const CONCEPT_ICONS: Record<CreativeConcept, typeof Zap> = {
  "benefit-driven": Zap,
  "pain-point": Target,
  "social-proof": Star,
  offer: Clock,
  "how-it-works": ArrowRight,
  "before-after": ArrowLeftRight,
  comparison: ArrowLeftRight,
  urgency: Timer,
  story: BookOpen,
  question: HelpCircle,
};

type OutputType = "image" | "video" | "batch";
type Step = "output-type" | "copy" | "concept" | "generate";

export default function CreativesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const { t, locale } = useLocale();
  const isKo = locale.startsWith("ko");

  // Recommendation state
  interface Recommendation { concept: CreativeConcept; subject: CreativeSubject; reason: string }
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Wizard state
  const [step, setStep] = useState<Step>("output-type");
  const [outputType, setOutputType] = useState<OutputType>("image");
  const [selectedLanguage, setSelectedLanguage] = useState("ko");
  const [selectedCountry, setSelectedCountry] = useState("KR");
  const [selectedConcept, setSelectedConcept] = useState<CreativeConcept | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<CreativeSubject>("graphic-card");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // base64 data URL
  const [copyVariants, setCopyVariants] = useState<CopyVariant[]>([]);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [appealPoints, setAppealPoints] = useState<{ text: string; role: "primary" | "secondary" | "none" }[]>([]);
  const [customCta, setCustomCta] = useState("");

  // Generation state
  const [creative, setCreative] = useState<GeneratedCreative | null>(null);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingCreative, setEditingCreative] = useState<CreativeEditorData | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasCampaigns, setHasCampaigns] = useState(false);
  const [batchResults, setBatchResults] = useState<{ id: string; baseImage: string; hookText: string; concept: string; subject: string; isComplete: boolean }[]>([]);

  // Load project settings (language/country from copy step)
  useEffect(() => {
    async function loadProjectSettings() {
      const snap = await getDoc(doc(getDb(), "projects", projectId));
      const data = snap.data();
      if (data?.language) {
        const match = LANGUAGES.find((l) => l.label === data.language);
        if (match) setSelectedLanguage(match.code);
      }
      if (data?.country) {
        const match = COUNTRIES.find((c) => c.label === data.country);
        if (match) setSelectedCountry(match.code);
      }
      // Check if already past creatives stage
      const stage = data?.pipelineStage;
      if (stage === "campaigns" || stage === "affiliates") {
        setHasCampaigns(true);
      }
    }
    loadProjectSettings();

    // Fetch AI recommendations
    async function loadRecommendations() {
      setLoadingRecs(true);
      try {
        const token = await getAuth_().currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/creatives/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ projectId, language: selectedLanguage }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.recommendations?.length) {
            setRecommendations(data.recommendations);
            // Auto-select the top recommendation
            setSelectedConcept(data.recommendations[0].concept);
            setSelectedSubject(data.recommendations[0].subject);
          }
        }
      } catch (e) { console.error("Recommendations failed:", e); }
      setLoadingRecs(false);
    }
    loadRecommendations();
  }, [projectId]);

  const loadCopyVariants = useCallback(async () => {
    setLoadingCopy(true);
    try {
      const q = query(
        collection(getDb(), "projects", projectId, "copyVariants"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const variants = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CopyVariant);
      setCopyVariants(variants);
      // Auto-select the first headline as default overlay text
      if (!selectedCopy) {
        const firstHeadline = variants.find((v) => v.type === "headline");
        if (firstHeadline) {
          const content = firstHeadline.isEdited && firstHeadline.editedContent
            ? firstHeadline.editedContent
            : firstHeadline.content;
          setSelectedCopy(content);
        }
      }
    } catch (error) {
      console.error("Failed to load copy variants:", error);
    }
    setLoadingCopy(false);
  }, [projectId]);

  useEffect(() => {
    loadCopyVariants();
  }, [loadCopyVariants]);

  // Generate appeal points from copy variants when entering copy step
  useEffect(() => {
    if (step === "copy" && appealPoints.length === 0 && copyVariants.length > 0) {
      const points = copyVariants
        .filter((v) => ["headline", "description_short"].includes(v.type))
        .slice(0, 8)
        .map((v, i) => ({
          text: v.isEdited && v.editedContent ? v.editedContent : v.content,
          role: (i === 0 ? "primary" : "none") as "primary" | "secondary" | "none",
        }));
      if (points.length > 0) setAppealPoints(points);
    }
  }, [step, copyVariants]);

  const startTimer = () => {
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleGenerate = async () => {
    if (!selectedConcept) return;
    setGenerating(true);
    setCreative(null);
    startTimer();

    const token = await getAuth_().currentUser?.getIdToken();
    if (!token) {
      toast("error", "Not authenticated");
      setGenerating(false);
      return;
    }

    try {
      const res = await fetch("/api/creatives/generate-one", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          size: "1080x1080",
          platform: "instagram",
          concept: selectedConcept,
          subject: selectedSubject,
          overlayText: selectedCopy || undefined,
          userImage: uploadedImage || undefined,
          appealPoints: appealPoints.filter((a) => a.role !== "none").map((a) => ({ text: a.text, role: a.role })),
          ctaText: customCta || undefined,
          styleRef: selectedStyle || undefined,
          language: LANGUAGES.find((l) => l.code === selectedLanguage)?.label,
          country: COUNTRIES.find((c) => c.code === selectedCountry)?.label,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || "Generation failed");
      }

      const json = await res.json();

      setCreative({
        id: json.id,
        baseImage: json.baseImage,
        hookText: json.hookText,
        subheadline: json.copyTrio?.subheadline || "",
        cta: json.copyTrio?.cta || "",
        productName: json.productName,
        brandColor: json.brandColor,
        isComplete: json.isComplete || false,
        size: json.size,
        platform: json.platform,
        concept: selectedConcept!,
        formats: json.formats || [],
      });

      if (outputType === "video") {
        // Auto-trigger video generation from the base image
        toast("success", "이미지 생성 완료! 영상 변환을 시작합니다...");
        setGeneratingVideo(true);
        try {
          const base64 = json.baseImage.split(",")[1];
          const mimeMatch = json.baseImage.match(/data:([^;]+)/);
          const videoRes = await fetch("/api/creatives/video", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              imageBase64: base64,
              imageMimeType: mimeMatch?.[1] || "image/png",
              prompt: "Subtle cinematic motion, gentle camera push-in with soft ambient movement. Professional social media ad video.",
            }),
          });
          if (videoRes.ok) {
            const videoData = await videoRes.json();
            if (videoData.videoUri) {
              const vRes = await fetch(videoData.videoUri);
              setVideoUrl(URL.createObjectURL(await vRes.blob()));
            } else if (videoData.videoBase64) {
              const bin = atob(videoData.videoBase64);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              setVideoUrl(URL.createObjectURL(new Blob([bytes], { type: videoData.mimeType })));
            }
            toast("success", "영상이 생성되었습니다!");
          }
        } catch (e) {
          console.error("Video generation failed:", e);
          toast("error", "영상 생성에 실패했습니다. 이미지는 정상 생성되었습니다.");
        } finally {
          setGeneratingVideo(false);
        }
      } else {
        toast("success", `${json.formats?.length || 1}개 포맷이 생성되었습니다!`);
      }
      refreshProfile(); // Update credit balance in UI
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "생성에 실패했습니다");
    } finally {
      stopTimer();
      setGenerating(false);
    }
  };

  const handleExportAll = async () => {
    if (!creative) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Render each format with text overlay via hidden canvas
    for (const fmt of creative.formats) {
      const canvas = document.createElement("canvas");
      const [w, h] = fmt.size.split("x").map(Number);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Load and draw base image
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const i = new window.Image();
        i.onload = () => resolve(i);
        i.src = fmt.baseImage;
      });
      ctx.drawImage(img, 0, 0, w, h);

      // Simple text overlay
      const padding = w * 0.08;
      const fontSize = Math.round(w * 0.065);
      ctx.font = `800 ${fontSize}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 2;
      ctx.textBaseline = "top";
      ctx.fillText(creative.hookText, padding, padding + fontSize);
      ctx.shadowColor = "transparent";

      // Product badge
      const badgeFontSize = Math.round(w * 0.022);
      ctx.font = `700 ${badgeFontSize}px Helvetica, Arial, sans-serif`;
      const badgeW = ctx.measureText(creative.productName).width + 24;
      const badgeH = badgeFontSize * 2.2;
      ctx.fillStyle = creative.brandColor;
      ctx.beginPath();
      ctx.roundRect(padding, h - padding - badgeH, badgeW, badgeH, badgeH / 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(creative.productName, padding + 12, h - padding - badgeH / 2);

      // Export to blob
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
      const safePlatform = fmt.platform.replace(/[^a-z0-9]/g, "_");
      zip.file(`piped_${safePlatform}_${fmt.size}.png`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = `piped_creatives_${creative.concept}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleGenerateVideo = async () => {
    if (!creative) return;
    if (!creative.baseImage || !creative.baseImage.startsWith("data:")) {
      toast("error", isKo ? "이미지가 없습니다. 먼저 이미지를 생성해주세요." : "No image found. Generate an image first.");
      return;
    }
    setGeneratingVideo(true);
    setVideoUrl(null);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      // Extract base64 from data URL
      const base64 = creative.baseImage.split(",")[1];
      const mimeMatch = creative.baseImage.match(/data:([^;]+)/);
      const mimeType = mimeMatch?.[1] || "image/png";

      if (!base64) {
        throw new Error(isKo ? "이미지 데이터를 읽을 수 없습니다" : "Cannot read image data");
      }

      const res = await fetch("/api/creatives/video", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          imageBase64: base64,
          imageMimeType: mimeType,
          prompt: `Subtle cinematic motion based on this ad image. Gentle camera push-in with soft ambient movement. Smooth, professional, suitable for Instagram/Facebook ad. The subject should have subtle natural motion.`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const data = await res.json();
      if (data.videoUri) {
        // Download from URI
        const videoRes = await fetch(data.videoUri);
        const blob = await videoRes.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } else if (data.videoBase64) {
        const binary = atob(data.videoBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType });
        setVideoUrl(URL.createObjectURL(blob));
      }
      toast("success", "영상이 생성되었습니다!");
      refreshProfile();
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "영상 생성 실패");
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("error", "5MB 이하 이미지만 업로드 가능합니다"); return; }
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setStep("output-type");
    setSelectedConcept(null);
    setSelectedSubject("graphic-card");
    setBatchResults([]);
    setCreative(null);
    setSelectedCopy("");
    setUploadedImage(null);
    setAppealPoints([]);
    setCustomCta("");
    setCreative(null);
  };

  const getDisplayContent = (v: CopyVariant) =>
    v.isEdited && v.editedContent ? v.editedContent : v.content;

  // Copy types good for image overlay (short, punchy text)
  const overlayableCopy = copyVariants.filter((v) =>
    ["headline", "cta", "social", "description_short"].includes(v.type)
  );

  const copyTypeLabels: Record<string, string> = {
    headline: "Headline",
    cta: "CTA",
    social: "Social",
    description_short: "Short Description",
  };

  // ─── Step 0: Output Type Selection ───
  if (step === "output-type") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Ad Creatives</h1>
        <p className="mt-1 text-sm text-gray-500">어떤 콘텐츠를 만들까요?</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              id: "image" as OutputType,
              icon: Image,
              title: isKo ? "이미지 광고" : "Image Ad",
              desc: isKo ? "Instagram, Facebook, Google 용 정적 이미지 광고를 만듭니다." : "Create static image ads for Instagram, Facebook, Google.",
              detail: isKo ? "AI 이미지 생성 + 텍스트 오버레이 + 5개 포맷 자동 변환" : "AI image + text overlay + 5 format auto-conversion",
              color: "bg-purple-50 text-purple-600 border-purple-200",
              selectedColor: "border-purple-500 bg-purple-50 ring-2 ring-purple-200",
            },
            {
              id: "video" as OutputType,
              icon: Video,
              title: isKo ? "영상 광고" : "Video Ad",
              desc: isKo ? "이미지를 기반으로 5초 모션 영상을 만듭니다." : "Create 5-second motion videos from images.",
              detail: isKo ? "Google Veo AI로 시네마틱 모션 생성" : "Cinematic motion with Google Veo AI",
              color: "bg-pink-50 text-pink-600 border-pink-200",
              selectedColor: "border-pink-500 bg-pink-50 ring-2 ring-pink-200",
            },
            {
              id: "batch" as OutputType,
              icon: Sparkles,
              title: isKo ? "A/B 테스트" : "A/B Test",
              desc: isKo ? "AI가 추천하는 3~5개 컨셉을 한번에 생성하고 비교합니다." : "Generate 3-5 AI-recommended concepts at once and compare.",
              detail: isKo ? "다양한 컨셉 실험 → 고성과 크리에이티브 발굴" : "Test multiple concepts → find top performers",
              color: "bg-orange-50 text-orange-600 border-orange-200",
              selectedColor: "border-orange-500 bg-orange-50 ring-2 ring-orange-200",
            },
          ].map((opt) => {
            const Icon = opt.icon;
            const isSelected = outputType === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => { setOutputType(opt.id); setBatchResults([]); setCreative(null); }}
                className={`group relative rounded-2xl border-2 p-6 text-left transition-all ${
                  isSelected ? opt.selectedColor : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${opt.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{opt.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{opt.desc}</p>
                <p className="mt-2 text-xs text-gray-400">{opt.detail}</p>
                {isSelected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="h-5 w-5 text-indigo-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          {outputType === "batch" ? (
            <Button
              onClick={async () => {
                setStep("generate");
                setGenerating(true);
                try {
                  const token = await getAuth_().currentUser?.getIdToken();
                  // Get recommendations first
                  const recRes = await fetch("/api/creatives/recommend", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ projectId, language: LANGUAGES.find((l) => l.code === selectedLanguage)?.label }),
                  });
                  let variants = [
                    { concept: "benefit-driven", subject: "graphic-card" },
                    { concept: "pain-point", subject: "graphic-card" },
                    { concept: "social-proof", subject: "product-ui" },
                  ];
                  if (recRes.ok) {
                    const recData = await recRes.json();
                    if (recData.recommendations?.length > 0) {
                      variants = recData.recommendations.map((r: { concept: string; subject: string }) => ({
                        concept: r.concept,
                        subject: r.subject,
                      }));
                    }
                  }

                  const batchRes = await fetch("/api/creatives/batch-generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      projectId,
                      variants,
                      language: LANGUAGES.find((l) => l.code === selectedLanguage)?.label,
                      country: COUNTRIES.find((c) => c.code === selectedCountry)?.label,
                    }),
                  });

                  if (batchRes.ok) {
                    const data = await batchRes.json();
                    setBatchResults(data.results.map((r: { id: string; baseImage: string; hookText: string; isComplete: boolean }, i: number) => ({
                      id: r.id,
                      baseImage: r.baseImage,
                      hookText: r.hookText,
                      concept: variants[i]?.concept || "",
                      subject: variants[i]?.subject || "",
                      isComplete: r.isComplete,
                    })));
                    toast("success", isKo ? `${data.succeeded}개 크리에이티브 생성 완료!` : `${data.succeeded} creatives generated!`);
                  } else {
                    const err = await batchRes.json();
                    toast("error", err.error);
                  }
                } catch (e) {
                  toast("error", isKo ? "배치 생성 실패" : "Batch generation failed");
                }
                setGenerating(false);
                refreshProfile();
              }}
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isKo ? "AI 추천 3개 한번에 생성" : "Generate 3 AI-Recommended"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setStep("copy")} size="lg">
              {isKo ? "다음: 문구 선택" : "Next: Select Copy"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── Step 1: Concept Selection ───
  if (step === "concept") {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("copy")} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {outputType === "video" ? "영상 광고" : "이미지 광고"} — 컨셉 선택
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              어떤 컨셉으로 후킹할지 선택하세요
            </p>
          </div>
        </div>

        {/* AI Recommendations */}
        {loadingRecs ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-indigo-600">
            <Spinner /> AI가 최적의 광고 전략을 분석중...
          </div>
        ) : recommendations.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
              <Sparkles className="h-4 w-4" />
              AI 추천 조합
            </h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {recommendations.map((rec, i) => {
                const isActive = selectedConcept === rec.concept && selectedSubject === rec.subject;
                const conceptInfo = CREATIVE_CONCEPTS.find((c) => c.id === rec.concept);
                const subjectInfo = CREATIVE_SUBJECTS.find((s) => s.id === rec.subject);
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedConcept(rec.concept); setSelectedSubject(rec.subject); }}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{subjectInfo?.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {conceptInfo?.name} + {subjectInfo?.name}
                        </p>
                        <p className="text-xs text-gray-500">{rec.reason}</p>
                      </div>
                      {i === 0 && (
                        <Badge variant="info" className="ml-auto shrink-0 text-[10px]">
                          #1
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="mt-8 text-sm font-medium text-gray-700">{isKo ? "메시지 전략" : "Message Strategy"}</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CREATIVE_CONCEPTS.filter((c) => c.category === "core").map((concept) => {
            const Icon = CONCEPT_ICONS[concept.id];
            const isSelected = selectedConcept === concept.id;
            const isRecommended = recommendations.some((r) => r.concept === concept.id);
            return (
              <button
                key={concept.id}
                onClick={() => setSelectedConcept(concept.id)}
                className={`group relative rounded-xl border-2 p-5 text-left transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                    : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  {concept.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {concept.description}
                </p>
                <p className="mt-2 text-xs text-indigo-600 font-medium">
                  {concept.hookStrategy}
                </p>
                <p className="mt-1.5 rounded bg-gray-50 px-2 py-1 text-xs text-gray-400 italic">
                  예: &quot;{concept.exampleHook}&quot;
                </p>
                {isRecommended && !isSelected && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="info" className="text-[10px]">AI 추천</Badge>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="h-5 w-5 text-indigo-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <h2 className="mt-6 text-sm font-medium text-gray-700">{isKo ? "고급 전략" : "Advanced Strategies"}</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CREATIVE_CONCEPTS.filter((c) => c.category === "advanced").map((concept) => {
            const Icon = CONCEPT_ICONS[concept.id];
            const isSelected = selectedConcept === concept.id;
            const isRecommended = recommendations.some((r) => r.concept === concept.id);
            return (
              <button
                key={concept.id}
                onClick={() => setSelectedConcept(concept.id)}
                className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                    : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-md"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isSelected ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-2 font-semibold text-gray-900 text-sm">{isKo ? concept.name : concept.nameEn}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{isKo ? concept.description : concept.descriptionEn}</p>
                <p className="mt-1 rounded bg-gray-50 px-2 py-1 text-[10px] text-gray-400 italic">
                  {isKo ? "예" : "e.g."}: &quot;{isKo ? concept.exampleHook : concept.exampleHookEn}&quot;
                </p>
                {isRecommended && !isSelected && (
                  <div className="absolute right-2 top-2">
                    <Badge variant="info" className="text-[10px]">AI</Badge>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <CheckCircle className="h-4 w-4 text-orange-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Subject Selection */}
        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-700">광고 주인공</h2>
          <div className="mt-3 flex gap-3">
            {CREATIVE_SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`flex flex-1 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  selectedSubject === s.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Style Reference */}
        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-700">{isKo ? "광고 스타일 참조" : "Ad Style Reference"}</h2>
          <p className="mt-1 text-xs text-gray-400">{isKo ? "AI가 이 스타일을 참고하여 이미지를 생성합니다" : "AI will use this style as reference for image generation"}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {AD_STYLE_REFERENCES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  selectedStyle === style.id
                    ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.emoji}</span>
                  <p className="text-sm font-semibold text-gray-900">{isKo ? style.name : style.nameEn}</p>
                </div>
                <p className="mt-1 text-[10px] text-gray-500">{isKo ? style.description : style.descriptionEn}</p>
                <div className="mt-2 flex gap-1">
                  {[style.colors.background, style.colors.accent, style.colors.text].map((c, i) => (
                    <div key={i} className="h-3 w-3 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={() => { setStep("generate"); handleGenerate(); }}
            disabled={!selectedConcept}
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            생성하기 ({selectedSubject === "graphic-card" ? 5 : 15} 크레딧)
          </Button>
        </div>
      </div>
    );
  }

  // ─── Step 2: Copy Selection ───
  if (step === "copy" && !generating && !creative) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setStep("output-type"); setBatchResults([]); setCreative(null); }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              마케팅 문구 선택
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              이미지에 넣을 후킹 문구를 선택하세요
            </p>
          </div>
        </div>

        {/* Selected concept badge */}
        <div className="mt-4">
          <Badge variant="info" className="text-sm">
            {CREATIVE_CONCEPTS.find((c) => c.id === selectedConcept)?.name}
          </Badge>
          <Badge variant="default" className="text-sm">
            {CREATIVE_SUBJECTS.find((s) => s.id === selectedSubject)?.emoji}{" "}
            {CREATIVE_SUBJECTS.find((s) => s.id === selectedSubject)?.name}
          </Badge>
        </div>

        {/* Custom text input */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            직접 입력
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              value={selectedCopy}
              onChange={(e) => setSelectedCopy(e.target.value)}
              placeholder="이미지에 표시할 마케팅 문구를 입력하세요"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              maxLength={80}
            />
            {selectedCopy && (
              <button
                onClick={() => setSelectedCopy("")}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {selectedCopy.length}/80 — 짧고 강렬할수록 후킹 효과가 높아요
          </p>
        </div>

        {/* Previously generated copy */}
        {loadingCopy ? (
          <div className="mt-8 flex justify-center py-8">
            <Spinner />
          </div>
        ) : overlayableCopy.length > 0 ? (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type className="h-4 w-4" />
              이전에 생성한 마케팅 문구
            </h2>
            <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
              {overlayableCopy.map((variant) => {
                const content = getDisplayContent(variant);
                const isSelected = selectedCopy === content;
                return (
                  <button
                    key={variant.id}
                    onClick={() =>
                      setSelectedCopy(isSelected ? "" : content)
                    }
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-900">{content}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="default">
                          {copyTypeLabels[variant.type] || variant.type}
                        </Badge>
                        {variant.isFavorited && (
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-indigo-500" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <Type className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              아직 생성된 마케팅 문구가 없습니다
            </p>
            <p className="mt-1 text-xs text-gray-400">
              직접 입력하거나, Copy 단계에서 먼저 문구를 생성하세요
            </p>
          </div>
        )}

        {/* Image upload (optional) */}
        <div className="mt-6">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Image className="h-4 w-4" />
            이미지 업로드 (선택사항)
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">제품 이미지를 업로드하면 광고 카드에 합성됩니다</p>
          <div className="mt-2 flex items-center gap-3">
            <label className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              {uploadedImage ? "이미지 변경" : "이미지 선택"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {uploadedImage && (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadedImage} alt="" className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                <button onClick={() => setUploadedImage(null)} className="text-xs text-red-500 hover:text-red-700">삭제</button>
              </div>
            )}
          </div>
        </div>

        {/* Appeal Points */}
        {appealPoints.length > 0 && (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Target className="h-4 w-4" />
              {isKo ? "소구점 선택" : "Select Appeal Points"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              {isKo
                ? "AI가 분석한 소구점입니다. 핵심과 보조를 선택하세요."
                : "AI-generated appeal points. Select primary and secondary."}
            </p>
            <div className="mt-3 space-y-2">
              {appealPoints.map((point, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-all ${
                    point.role === "primary"
                      ? "border-indigo-500 bg-indigo-50"
                      : point.role === "secondary"
                        ? "border-gray-400 bg-gray-50"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  <p className="text-sm text-gray-900 mr-3">{point.text}</p>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() =>
                        setAppealPoints((prev) =>
                          prev.map((p, i) => ({
                            ...p,
                            role:
                              i === idx
                                ? p.role === "primary"
                                  ? "none"
                                  : "primary"
                                : p.role === "primary"
                                  ? "none"
                                  : p.role,
                          }))
                        )
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        point.role === "primary"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600"
                      }`}
                    >
                      {isKo ? "핵심" : "Primary"}
                    </button>
                    <button
                      onClick={() =>
                        setAppealPoints((prev) =>
                          prev.map((p, i) =>
                            i === idx
                              ? { ...p, role: p.role === "secondary" ? "none" : "secondary" }
                              : p
                          )
                        )
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        point.role === "secondary"
                          ? "bg-gray-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                      }`}
                    >
                      {isKo ? "보조" : "Secondary"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Input */}
        <div className="mt-6">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Megaphone className="h-4 w-4" />
            {isKo ? "행동 유도 문구 (CTA)" : "Call to Action (CTA)"}
          </h2>
          <input
            type="text"
            value={customCta}
            onChange={(e) => setCustomCta(e.target.value)}
            placeholder={isKo ? "예: 지금 바로 50% 할인 받기" : "e.g. Get 50% off now"}
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            maxLength={60}
          />
          <p className="mt-1 text-xs text-gray-400">
            {isKo
              ? "버튼이나 하단 배너에 들어갈 문구를 작성해주세요"
              : "Text for buttons or bottom banner in the creative"}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selectedCopy
              ? `선택된 문구: "${selectedCopy.slice(0, 40)}${selectedCopy.length > 40 ? "..." : ""}"`
              : "문구 미선택 시 제품 가치 제안이 자동으로 사용됩니다"}
          </p>
          <Button onClick={() => setStep("concept")} size="lg">
            다음: 컨셉 선택
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Step 3: Generation & Results ───
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Creatives</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="info">
              {CREATIVE_CONCEPTS.find((c) => c.id === selectedConcept)?.name}
            </Badge>
            <Badge variant="default">
              {CREATIVE_SUBJECTS.find((s) => s.id === selectedSubject)?.emoji}{" "}
              {CREATIVE_SUBJECTS.find((s) => s.id === selectedSubject)?.name}
            </Badge>
          </div>
        </div>
        {!generating && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              다시 선택
            </Button>
            <Button variant="outline" onClick={handleGenerate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              재생성
            </Button>
            {creative && (
              <>
                <Button variant="outline" onClick={handleGenerateVideo} loading={generatingVideo}>
                  <Video className="mr-2 h-4 w-4" />
                  {generatingVideo ? "영상 생성중..." : "영상 만들기 (30 크레딧)"}
                </Button>
                <Button onClick={handleExportAll}>
                  <Package className="mr-2 h-4 w-4" />
                  ZIP 내보내기
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Generating state */}
      {generating && (
        <Card className="mt-6">
          <CardContent className="py-16 text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-lg font-medium text-indigo-600">
              {CREATIVE_CONCEPTS.find((c) => c.id === selectedConcept)?.name} 크리에이티브 생성중...
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {elapsed}초 경과 — AI가 이미지를 생성하고 5개 포맷으로 변환합니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* Batch A/B Results */}
      {batchResults.length > 0 && !generating && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isKo ? "A/B 테스트 결과" : "A/B Test Results"} ({batchResults.length}{isKo ? "개" : ""})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batchResults.map((r, i) => {
              const conceptLabel = CREATIVE_CONCEPTS.find((c) => c.id === r.concept)?.name || r.concept;
              const subjectLabel = CREATIVE_SUBJECTS.find((s) => s.id === r.subject)?.name || r.subject;
              return (
                <Card key={r.id} className="overflow-hidden">
                  <div className="aspect-square relative bg-gray-50 cursor-pointer group"
                    onClick={() => setEditingCreative({
                      baseImage: r.baseImage,
                      hookText: r.hookText,
                      productName: creative?.productName || "",
                      brandColor: creative?.brandColor || "#4F46E5",
                      size: "1080x1080",
                      isComplete: r.isComplete,
                    })}
                  >
                    {r.baseImage && (
                      <img src={r.baseImage} alt={r.hookText} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge variant="info" className="text-[10px]">#{i + 1}</Badge>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-lg">
                        {isKo ? "편집" : "Edit"}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs font-semibold text-gray-900">{conceptLabel}</p>
                    <p className="text-[10px] text-gray-500">{subjectLabel}</p>
                    {r.hookText && <p className="mt-1 text-xs text-indigo-600 italic">&quot;{r.hookText}&quot;</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              {isKo
                ? "💡 이 크리에이티브들로 캠페인을 실행하면 어떤 컨셉이 가장 성과가 좋은지 비교할 수 있습니다."
                : "💡 Run campaigns with these creatives to compare which concept performs best."}
            </p>
          </div>
        </div>
      )}

      {/* Results: all format grid */}
      {creative && !generating && (
        <>
          {/* Smart Copy Trio */}
          {(creative.hookText || creative.subheadline || creative.cta) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {creative.hookText && (
                <Badge variant="info">&quot;{creative.hookText}&quot;</Badge>
              )}
              {creative.subheadline && (
                <Badge variant="default">{creative.subheadline.slice(0, 40)}{creative.subheadline.length > 40 ? "..." : ""}</Badge>
              )}
              {creative.cta && (
                <Badge variant="success">{creative.cta}</Badge>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creative.formats.map((fmt) => (
              <Card key={fmt.size} className="overflow-hidden">
                <div className="relative aspect-square bg-gray-50">
                  {creative.isComplete ? (
                    // Graphic card — already has text baked in, show as-is
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fmt.baseImage}
                      alt=""
                      className="h-full w-full cursor-pointer object-cover"
                      onClick={() => setEditingCreative({
                        baseImage: fmt.baseImage,
                        hookText: creative.hookText,
                        subheadline: creative.subheadline,
                        cta: creative.cta,
                        productName: creative.productName,
                        brandColor: creative.brandColor,
                        size: fmt.size,
                        isComplete: true,
                      })}
                    />
                  ) : (
                    // AI-generated image — add text overlay via Canvas
                    <CreativePreview
                      baseImage={fmt.baseImage}
                      hookText={creative.hookText}
                      subheadline={creative.subheadline}
                      cta={creative.cta}
                      productName={creative.productName}
                      brandColor={creative.brandColor}
                      size={fmt.size}
                      onClick={() => setEditingCreative({
                        baseImage: fmt.baseImage,
                        hookText: creative.hookText,
                        subheadline: creative.subheadline,
                        cta: creative.cta,
                        productName: creative.productName,
                        brandColor: creative.brandColor,
                        size: fmt.size,
                      })}
                    />
                  )}
                </div>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fmt.label}</p>
                    <p className="text-xs text-gray-400">{fmt.size}</p>
                  </div>
                  <button
                    onClick={() => setEditingCreative({
                      baseImage: fmt.baseImage,
                      hookText: creative.hookText,
                      subheadline: creative.subheadline,
                      cta: creative.cta,
                      productName: creative.productName,
                      brandColor: creative.brandColor,
                      size: fmt.size,
                    })}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Video Result */}
          {videoUrl && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-600" />
                생성된 영상
              </h3>
              <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-black">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="mx-auto max-h-96 w-full object-contain"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <a
                  href={videoUrl}
                  download="piped-ad-video.mp4"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Package className="h-3.5 w-3.5" />
                  영상 다운로드
                </a>
              </div>
            </div>
          )}

          {generatingVideo && (
            <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
              <Spinner size="lg" />
              <p className="mt-3 text-sm font-medium text-indigo-700">Veo로 영상을 생성하고 있습니다...</p>
              <p className="mt-1 text-xs text-indigo-500">약 1-3분 소요됩니다</p>
            </div>
          )}

          {/* Next Step */}
          {hasCampaigns ? (
            <div className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                  <ArrowRight className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t.creatives.allGenerated}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isKo ? "크리에이티브가 업데이트되었습니다. 프로젝트로 돌아갑니다." : "Creatives updated. Return to your project."}
                  </p>
                </div>
              </div>
              <Link href={`/projects/${projectId}`}>
                <Button>
                  {isKo ? "프로젝트로 돌아가기" : "Back to Project"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Megaphone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t.creatives.nextCampaigns}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.creatives.nextCampaignsDesc}
                  </p>
                </div>
              </div>
              <Link href={`/projects/${projectId}/campaigns/new`}>
                <Button>
                  {t.common.continue}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* Editor Modal */}
      {editingCreative && (
        <CreativeEditor
          data={editingCreative}
          onClose={() => setEditingCreative(null)}
          onSave={(dataUrl) => {
            // Apply edited image back to the creative or batch result
            if (creative) {
              const editedSize = editingCreative.size;
              setCreative({
                ...creative,
                formats: creative.formats.map((f) =>
                  f.size === editedSize ? { ...f, baseImage: dataUrl } : f
                ),
                baseImage: editedSize === creative.size ? dataUrl : creative.baseImage,
              });
            }
            // Also check batch results
            if (batchResults.length > 0) {
              const match = batchResults.find((r) => r.baseImage === editingCreative.baseImage);
              if (match) {
                setBatchResults((prev) => prev.map((r) =>
                  r.id === match.id ? { ...r, baseImage: dataUrl } : r
                ));
              }
            }
            setEditingCreative(null);
            toast("success", isKo ? "편집이 적용되었습니다" : "Edit applied");
          }}
        />
      )}
    </div>
  );
}
