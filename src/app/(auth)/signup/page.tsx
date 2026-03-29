"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, signInWithGoogle } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/context/locale-context";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast("error", t.auth.passwordMin);
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      router.push("/onboarding");
    } catch {
      toast("error", t.auth.signUpFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      const { getUserProfile } = await import("@/lib/firebase/auth");
      const profile = await getUserProfile(user.uid);
      if (profile?.onboardingComplete) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch {
      toast("error", t.auth.googleFailed);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t.auth.createAccount}</h1>
      <p className="mt-2 text-sm text-gray-600">{t.auth.signUpDesc}</p>

      <Button variant="outline" onClick={handleGoogle} className="mt-6 w-full" size="lg">
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        {t.auth.continueWithGoogle}
      </Button>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">OR</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input
          label={t.auth.displayName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label={t.auth.email}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label={t.auth.password}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          {t.auth.signUp}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
