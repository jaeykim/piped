# Card Layout (카드 레이아웃 파라미터)

그래픽 카드 SVG 생성 시 사용되는 수치입니다.
ref = min(width, height) 기준 비율.

## 폰트 크기 (ref 비율)

- headline: 0.085 (정사각형), 0.13 (가로형)
- subheadline: 0.034 (정사각형), 0.055 (가로형)
- cta: 0.03 (정사각형), 0.05 (가로형)
- badge: 0.024
- tag: 0.028
- topBanner: 0.032
- bigNumber: 0.12 (정사각형), 0.18 (가로형)
- brand: 0.022

## 여백

- padding: ref * 0.07

## 상단 배너

- height: ref * 0.075
- fontSize: ref * 0.032
- background: #E53E3E
- textColor: #FFFFFF
- letterSpacing: 0.02em

## 하이라이트

- darkMode: #FFE500 (솔리드 노란색, 95% opacity)
- lightMode: brandColor (25% opacity)
- borderRadius: 4px
- padding: headSize * 0.15

## CTA 배너 (하단 전체 폭)

- height: ref * 0.07
- lightBackground: #FFE500
- lightTextColor: #1a1a2e
- darkBackground: brandColor
- darkTextColor: #FFFFFF
- fontWeight: 900

## 서브헤드라인 배경 스트립

- darkMode: rgba(255,255,255,0.08)
- lightMode: rgba(0,0,0,0.04)
- borderRadius: 3px

## 숫자 강조 (Big Number)

지원 단위: %, 원, 만원, 달러, 개월, 배, 일, 시간, 분, 명, $
헤드라인이 2줄 이하일 때만 표시.

## 카드 스타일

| style | 배경 | 텍스트 | 용도 |
|-------|------|--------|------|
| light | #F5F5F5 | #1a1a2e | social-proof, how-it-works, comparison |
| dark | #1a1a2e + 브랜드 그래디언트 | #FFFFFF | pain-point, before-after |
| gradient | 밝은 브랜드색 | #1a1a2e | benefit-driven, question |
| bold | 브랜드색 풀 배경 | #FFFFFF | offer, urgency |
| review | #FFF9F0 (크림) | #1a1a2e | story |

## 스크린샷 배치

- 정사각형: 너비 50%, 상단에서 35% 위치
- 가로형: 너비 45%, 상단에서 35% 위치
- 모서리 둥글기: 8px
- 그림자: dx=0, dy=4, stdDeviation=6, rgba(0,0,0,0.2)
