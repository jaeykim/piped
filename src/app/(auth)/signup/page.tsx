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

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">OR</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <Button variant="outline" onClick={handleGoogle} className="mt-4 w-full">
        {t.auth.continueWithGoogle}
      </Button>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
