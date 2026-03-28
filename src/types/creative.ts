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
  {
    id: "animal-mascot",
    name: "동물 마스코트",
    description: "귀여운 동물로 친근한 브랜드 이미지",
    emoji: "🐾",
    examples: "귀여운 동물 + 제품 연출",
  },
];

// ─── Concept: 광고의 메시지 전략 ───

export type CreativeConcept =
  | "benefit-driven"
  | "pain-point"
  | "social-proof"
  | "offer"
  | "how-it-works";

export interface ConceptInfo {
  id: CreativeConcept;
  name: string;
  description: string;
  hookStrategy: string;
  exampleHook: string;
}

export const CREATIVE_CONCEPTS: ConceptInfo[] = [
  {
    id: "benefit-driven",
    name: "핵심 혜택",
    description: "제품의 가장 큰 혜택을 직접 보여줌",
    hookStrategy: "이 제품을 쓰면 뭐가 좋은지 한눈에",
    exampleHook: "광고 만드는 시간, 3분으로 줄이세요",
  },
  {
    id: "pain-point",
    name: "고민 해결",
    description: "타겟의 고민에 공감하고 해결책 제시",
    hookStrategy: "이 고민 있으시죠? → 해결됩니다",
    exampleHook: "아직도 수동으로 마케팅하고 계세요?",
  },
  {
    id: "social-proof",
    name: "사회적 증명",
    description: "숫자, 후기, 평점으로 신뢰 구축",
    hookStrategy: "이미 많은 사람이 쓰고 있다는 증거",
    exampleHook: "10,000+ 팀이 선택한 마케팅 자동화",
  },
  {
    id: "offer",
    name: "혜택/프로모션",
    description: "무료체험, 할인, 한정 혜택 강조",
    hookStrategy: "지금 시작하면 얻는 것이 있다",
    exampleHook: "지금 무료로 시작하세요",
  },
  {
    id: "how-it-works",
    name: "작동 방식",
    description: "제품이 어떻게 작동하는지 시각적으로",
    hookStrategy: "이렇게 간단하게 쓸 수 있다",
    exampleHook: "URL 입력 → AI가 광고 완성",
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
