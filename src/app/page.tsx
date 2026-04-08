import { headers } from "next/headers";
import Link from "next/link";
import {
  Zap,
  Plug,
  Rocket,
  Repeat,
  ArrowRight,
  CheckCircle,
  Clock,
  Activity,
  Target,
  Sparkles,
} from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getLandingText, detectLocale } from "@/lib/i18n/landing";

const stepIcons = [Plug, Rocket, Repeat];

export default async function LandingPage() {
  const hdrs = await headers();
  const locale = detectLocale(hdrs.get("accept-language"));
  const t = getLandingText(locale);

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2D2A26] overflow-hidden">
      {/* ─── Background Effects ─── */}
      <div className="pointer-events-none fixed left-1/2 top-0 z-0 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-amber-100/50 blur-[140px]" />
      <div className="pointer-events-none fixed right-0 bottom-0 z-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-violet-100/40 blur-[120px]" />

      {/* ─── Header ─── */}
      <header className="relative z-10 border-b border-amber-100/60 bg-[#FFF9F5]/80 backdrop-blur-md sticky top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Maktmakr</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t.signIn}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:shadow-md transition-all shadow-sm"
            >
              {t.getStarted}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700 mb-8">
            <Sparkles className="h-4 w-4" />
            {t.badge}
          </div>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl leading-[1.08]">
            {t.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">{t.heroTitle2}</span>
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 leading-relaxed sm:text-xl">
            {t.heroDesc}
          </p>
        </ScrollReveal>
        <ScrollReveal delay={300}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-500/35 hover:scale-[1.02] transition-all"
            >
              {t.ctaStart}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-xl border border-amber-200/60 bg-white px-7 py-3.5 text-base font-medium text-[#2D2A26] hover:border-violet-300 hover:bg-violet-50/50 transition-all"
            >
              {t.ctaHow}
            </Link>
          </div>
        </ScrollReveal>

        {/* Social proof numbers */}
        <ScrollReveal delay={400}>
          <div className="mx-auto mt-16 flex max-w-2xl items-center justify-center gap-8 sm:gap-16">
            {[
              { icon: Clock, value: "1min", label: t.statTime },
              { icon: Activity, value: "1h", label: t.statCost },
              { icon: Target, value: "4x+", label: t.statRoas },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="mx-auto h-5 w-5 text-amber-500" />
                <p className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">{stat.value}</p>
                <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal>
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-violet-600">
              Pipeline
            </p>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t.stepsTitle}
            </h2>
            <p className="mt-4 text-center text-lg text-gray-500">
              {t.stepsDesc}
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-0 sm:grid-cols-3">
            {t.steps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <ScrollReveal key={i} delay={i * 150}>
                  <div className="group relative flex flex-col items-center text-center px-6 py-8">
                    {/* Connector arrow (between cards) */}
                    {i < t.steps.length - 1 && (
                      <div className="pointer-events-none absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 sm:block">
                        <ArrowRight className="h-5 w-5 text-violet-300" />
                      </div>
                    )}
                    {/* Number + Icon */}
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition-all group-hover:bg-violet-100 group-hover:shadow-lg group-hover:shadow-violet-100/50">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white ring-2 ring-white">
                        {i + 1}
                      </div>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-[240px]">
                      {step.desc}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="relative z-10 bg-gradient-to-b from-amber-50/40 to-[#FFF9F5] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-violet-600">
              Testimonials
            </p>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {locale === "ko" ? "유저들의 실제 후기" : "What Our Users Say"}
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: locale === "ko" ? "김민수" : "Alex Chen",
                role: locale === "ko" ? "DTC 브랜드 운영자" : "DTC Brand Owner",
                avatar: "A",
                color: "bg-indigo-100 text-indigo-700",
                stars: 5,
                quote: locale === "ko"
                  ? "메타 연결만 해두고 자고 일어났더니 ROAS가 2.1에서 4.3으로 올라가 있었어요. 광고 매니저 들여다볼 시간이 사라졌습니다."
                  : "Connected Meta, went to bed, woke up to ROAS climbing from 2.1 to 4.3. I've stopped opening Ads Manager entirely.",
              },
              {
                name: locale === "ko" ? "이서연" : "Sarah Kim",
                role: locale === "ko" ? "퍼포먼스 마케터" : "Performance Marketer",
                avatar: "S",
                color: "bg-emerald-100 text-emerald-700",
                stars: 5,
                quote: locale === "ko"
                  ? "에이전시한테 매달 내던 돈으로 Maktmakr를 돌렸더니 CPA가 30% 떨어졌어요. 매시간 소재를 바꿔주는 게 진짜 차이를 만듭니다."
                  : "Replaced my agency retainer with Maktmakr — CPA dropped 30% in two weeks. The hourly creative refresh is what actually moves the needle.",
              },
              {
                name: locale === "ko" ? "박재현" : "James Park",
                role: locale === "ko" ? "이커머스 대표" : "E-commerce Founder",
                avatar: "J",
                color: "bg-amber-100 text-amber-700",
                stars: 5,
                quote: locale === "ko"
                  ? "예산 분배, A/B 테스트, 부진 광고 끄기 — 이거 매일 하던 거였거든요. 이제 다 자동입니다."
                  : "Budget reallocation, A/B testing, killing losers — I used to do all of this manually every day. Now it just runs.",
              },
              {
                name: locale === "ko" ? "최은지" : "Emily Choi",
                role: locale === "ko" ? "SaaS 창업자" : "SaaS Founder",
                avatar: "E",
                color: "bg-pink-100 text-pink-700",
                stars: 5,
                quote: locale === "ko"
                  ? "목표 ROAS 3 잡고 두면 알아서 거기까지 끌어올립니다. 안 될 때는 알람도 와요. 마음 편해요."
                  : "Set a target ROAS of 3, walked away. Maktmakr gets there and pings me only when something needs my attention.",
              },
              {
                name: locale === "ko" ? "정도윤" : "David Jung",
                role: locale === "ko" ? "그로스 리드" : "Growth Lead",
                avatar: "D",
                color: "bg-violet-100 text-violet-700",
                stars: 5,
                quote: locale === "ko"
                  ? "대시보드만 봐도 어제 뭐가 잘 됐고 뭐가 죽었는지 1초만에 보여요. 메타 광고 매니저보다 훨씬 명확합니다."
                  : "The dashboard tells me in one glance what worked yesterday and what died. Way clearer than Meta's own Ads Manager.",
              },
              {
                name: locale === "ko" ? "한소율" : "Sophie Han",
                role: locale === "ko" ? "마케팅 에이전시" : "Marketing Agency",
                avatar: "S",
                color: "bg-cyan-100 text-cyan-700",
                stars: 5,
                quote: locale === "ko"
                  ? "클라이언트 10곳 광고를 혼자 돌리는 데 Maktmakr 없이는 불가능했을 거예요. 자동 생성 + 자동 최적화가 진짜."
                  : "Running ads for 10 clients solo would be impossible without Maktmakr. Auto-generation plus auto-optimization is the unlock.",
              },
            ].map((testimonial, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.stars }).map((_, s) => (
                      <svg key={s} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  {/* Author */}
                  <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${testimonial.color}`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section className="relative z-10 py-24">
        <div className="pointer-events-none absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-50/60 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-violet-600">
              Benefits
            </p>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t.benefitsTitle}
            </h2>
          </ScrollReveal>

          <div className="mx-auto mt-12 max-w-3xl grid gap-3 sm:grid-cols-2">
            {t.benefits.map((b, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="flex items-center gap-3 rounded-xl border border-amber-100/60 bg-white/80 px-5 py-4 shadow-sm transition-all hover:border-violet-200 hover:shadow-md">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50">
                    <CheckCircle className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{b}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative z-10 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-8 py-20 text-center sm:px-16">
              {/* Background decorations */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-300/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <h2 className="relative text-3xl font-extrabold text-white sm:text-4xl leading-tight">
                {t.ctaTitle1}
                <br />
                {t.ctaTitle2}
              </h2>
              <p className="relative mt-4 text-violet-200">
                {t.ctaSub}
              </p>
              <Link
                href="/signup"
                className="relative mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-violet-600 shadow-lg hover:bg-violet-50 hover:scale-[1.02] transition-all"
              >
                {t.ctaButton}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-amber-100/60 py-8 bg-[#FFF9F5]">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Maktmakr. {t.footer}
        </div>
      </footer>
    </div>
  );
}
