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
  badge: "For Vibe Coders",
  heroTitle1: "One line.",
  heroTitle2: "Your entire marketing, done.",
  heroDesc: "\"Run Meta ads for my SaaS\" — that's it. Paste your URL, type what you want in plain English, and AI builds your copy, creatives, and campaigns. Marketing in natural language, just like you code.",
  ctaStart: "Start Free",
  ctaHow: "See How It Works",
  stepsTitle: "How It Works",
  stepsDesc: "If you can prompt, you can market.",
  steps: [
    { title: "Paste URL", desc: "We crawl your site and understand your product in seconds." },
    { title: "AI Does Everything", desc: "Copy, ad images, campaign settings — generated and ready to launch." },
    { title: "Ship It", desc: "One click to Meta & Google Ads. Done. Go back to coding." },
  ],
  benefitsTitle: "Why Builders Ship with Piped",
  benefits: [
    "Zero marketing experience required",
    "URL to live ads in 3 minutes",
    "AI copy that actually converts",
    "Built by devs, for devs",
    "Affiliate program auto-configured",
    "Never leave your terminal mindset",
  ],
  ctaTitle1: "Let AI handle marketing.",
  ctaTitle2: "You go back to building.",
  ctaButton: "Start Free",
  ctaSub: "Paste one URL. Get ads running in 3 minutes.",
  statTime: "Setup Time",
  statCost: "Upfront Cost",
  statRoas: "Avg. ROAS",
  signIn: "Sign In",
  getStarted: "Get Started Free",
  footer: "All rights reserved.",
};

const ko: LandingText = {
  badge: "바이브 코더를 위한",
  heroTitle1: "한 줄이면 끝.",
  heroTitle2: "마케팅, 다 해드립니다.",
  heroDesc: "\"내 SaaS 메타 광고 돌려줘\" — 끝. URL 붙여넣고 하고 싶은 말 한 줄 치면 카피, 이미지, 캠페인까지 AI가 다 만듭니다. 터미널에서 코드 짜듯, 마케팅도 자연어 한 줄이면 됩니다.",
  ctaStart: "무료로 시작",
  ctaHow: "작동 방식 보기",
  stepsTitle: "작동 방식",
  stepsDesc: "프롬프트 칠 줄 알면 마케팅도 됩니다.",
  steps: [
    { title: "URL 붙여넣기", desc: "사이트를 크롤링하고 제품을 몇 초 만에 파악합니다." },
    { title: "AI가 다 만듦", desc: "카피, 광고 이미지, 캠페인 세팅 — 생성 완료, 바로 런칭 가능." },
    { title: "배포", desc: "Meta·Google Ads에 원클릭. 끝. 코딩하러 돌아가세요." },
  ],
  benefitsTitle: "빌더들이 Piped를 쓰는 이유",
  benefits: [
    "마케팅 경험 제로여도 됩니다",
    "URL에서 라이브 광고까지 3분",
    "AI가 만든 전환율 높은 카피",
    "바이브 코더 & 인디 해커 전용",
    "제휴 프로그램까지 자동 세팅",
    "코딩 외에 시간 쓸 일 없음",
  ],
  ctaTitle1: "마케팅은 AI한테 맡기고",
  ctaTitle2: "코딩에 집중하세요.",
  ctaButton: "무료로 시작하기",
  ctaSub: "URL 하나 붙여넣으면 3분 안에 광고가 돌아갑니다.",
  statTime: "설정 시간",
  statCost: "초기 비용",
  statRoas: "평균 ROAS",
  signIn: "로그인",
  getStarted: "무료로 시작",
  footer: "All rights reserved.",
};

const ja: LandingText = {
  badge: "パフォーマンスマーケティング自動化",
  heroTitle1: "Piped:",
  heroTitle2: "パフォーマンスマーケティング自動化プラットフォーム",
  heroDesc: "WebサイトのURLを入力するだけで、AIがコピー、クリエイティブ、広告キャンペーンを自動生成します。",
  ctaStart: "パイプラインを開始",
  ctaHow: "仕組みを見る",
  stepsTitle: "仕組み",
  stepsDesc: "URLから広告まで、たった3ステップ。",
  steps: [
    { title: "URL入力", desc: "Webサイトを分析し、製品・ターゲット・ブランドトーンを把握します。" },
    { title: "AIが全て生成", desc: "コピー、広告クリエイティブ、キャンペーン設定を数秒で完成。" },
    { title: "公開＆成長", desc: "Meta・Google Adsにワンクリックで配信し、アフィリエイトで自然成長。" },
  ],
  benefitsTitle: "ビルダーがPipedを選ぶ理由",
  benefits: [
    "マーケティング経験は不要",
    "URLからライブ広告まで数分で",
    "コンバージョンを生むAIコピー",
    "バイブコーダーとインディーハッカー向け",
    "オーガニック成長のためのアフィリエイト",
    "1つのダッシュボードで成果追跡",
  ],
  ctaTitle1: "マーケティングに悩むのをやめましょう。",
  ctaTitle2: "今すぐパイプラインを始めましょう。",
  ctaButton: "無料で始める",
  ctaSub: "マーケティング自動化パイプラインを3分で設定。",
  statTime: "セットアップ",
  statCost: "初期費用",
  statRoas: "平均ROAS",
  signIn: "ログイン",
  getStarted: "無料で始める",
  footer: "All rights reserved.",
};

const zh: LandingText = {
  badge: "效果营销自动化",
  heroTitle1: "Piped:",
  heroTitle2: "效果营销自动化平台",
  heroDesc: "只需输入网站URL，AI就能自动生成营销文案、广告素材，并启动广告投放。",
  ctaStart: "开始你的流水线",
  ctaHow: "查看工作原理",
  stepsTitle: "工作原理",
  stepsDesc: "从URL到广告投放，仅需3步。",
  steps: [
    { title: "输入URL", desc: "分析您的网站，了解产品、目标客户和品牌调性。" },
    { title: "AI全部生成", desc: "文案、广告素材、投放设置，几秒内全部完成。" },
    { title: "发布&增长", desc: "一键投放到Meta和Google Ads，联盟计划助力自然增长。" },
  ],
  benefitsTitle: "构建者选择Piped的理由",
  benefits: [
    "无需营销经验",
    "从URL到上线广告仅需几分钟",
    "AI驱动的高转化文案",
    "专为独立开发者和创业者打造",
    "助力自然增长的联盟系统",
    "一个仪表盘追踪所有数据",
  ],
  ctaTitle1: "别再为营销发愁。",
  ctaTitle2: "立即开始你的流水线。",
  ctaButton: "免费开始",
  ctaSub: "3分钟内设置您的营销自动化流水线。",
  statTime: "设置时间",
  statCost: "初始费用",
  statRoas: "平均ROAS",
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
