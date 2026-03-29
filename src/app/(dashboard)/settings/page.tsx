"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { User, Link, Shield } from "lucide-react";
import { useLocale } from "@/context/locale-context";

export default function SettingsPage() {
  const { profile, activeRole, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Handle OAuth callback results
  useEffect(() => {
    const googleAdsResult = searchParams.get("google_ads");
    const metaAdsResult = searchParams.get("meta_ads");
    if (googleAdsResult === "success") {
      toast("success", t.settings.googleConnected);
      refreshProfile();
      window.history.replaceState({}, "", "/settings");
    } else if (googleAdsResult === "error") {
      toast("error", `${t.settings.googleFailed}: ${searchParams.get("reason") || "unknown"}`);
      window.history.replaceState({}, "", "/settings");
    }
    if (metaAdsResult === "success") {
      toast("success", "Meta Ads 계정이 연결되었습니다!");
      refreshProfile();
      window.history.replaceState({}, "", "/settings");
    } else if (metaAdsResult === "error") {
      toast("error", `Meta Ads 연결 실패: ${searchParams.get("reason") || "unknown"}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, toast, refreshProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(getDb(), "users", profile.uid), {
        displayName,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      toast("success", t.settings.profileUpdated);
    } catch {
      toast("error", t.settings.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/auth/google-ads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "연결에 실패했습니다"
      );
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!profile) return;
    if (!confirm(t.settings.disconnect + "?")) return;
    try {
      await updateDoc(doc(getDb(), "users", profile.uid), {
        "integrations.google": {},
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      toast("success", t.settings.disconnected);
    } catch {
      toast("error", t.settings.connectFailed);
    }
  };

  const metaConnected = !!profile?.integrations?.meta?.accessToken;
  const googleConnected = !!profile?.integrations?.google?.refreshToken;
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const payout = (profile as unknown as Record<string, Record<string, string>>)?.payoutSettings;
  const [cryptoNetwork, setCryptoNetwork] = useState(payout?.cryptoNetwork || "ethereum");
  const [cryptoAddress, setCryptoAddress] = useState(payout?.cryptoAddress || "");

  const creditPacks: Record<string, number> = { starter: 100, growth: 500, pro: 1000 };

  const handleBuyCredits = async (packId: string) => {
    setBuyingPack(packId);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      // Test mode: add credits without real payment
      const res = await fetch("/api/payments/test-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ credits: creditPacks[packId] || 100 }),
      });
      if (!res.ok) throw new Error("Charge failed");
      const data = await res.json();
      toast("success", `${data.creditsAdded} 크레딧이 충전되었습니다! (테스트)`);
      await refreshProfile();
    } catch {
      toast("error", "충전에 실패했습니다");
    } finally {
      setBuyingPack(null);
    }
  };

  // Handle payment success callback
  useEffect(() => {
    const paymentResult = searchParams.get("payment");
    const creditsAdded = searchParams.get("credits");
    if (paymentResult === "success" && creditsAdded) {
      toast("success", `${creditsAdded} 크레딧이 충전되었습니다!`);
      refreshProfile();
      window.history.replaceState({}, "", "/settings");
    } else if (paymentResult === "cancelled") {
      toast("error", "결제가 취소되었습니다");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, toast, refreshProfile]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{t.settings.title}</h1>

      {/* Credits */}
      {activeRole === "owner" && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">크레딧</h2>
              <div className="text-2xl font-bold text-indigo-600">{profile?.credits ?? 0}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { id: "starter", credits: 100, price: "$10", perCredit: "$0.10" },
                { id: "growth", credits: 500, price: "$40", perCredit: "$0.08", popular: true },
                { id: "pro", credits: 1000, price: "$70", perCredit: "$0.07" },
              ].map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handleBuyCredits(pack.id)}
                  disabled={buyingPack !== null}
                  className={`relative rounded-xl border-2 p-4 text-center transition-all hover:shadow-md ${
                    pack.popular ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      인기
                    </div>
                  )}
                  <p className="text-2xl font-bold text-gray-900">{pack.credits}</p>
                  <p className="text-xs text-gray-500">크레딧</p>
                  <p className="mt-2 text-lg font-bold text-indigo-600">{pack.price}</p>
                  <p className="text-[10px] text-gray-400">크레딧당 {pack.perCredit}</p>
                  <div className="mt-3">
                    <Badge variant={buyingPack === pack.id ? "info" : "default"}>
                      {buyingPack === pack.id ? "처리중..." : "구매하기"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">크레딧 소모량</p>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
                <span>사이트 분석: 5</span>
                <span>카피 생성: 10</span>
                <span>이미지 (그래픽): 5</span>
                <span>이미지 (AI): 15</span>
                <span>영상 생성: 30</span>
                <span>캠페인 생성: 5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">{t.settings.profile}</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t.auth.displayName}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.email}
            </label>
            <p className="text-sm text-gray-600">{profile?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.settings.role}
            </label>
            <Badge>
              {activeRole === "owner" ? t.sidebar.productOwner : t.sidebar.influencer}
            </Badge>
          </div>
          <Button onClick={handleSave} loading={saving}>
            {t.settings.saveChanges}
          </Button>
        </CardContent>
      </Card>

      {/* Integrations (Owner only) */}
      {activeRole === "owner" && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">{t.settings.integrations}</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-900">{t.settings.metaAds}</p>
                <p className="text-sm text-gray-500">{t.settings.metaAdsDesc}</p>
              </div>
              {metaConnected ? (
                <Badge variant="success">{t.settings.connected}</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    const token = await getAuth_().currentUser?.getIdToken();
                    const res = await fetch("/api/auth/meta-ads", { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) { const { authUrl } = await res.json(); window.location.href = authUrl; }
                  } catch { toast("error", t.settings.connectFailed); }
                }}>
                  {t.settings.connect}
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-900">{t.settings.googleAds}</p>
                <p className="text-sm text-gray-500">{t.settings.googleAdsDesc}</p>
                {googleConnected && profile?.integrations?.google?.customerId && (
                  <p className="mt-1 text-xs text-gray-400">
                    Customer ID: {profile.integrations.google.customerId}
                  </p>
                )}
              </div>
              {googleConnected ? (
                <div className="flex items-center gap-2">
                  <Badge variant="success">{t.settings.connected}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDisconnectGoogle}
                  >
                    {t.settings.disconnect}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConnectGoogle}
                  loading={connectingGoogle}
                >
                  {t.settings.connect}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crypto Wallet (for affiliate payouts) */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">정산 수령 주소</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">제휴 수익을 수령할 크립토 지갑 주소를 입력하세요</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">네트워크</label>
            <select
              value={cryptoNetwork}
              onChange={(e) => setCryptoNetwork(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ethereum">Ethereum (ETH / USDT / USDC)</option>
              <option value="polygon">Polygon (MATIC / USDT / USDC)</option>
              <option value="solana">Solana (SOL / USDC)</option>
              <option value="base">Base (ETH / USDC)</option>
              <option value="bitcoin">Bitcoin (BTC)</option>
            </select>
          </div>
          <Input
            label="지갑 주소"
            value={cryptoAddress}
            onChange={(e) => setCryptoAddress(e.target.value)}
            placeholder="0x... 또는 지갑 주소 입력"
          />
          <Button
            size="sm"
            onClick={async () => {
              if (!profile || !cryptoAddress.trim()) return;
              try {
                await updateDoc(doc(getDb(), "users", profile.uid), {
                  "payoutSettings.cryptoNetwork": cryptoNetwork,
                  "payoutSettings.cryptoAddress": cryptoAddress.trim(),
                  updatedAt: serverTimestamp(),
                });
                await refreshProfile();
                toast("success", "지갑 주소가 저장되었습니다");
              } catch {
                toast("error", "저장 실패");
              }
            }}
          >
            저장
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">{t.settings.security}</h2>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              const { sendPasswordResetEmail } = await import("firebase/auth");
              if (profile?.email) {
                await sendPasswordResetEmail(getAuth_(), profile.email);
                toast("success", t.settings.resetSent);
              }
            }}
          >
            {t.settings.resetPassword}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
