// ─── Subject: 광고의 비주얼 스타일 ───

export type CreativeSubject =
  | "graphic-card"       // 그래픽 카드 (텍스트 중심 디자인)
  | "product-ui"         // 제품 UI 목업
  | "person-product"     // 사람 + 제품
  | "animal-mascot";     // 동물 마스코트

export interface SubjectInfo {
  id: CreativeSubject;
  name: string;
  description: string;
  emoji: string;
  examples: string;
}

export const CREATIVE_SUBJECTS: SubjectInfo[] = [
  {
    id: "graphic-card",
    name: "그래픽 카드",
    description: "배경색 + 볼드 텍스트 중심 디자인",
    emoji: "🎨",
    examples: "WHOTAG, Stylec, obudyoga 스타일",
  },
  {
    id: "product-ui",
    name: "제품 화면",
    description: "실제 제품 UI를 보여주는 디바이스 목업",
    emoji: "💻",
    examples: "W컨셉, 헬로맥스 스타일",
  },
  {
    id: "person-product",
    name: "사람 + 제품",
    description: "사람이 제품을 사용하는 모습",
    emoji: "🧑",
    examples: "헬로맥스, StyleSeller 스타일",
  },
];

// ─── Concept: 광고의 메시지 전략 ───

export type CreativeConcept =
  | "benefit-driven"
  | "pain-point"
  | "social-proof"
  | "offer"
  | "how-it-works"
  | "before-after"
  | "comparison"
  | "urgency"
  | "story"
  | "question";

export interface ConceptInfo {
  id: CreativeConcept;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  hookStrategy: string;
  exampleHook: string;
  exampleHookEn: string;
  category: "core" | "advanced";
}

export const CREATIVE_CONCEPTS: ConceptInfo[] = [
  // Core concepts (original 5)
  {
    id: "benefit-driven",
    name: "핵심 혜택",
    nameEn: "Key Benefit",
    description: "제품의 가장 큰 혜택을 직접 보여줌",
    descriptionEn: "Show the #1 benefit directly",
    hookStrategy: "이 제품을 쓰면 뭐가 좋은지 한눈에",
    exampleHook: "광고 만드는 시간, 3분으로 줄이세요",
    exampleHookEn: "Create ads in 3 minutes",
    category: "core",
  },
  {
    id: "pain-point",
    name: "고민 해결",
    nameEn: "Problem → Solution",
    description: "타겟의 고민에 공감하고 해결책 제시",
    descriptionEn: "Empathize with the pain, then solve it",
    hookStrategy: "이 고민 있으시죠? → 해결됩니다",
    exampleHook: "아직도 수동으로 마케팅하고 계세요?",
    exampleHookEn: "Still doing marketing manually?",
    category: "core",
  },
  {
    id: "social-proof",
    name: "사회적 증명",
    nameEn: "Social Proof",
    description: "숫자, 후기, 평점으로 신뢰 구축",
    descriptionEn: "Build trust with numbers & reviews",
    hookStrategy: "이미 많은 사람이 쓰고 있다는 증거",
    exampleHook: "10,000+ 팀이 선택한 마케팅 자동화",
    exampleHookEn: "Trusted by 10,000+ teams",
    category: "core",
  },
  {
    id: "offer",
    name: "혜택/프로모션",
    nameEn: "Offer / Promo",
    description: "무료체험, 할인, 한정 혜택 강조",
    descriptionEn: "Highlight free trial, discount, or limited offer",
    hookStrategy: "지금 시작하면 얻는 것이 있다",
    exampleHook: "지금 무료로 시작하세요",
    exampleHookEn: "Start free today",
    category: "core",
  },
  {
    id: "how-it-works",
    name: "작동 방식",
    nameEn: "How It Works",
    description: "제품이 어떻게 작동하는지 시각적으로",
    descriptionEn: "Visualize how simple the product is",
    hookStrategy: "이렇게 간단하게 쓸 수 있다",
    exampleHook: "URL 입력 → AI가 광고 완성",
    exampleHookEn: "Enter URL → AI creates your ad",
    category: "core",
  },
  // Advanced concepts (new 5)
  {
    id: "before-after",
    name: "비포/애프터",
    nameEn: "Before / After",
    description: "사용 전후를 비교해서 변화를 보여줌",
    descriptionEn: "Show the transformation before and after using the product",
    hookStrategy: "이렇게 달라집니다 — 시각적 증거",
    exampleHook: "마케팅에 하루 3시간? → 이제 3분",
    exampleHookEn: "3 hours on marketing? → Now 3 minutes",
    category: "advanced",
  },
  {
    id: "comparison",
    name: "경쟁 비교",
    nameEn: "vs Competitor",
    description: "경쟁사 대비 우리의 장점을 직접 비교",
    descriptionEn: "Direct comparison showing why we're better",
    hookStrategy: "왜 우리 제품이 더 나은지 한눈에",
    exampleHook: "기존 방식 vs Maktmakr — 뭐가 다를까?",
    exampleHookEn: "Old way vs Maktmakr — what's different?",
    category: "advanced",
  },
  {
    id: "urgency",
    name: "긴급성/희소성",
    nameEn: "Urgency / Scarcity",
    description: "시간 제한, 수량 제한으로 행동 유도",
    descriptionEn: "Drive action with time or quantity limits",
    hookStrategy: "지금 안 하면 놓친다는 느낌",
    exampleHook: "이번 주만 50% 할인 — 선착순 100명",
    exampleHookEn: "50% off this week — first 100 only",
    category: "advanced",
  },
  {
    id: "story",
    name: "스토리텔링",
    nameEn: "Storytelling",
    description: "실제 사용자의 이야기로 공감 유도",
    descriptionEn: "Tell a real user story to build connection",
    hookStrategy: "이 사람처럼 성공할 수 있다",
    exampleHook: "월 매출 0원 → 300만원, 비결은 이거였습니다",
    exampleHookEn: "From $0 to $30K/mo — here's how",
    category: "advanced",
  },
  {
    id: "question",
    name: "질문형 후킹",
    nameEn: "Question Hook",
    description: "질문으로 호기심을 자극해서 클릭 유도",
    descriptionEn: "Spark curiosity with a question",
    hookStrategy: "대답을 알고 싶어서 클릭하게 만들기",
    exampleHook: "마케팅 비용의 80%가 낭비되는 이유?",
    exampleHookEn: "Why 80% of your ad budget is wasted?",
    category: "advanced",
  },
];

// ─── Other types ───

export type CreativeSize = "1080x1080" | "1200x628" | "1080x1920" | "1200x1200";
export type CreativePlatform = "instagram" | "facebook" | "google_display" | "general";
export type CreativeStatus = "generating" | "ready" | "failed";

export interface Creative {
  id: string;
  imageUrl: string;
  prompt: string;
  size: CreativeSize;
  platform: CreativePlatform;
  concept: CreativeConcept;
  overlayText?: string;
  status: CreativeStatus;
  createdAt: Date;
}
