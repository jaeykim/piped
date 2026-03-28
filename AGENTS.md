<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Ad Creative Generation Guidelines

이 서비스의 핵심 기능은 **광고 이미지 생성**이다. 아래 규칙을 반드시 지켜야 한다.

## 아키텍처
- 2-Stage Pipeline: Claude(전략) → Gemini(실행)
- Claude가 제품 분석 기반 크리에이티브 브리프 작성, Gemini가 이미지 생성
- 웹사이트 스크린샷(PageSpeed API) + 로고(favicon/apple-touch-icon)를 Gemini에 멀티모달 입력으로 전달

## 문구 규칙 (가장 중요)
- 이미지 위 텍스트는 **3-5단어** 짧은 후킹 문구만 허용. 절대 전체 문장을 그대로 넣지 않는다
- 마케팅 메시지는 "영감(inspiration)"으로만 사용하고, Claude가 축약한다
- 예시: "Work simplified." "Ship 10x faster." "Never miss a lead."

## 로고 규칙
- 항상 브랜드 로고 또는 제품명을 코너(하단 좌/우)에 작게(프레임의 5-8%) 배치
- 크롤러에서 favicon/apple-touch-icon/og:image 순으로 로고 추출

## 디자인 품질 기준
- Meta(Instagram/Facebook) 피드 환경 기반 — 흰색/회색 피드와 대비되는 색상
- 3개 레이어: 배경 그래디언트 → 중간(디바이스/카드) → 전경(텍스트/뱃지)
- 디바이스 목업: 최신 프레임(MacBook 2024, iPhone 15 Pro), 10-15° 기울기
- PPT 느낌 금지: 플랫 단색, 가운데 정렬, 클립아트, 하드 드롭쉐도우 금지

## 금지 사항
- 전체 value proposition을 이미지에 텍스트로 넣기
- 센터 정렬된 텍스트 스택
- 제네릭 기하학 도형 장식
- 구식 디바이스 프레임
- 스톡 사진 스타일
