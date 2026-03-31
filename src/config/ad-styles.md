# Ad Styles (광고 스타일 참조)

유저가 선택하면 Gemini에 스타일 프롬프트가 전달됩니다.

## person-hook
- name: 사람 + 후킹 문구
- nameEn: Person + Hook
- emoji: 🧑‍💼
- category: person
- colors: bg=#F5F5F0, accent=#FFE500, text=#1a1a2e
- layout.top: 후킹 문구 (굵은 텍스트, 노란 하이라이트)
- layout.middle: 인물 + 제품 사용 장면
- layout.bottom: 설명 + CTA 배너
- hookPattern: [대상]이 나 몰래 쓰던 [제품]
- geminiPrompt: |
    Create a Korean-style Meta/Instagram ad image.
    TOP 25%: Bold hook text area (dark semi-transparent overlay band)
    MIDDLE 50%: Real person (Korean, professional, natural pose) using laptop/phone.
    Natural office or café setting. Warm lighting, slightly desaturated.
    BOTTOM 25%: Info strip with subheadline + CTA on yellow (#FFE500) banner.
    STYLE: Clean, modern Korean ad. NOT stock photo — candid, editorial feel.
    No text in the image — leave clean spaces for text overlay.

## data-chart
- name: 데이터/차트 강조
- nameEn: Data & Charts
- emoji: 📊
- category: data
- colors: bg=#1a1a2e, accent=#6366F1, text=#FFFFFF
- layout.top: 제품명/로고
- layout.middle: 성과 차트 (상승 그래프)
- layout.bottom: 핵심 지표 강조
- hookPattern: [숫자]% 성장, [제품]으로
- geminiPrompt: |
    Create a Korean-style Meta/Instagram ad image.
    TOP 20%: Clean header with product name/logo area
    MIDDLE 60%: Professional bar chart or line graph showing upward trend.
    Modern data visualization. Dark or navy background.
    BOTTOM 20%: Key metric highlight strip.
    STYLE: Tech/SaaS aesthetic. Dark theme, bright accents. Professional.
    No text in the image.

## product-closeup
- name: 제품 클로즈업
- nameEn: Product Close-up
- emoji: 📦
- category: product
- colors: bg=#FFFFFF, accent=#E53E3E, text=#1a1a2e
- layout.top: 뱃지 (추천/인기/신상)
- layout.middle: 제품 사진 클로즈업
- layout.bottom: 특징 태그
- hookPattern: [특징] 하나로 [문제] 해결
- geminiPrompt: |
    Create a Korean-style Meta/Instagram ad image.
    TOP 20%: Badge/label area
    MIDDLE 60%: Large product shot. Clean white/light gradient. Centered, slightly angled.
    Soft shadow. Premium feel.
    BOTTOM 20%: Feature tags area (rounded pill badges).
    STYLE: Clean e-commerce. White background. Product is hero. Minimal.
    No text in the image.

## bold-text
- name: 텍스트 카드
- nameEn: Bold Text Card
- emoji: 💬
- category: text
- colors: bg=#4F9CF5, accent=#FFE500, text=#FFFFFF
- layout.top: 후킹 문구 (초대형)
- layout.middle: 서브 메시지 + 장식
- layout.bottom: CTA + 제품명
- hookPattern: [연도]년 [카테고리] 트렌드 [키워드]
- geminiPrompt: |
    Create a Korean-style Meta/Instagram ad image.
    FULL: Bold, vibrant background (brand color or bright gradient).
    CENTER: Large empty space for bold text overlay.
    Subtle geometric/abstract decorative elements at corners.
    Small product mockup in bottom-right (15-20%).
    STYLE: Modern Korean startup hero section. Bold, confident, minimal.
    No text in the image.

## review-testimonial
- name: 후기/리뷰형
- nameEn: Review / Testimonial
- emoji: ⭐
- category: review
- colors: bg=#FFF9F0, accent=#F59E0B, text=#1a1a2e
- layout.top: 인용구 (후기 문구)
- layout.middle: 사용 전후 또는 사용 장면
- layout.bottom: 별점 + CTA
- hookPattern: [결과]인 줄 알았던 [대상]이 쓰던 [제품]
- geminiPrompt: |
    Create a Korean-style Meta/Instagram ad image.
    TOP 20%: Review quote area with quotation mark decoration
    MIDDLE 50%: Before/after or product usage scene. Warm, authentic.
    Cream (#FFF9F0) background. UGC aesthetic.
    BOTTOM 30%: Star rating area + CTA.
    STYLE: User Generated Content feel. Warm, trustworthy, relatable.
    No text in the image.

## promo-deal
- name: 프로모션/할인
- nameEn: Promo / Deal
- emoji: 🏷️
- category: promo
- colors: bg=#FFF5F5, accent=#E53E3E, text=#1a1a2e
- layout.top: 긴급 배너 (기간 한정)
- layout.middle: 제품 + 할인 뱃지
- layout.bottom: 가격 비교 + CTA
- hookPattern: 지금 바로 [할인율]% 할인
- geminiPrompt: |
    Create a Korean-style Meta/Instagram ad image.
    TOP 15%: Urgency banner (red strip)
    MIDDLE 55%: Product with large price tag or discount badge.
    Starburst/explosion shape behind discount number.
    BOTTOM 30%: Original price strikethrough → discounted price in bold red.
    Yellow (#FFE500) CTA banner.
    STYLE: Korean shopping mall energy. Bold reds, yellows. High contrast.
    No text in the image.
