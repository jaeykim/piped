import { headers } from "next/headers";
import Link from "next/link";
import {
  Zap,
  Globe,
  Megaphone,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getLandingText, detectLocale } from "@/lib/i18n/landing";

const stepIcons = [Globe, Sparkles, Megaphone];

export default async function LandingPage() {
  const hdrs = await headers();
  const locale = detectLocale(hdrs.get("accept-language"));
  const t = getLandingText(locale);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* ─── Background Effects ─── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="pointer-events-none fixed left-1/2 top-0 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-100/60 blur-[120px]" />

      {/* ─── Header ─── */}
      <header className="relative z-10 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Piped</span>
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
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm"
            >
              {t.getStarted}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Sparkles className="h-4 w-4" />
            {t.badge}
          </div>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl leading-[1.1]">
            {t.heroTitle1}
            <br />
            <span className="text-indigo-600">{t.heroTitle2}</span>
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
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-indigo-500/25 transition-all"
            >
              {t.ctaStart}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-xl border border-gray-200 px-7 py-3.5 text-base font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              {t.ctaHow}
            </Link>
          </div>
        </ScrollReveal>

        {/* Social proof numbers */}
        <ScrollReveal delay={400}>
          <div className="mx-auto mt-16 flex max-w-2xl items-center justify-center gap-8 sm:gap-16">
            {[
              { icon: Clock, value: "3min", label: t.statTime },
              { icon: DollarSign, value: "$0", label: t.statCost },
              { icon: BarChart3, value: "5x", label: t.statRoas },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="mx-auto h-5 w-5 text-indigo-500" />
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
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-indigo-600">
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
                        <ArrowRight className="h-5 w-5 text-indigo-300" />
                      </div>
                    )}
                    {/* Number + Icon */}
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-all group-hover:bg-indigo-100 group-hover:shadow-lg group-hover:shadow-indigo-100/50">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white ring-2 ring-white">
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
      <section className="relative z-10 bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-indigo-600">
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
                role: locale === "ko" ? "인디 해커" : "Indie Hacker",
                avatar: "A",
                color: "bg-indigo-100 text-indigo-700",
                stars: 5,
                quote: locale === "ko"
                  ? "사이드 프로젝트 마케팅에 시간을 쏟을 수 없었는데, Piped로 3분 만에 광고 캠페인까지 세팅했습니다. 진짜 마법 같아요."
                  : "I couldn't spend time on marketing my side project. Piped set up my ad campaign in 3 minutes. It felt like magic.",
              },
              {
                name: locale === "ko" ? "이서연" : "Sarah Kim",
                role: locale === "ko" ? "스타트업 대표" : "Startup Founder",
                avatar: "S",
                color: "bg-emerald-100 text-emerald-700",
                stars: 5,
                quote: locale === "ko"
                  ? "마케팅 팀 없이 혼자 운영하는데, Piped가 카피라이터 + 디자이너 + 미디어바이어 역할을 다 해줍니다. ROAS가 4배 올랐어요."
                  : "Running solo without a marketing team, Piped does the job of a copywriter, designer, and media buyer all at once. My ROAS went up 4x.",
              },
              {
                name: locale === "ko" ? "박재현" : "James Park",
                role: locale === "ko" ? "프리랜서 개발자" : "Freelance Developer",
                avatar: "J",
                color: "bg-amber-100 text-amber-700",
                stars: 5,
                quote: locale === "ko"
                  ? "URL 하나 넣었더니 페이스북 광고 이미지가 바로 나왔습니다. 클라이언트한테 보여줬더니 바로 계약했어요. 게임 체인저입니다."
                  : "I just pasted a URL and got Facebook ad creatives instantly. Showed it to my client and closed the deal on the spot. Game changer.",
              },
              {
                name: locale === "ko" ? "최은지" : "Emily Choi",
                role: locale === "ko" ? "이커머스 운영자" : "E-commerce Owner",
                avatar: "E",
                color: "bg-pink-100 text-pink-700",
                stars: 5,
                quote: locale === "ko"
                  ? "광고 대행사에 월 300만원 쓰던 걸 Piped로 대체했습니다. 퀄리티는 오히려 더 좋아졌고, 비용은 1/10로 줄었어요."
                  : "Replaced my $3K/month ad agency with Piped. The quality is actually better and costs 1/10th of what I was paying.",
              },
              {
                name: locale === "ko" ? "정도윤" : "David Jung",
                role: locale === "ko" ? "SaaS 창업자" : "SaaS Founder",
                avatar: "D",
                color: "bg-violet-100 text-violet-700",
                stars: 5,
                quote: locale === "ko"
                  ? "제휴 프로그램까지 자동으로 세팅해주는 건 진짜 미쳤습니다. 인플루언서들이 알아서 제품을 홍보해주고 있어요."
                  : "The auto-setup affiliate program is insane. Influencers are promoting my product on their own now.",
              },
              {
                name: locale === "ko" ? "한소율" : "Sophie Han",
                role: locale === "ko" ? "콘텐츠 크리에이터" : "Content Creator",
                avatar: "S",
                color: "bg-cyan-100 text-cyan-700",
                stars: 5,
                quote: locale === "ko"
                  ? "디자인 감각이 없어서 항상 외주를 맡겼는데, Piped가 만든 광고 이미지가 디자이너보다 낫습니다. 진심으로요."
                  : "I always outsourced design work. The ad creatives Piped generates are honestly better than what my designer made.",
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
        <div className="pointer-events-none absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-purple-50 blur-[80px]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Benefits
            </p>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t.benefitsTitle}
            </h2>
          </ScrollReveal>

          <div className="mx-auto mt-12 max-w-3xl grid gap-3 sm:grid-cols-2">
            {t.benefits.map((b, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
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
            <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-8 py-16 text-center sm:px-16">
              {/* Background decorations */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-400/30 blur-2xl" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />

              <h2 className="relative text-3xl font-extrabold text-white sm:text-4xl leading-tight">
                {t.ctaTitle1}
                <br />
                {t.ctaTitle2}
              </h2>
              <p className="relative mt-4 text-indigo-200">
                {t.ctaSub}
              </p>
              <Link
                href="/signup"
                className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-indigo-600 shadow-lg hover:bg-indigo-50 transition-colors"
              >
                {t.ctaButton}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Piped. {t.footer}
        </div>
      </footer>
    </div>
  );
}
