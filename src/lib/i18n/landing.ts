export type LandingLocale = "en" | "ko" | "ja" | "zh" | "es" | "fr" | "de" | "pt" | "vi" | "th";

export interface LandingText {
  badge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDesc: string;
  ctaStart: string;
  ctaHow: string;
  stepsTitle: string;
  stepsDesc: string;
  steps: { title: string; desc: string }[];
  benefitsTitle: string;
  benefits: string[];
  ctaTitle1: string;
  ctaTitle2: string;
  ctaButton: string;
  ctaSub: string;
  statTime: string;
  statCost: string;
  statRoas: string;
  signIn: string;
  getStarted: string;
  footer: string;
}

const en: LandingText = {
  badge: "Meta Ads Autopilot",
  heroTitle1: "Connect Meta.",
  heroTitle2: "Hit your ROAS on autopilot.",
  heroDesc: "Piped generates, deploys, and optimizes your Meta ads every hour — until your target ROAS is reached. You set the goal. The AI runs the loop.",
  ctaStart: "Start Free",
  ctaHow: "See How It Works",
  stepsTitle: "The Optimization Loop",
  stepsDesc: "Connect once. Piped handles generate → deploy → measure → iterate, 24/7.",
  steps: [
    { title: "Connect Meta", desc: "One-click Meta login. Piped picks up your ad account, page, and pixel automatically." },
    { title: "AI Generates & Deploys", desc: "Claude writes the strategy, Gemini renders the creative, Piped pushes it live to Meta with your targeting and budget." },
    { title: "Hourly Optimization", desc: "Piped reads insights every hour, kills underperformers, scales winners, and regenerates creative until your ROAS goal is hit." },
  ],
  benefitsTitle: "Why marketers run Piped on autopilot",
  benefits: [
    "Hourly ROAS-driven optimization loop",
    "Auto-generated ad creative (Claude + Gemini)",
    "Native Meta API — no third-party hacks",
    "Daily spend, CTR, CPA, ROAS dashboards",
    "Auto-pause underperformers, scale winners",
    "Set a target ROAS and walk away",
  ],
  ctaTitle1: "Stop babysitting your ad manager.",
  ctaTitle2: "Let Piped run the loop.",
  ctaButton: "Connect Meta — Free",
  ctaSub: "Free to connect. You only pay your own Meta ad spend.",
  statTime: "Setup",
  statCost: "Optimization",
  statRoas: "Target ROAS",
  signIn: "Sign In",
  getStarted: "Connect Meta",
  footer: "All rights reserved.",
};

const ko: LandingText = {
  badge: "메타 광고 자동화",
  heroTitle1: "메타 연결만 하세요.",
  heroTitle2: "ROAS는 자동으로 맞춰드립니다.",
  heroDesc: "Piped가 광고를 생성하고, 배포하고, 1시간마다 지표를 읽어 목표 ROAS에 도달할 때까지 자동으로 최적화합니다. 당신은 목표만 정하세요.",
  ctaStart: "무료로 시작",
  ctaHow: "작동 방식 보기",
  stepsTitle: "최적화 루프",
  stepsDesc: "한 번 연결하면 생성 → 배포 → 측정 → 반복을 24시간 자동으로.",
  steps: [
    { title: "메타 연결", desc: "원클릭 메타 로그인. 광고계정, 페이지, 픽셀을 자동으로 잡아옵니다." },
    { title: "AI 생성 & 배포", desc: "Claude가 전략을 짜고 Gemini가 소재를 만들면, Piped가 타겟·예산과 함께 메타에 바로 올립니다." },
    { title: "1시간 단위 자동 최적화", desc: "매시간 인사이트를 읽어 부진한 광고는 끄고, 잘 되는 건 키우고, 정체된 소재는 새로 생성합니다." },
  ],
  benefitsTitle: "마케터들이 Piped를 자동화로 돌리는 이유",
  benefits: [
    "ROAS 기반 1시간 단위 최적화 루프",
    "Claude + Gemini 광고 소재 자동 생성",
    "메타 공식 API 직접 연동",
    "일별 지출·CTR·CPA·ROAS 대시보드",
    "부진 광고 자동 일시정지 / 위너 자동 증액",
    "목표 ROAS만 설정하고 손 놓으세요",
  ],
  ctaTitle1: "광고 매니저 붙잡고 있을 시간 없잖아요.",
  ctaTitle2: "Piped가 루프를 돌릴게요.",
  ctaButton: "메타 연결 — 무료",
  ctaSub: "연결은 무료. 광고비만 본인 메타계정에서 직접 결제됩니다.",
  statTime: "설정",
  statCost: "최적화",
  statRoas: "목표 ROAS",
  signIn: "로그인",
  getStarted: "메타 연결",
  footer: "All rights reserved.",
};

const ja: LandingText = {
  badge: "AI広告画像ジェネレーター",
  heroTitle1: "URLを貼るだけ。",
  heroTitle2: "広告画像を即座に作成。",
  heroDesc: "商品URLを貼り付けるだけで、AIがInstagram・Facebook・Google広告用の画像を即座に作成します。デザインスキル不要。",
  ctaStart: "無料で始める",
  ctaHow: "仕組みを見る",
  stepsTitle: "仕組み",
  stepsDesc: "URLから広告画像まで3ステップ。",
  steps: [
    { title: "URL入力", desc: "ページを分析し、ビジュアルを抽出、ブランドを把握します。" },
    { title: "AIが画像生成", desc: "全プラットフォーム対応の広告画像を生成、すぐダウンロード可能。" },
    { title: "ダウンロード＆利用", desc: "Instagram・Facebook・Google広告に最適化された画像を取得。" },
  ],
  benefitsTitle: "クリエイターがPipedを選ぶ理由",
  benefits: [
    "デザイン経験不要",
    "URLから広告画像まで1分以内",
    "高コンバージョンのAIコピー",
    "あらゆる商品・サービスに対応",
    "複数フォーマット自動生成",
    "ワンクリックでダウンロード＆共有",
  ],
  ctaTitle1: "広告デザインの悩みは終わり。",
  ctaTitle2: "AIが広告画像を作成します。",
  ctaButton: "無料で始める",
  ctaSub: "URL一つで1分以内に広告画像が完成。",
  statTime: "セットアップ",
  statCost: "初期費用",
  statRoas: "フォーマット",
  signIn: "ログイン",
  getStarted: "無料で始める",
  footer: "All rights reserved.",
};

const zh: LandingText = {
  badge: "AI广告图片生成器",
  heroTitle1: "粘贴URL即可。",
  heroTitle2: "AI即刻生成广告图片。",
  heroDesc: "只需粘贴产品URL，AI即刻为Instagram、Facebook和Google广告创建精美图片。无需设计技能。",
  ctaStart: "免费开始",
  ctaHow: "查看工作原理",
  stepsTitle: "工作原理",
  stepsDesc: "从URL到广告图片，仅需3步。",
  steps: [
    { title: "输入URL", desc: "分析页面，提取视觉元素，了解品牌特征。" },
    { title: "AI生成图片", desc: "为所有平台生成精美广告图片，即刻可下载。" },
    { title: "下载使用", desc: "获取针对Instagram、Facebook、Google广告优化的图片。" },
  ],
  benefitsTitle: "创作者选择Piped的理由",
  benefits: [
    "无需设计经验",
    "从URL到广告图片不到1分钟",
    "AI驱动的高转化文案",
    "适用于任何产品或服务",
    "多种格式自动生成",
    "一键下载和分享",
  ],
  ctaTitle1: "告别广告设计烦恼。",
  ctaTitle2: "让AI为您创建广告图片。",
  ctaButton: "免费开始",
  ctaSub: "粘贴一个URL，不到1分钟广告图片就完成。",
  statTime: "设置时间",
  statCost: "初始费用",
  statRoas: "格式",
  signIn: "登录",
  getStarted: "免费开始",
  footer: "保留所有权利。",
};

// Fallback for other languages — use English
const translations: Record<string, LandingText> = { en, ko, ja, zh };

export function getLandingText(locale: string): LandingText {
  // Match exact or prefix (e.g., "ko-KR" → "ko")
  const key = locale.split("-")[0].toLowerCase();
  return translations[key] || en;
}

export function detectLocale(acceptLanguage?: string | null): LandingLocale {
  if (!acceptLanguage) return "en";
  const langs = acceptLanguage
    .split(",")
    .map((l) => l.split(";")[0].trim().split("-")[0].toLowerCase());
  for (const lang of langs) {
    if (lang in translations) return lang as LandingLocale;
  }
  return "en";
}
