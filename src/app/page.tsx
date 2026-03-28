import Link from "next/link";
import {
  Zap,
  Globe,
  PenTool,
  Image,
  Megaphone,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const steps = [
  {
    icon: Globe,
    title: "Paste Your URL",
    desc: "We crawl and analyze your website to understand your product, audience, and brand.",
  },
  {
    icon: PenTool,
    title: "Generate Copy",
    desc: "AI creates headlines, descriptions, ad copy, and social posts tailored to your brand.",
  },
  {
    icon: Image,
    title: "Create Visuals",
    desc: "Stunning ad creatives generated in every size for every platform.",
  },
  {
    icon: Megaphone,
    title: "Launch Campaigns",
    desc: "One-click campaign creation on Meta Ads and Google Ads with smart targeting.",
  },
  {
    icon: Users,
    title: "Affiliate Pipeline",
    desc: "Let influencers promote your product and track every click and conversion.",
  },
];

const benefits = [
  "No marketing experience needed",
  "From URL to live ads in minutes",
  "AI-powered copy that converts",
  "Built for vibe coders and indie hackers",
  "Affiliate system for organic growth",
  "Performance tracking in one dashboard",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Piped</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
          <Zap className="h-4 w-4" />
          Built for Vibe Coders
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          You built the product.
          <br />
          <span className="text-indigo-600">We handle the marketing.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Paste your website URL and watch as AI generates marketing copy,
          stunning creatives, and launches ad campaigns — all in one pipeline.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
          >
            Start Your Pipeline
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            See How It Works
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Your Marketing Pipeline in 5 Steps
          </h2>
          <p className="mt-4 text-center text-lg text-gray-600">
            From zero to live campaigns, fully automated.
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-5">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
                    <Icon className="h-7 w-7 text-indigo-600" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-indigo-600">
                    Step {i + 1}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Why Builders Choose Piped
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 text-left">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                  <span className="text-gray-700">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Stop struggling with marketing.
            <br />
            Start your pipeline today.
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Piped. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
