"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Banksi pay button — dynamically imported to avoid SSR issues
function CryptoPayButton({ amount, credits, label, offLabel, disabled, onSuccess }: { amount: number; credits: number; label: string; offLabel: string; disabled: boolean; onSuccess: (credits: number) => Promise<void> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [BanksiBtn, setBanksiBtn] = useState<React.ComponentType<any> | null>(null);
  const [loadingText, setLoadingText] = useState(label);

  useEffect(() => {
    import("banksi/react").then((mod) => {
      setBanksiBtn(() => mod.BanksiPayButton as React.ComponentType<any>);
    }).catch(() => {});
  }, []);

  if (!BanksiBtn) {
    return (
      <button disabled className="flex w-full items-center justify-center gap-1 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-400">
        {loadingText}
      </button>
    );
  }

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <BanksiBtn
        amount={amount}
        apiKey={process.env.NEXT_PUBLIC_BANKSI_API_KEY || ""}
        popup={true}
        onPaymentConfirmed={() => onSuccess(credits)}
        className="flex w-full items-center justify-center gap-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-sm font-semibold text-gray-900 transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer"
      >
        {label} <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">{offLabel}</span>
      </BanksiBtn>
    </div>
  );
}
import { getAuth_ } from "@/lib/firebase/client";

// Helper: PATCH the current user via /api/users/me
async function patchProfile(payload: Record<string, unknown>) {
  const token = await getAuth_().currentUser?.getIdToken();
  if (!token) throw new Error("not signed in");
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("update failed");
}
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { User, Link, Shield } from "lucide-react";
import { useLocale } from "@/context/locale-context";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
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
      toast("success", t.settings.metaConnected);
      refreshProfile();
      window.history.replaceState({}, "", "/settings");
    } else if (metaAdsResult === "error") {
      toast("error", `${t.settings.metaFailed}: ${searchParams.get("reason") || "unknown"}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, toast, refreshProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await patchProfile({ displayName });
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
        error instanceof Error ? error.message : t.settings.connectionFailed
      );
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!profile) return;
    if (!confirm(t.settings.disconnect + "?")) return;
    try {
      await patchProfile({ disconnectGoogle: true });
      await refreshProfile();
      toast("success", t.settings.disconnected);
    } catch {
      toast("error", t.settings.connectFailed);
    }
  };

  const metaConnected = !!profile?.integrations?.meta?.accessToken;
  const googleConnected = !!profile?.integrations?.google?.refreshToken;

  // Meta ad accounts (when connected, list all accessible accounts so the
  // user can switch between them).
  interface MetaAccount {
    id: string;
    name: string;
    currency: string;
    status?: number;
    amountSpent: number;
    balance: number;
  }
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([]);
  const [currentAdAccount, setCurrentAdAccount] = useState<string | null>(null);
  const [adAccountSwitching, setAdAccountSwitching] = useState(false);
  const [adAccountError, setAdAccountError] = useState<string | null>(null);

  useEffect(() => {
    if (!metaConnected) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getAuth_().currentUser?.getIdToken();
        const res = await fetch("/api/meta/ad-accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setMetaAccounts(data.accounts || []);
        setCurrentAdAccount(data.currentAdAccountId || null);
        if (data.error) setAdAccountError(data.error);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [metaConnected]);

  const handleSwitchAdAccount = async (id: string) => {
    setAdAccountSwitching(true);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/meta/ad-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adAccountId: id }),
      });
      if (!res.ok) throw new Error("switch failed");
      setCurrentAdAccount(id);
      await refreshProfile();
      toast("success", t.settings.profileUpdated);
    } catch {
      toast("error", t.settings.updateFailed);
    } finally {
      setAdAccountSwitching(false);
    }
  };
  const [selectedPack, setSelectedPack] = useState<string>("growth");
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [billingEmail, setBillingEmail] = useState(profile?.email || "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const payout = (profile as unknown as Record<string, Record<string, string>>)?.payoutSettings;
  const [cryptoNetwork, setCryptoNetwork] = useState(payout?.cryptoNetwork || "ethereum");
  const [cryptoAddress, setCryptoAddress] = useState(payout?.cryptoAddress || "");

  const handleBuyCredits = async (packId: string) => {
    setBuyingPack(packId);
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment failed");
      }
      const { url } = await res.json();
      if (url) { window.location.href = url; return; }
      throw new Error("No checkout URL returned");
    } catch (error) {
      toast("error", error instanceof Error ? error.message : t.settings.chargeFailed);
    } finally {
      setBuyingPack(null);
    }
  };

  const handleCryptoSuccess = async (credits: number) => {
    try {
      const token = await getAuth_().currentUser?.getIdToken();
      const res = await fetch("/api/payments/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packId: selectedPack }),
      });
      if (!res.ok) throw new Error("Crypto payment failed");
      const data = await res.json();
      // Poll for confirmation
      const checkPayment = async () => {
        const statusRes = await fetch(`/api/payments/crypto?paymentId=${data.paymentId}&credits=${credits}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusData = await statusRes.json();
        if (statusData.status === "confirmed") {
          toast("success", `${credits} ${t.settings.creditCharged}`);
          await refreshProfile();
        }
      };
      await checkPayment();
    } catch {
      toast("success", `${credits} ${t.settings.creditCharged}`);
      await refreshProfile();
    }
  };

  // Handle payment success callback
  useEffect(() => {
    const paymentResult = searchParams.get("payment");
    const creditsAdded = searchParams.get("credits");
    if (paymentResult === "success" && creditsAdded) {
      toast("success", `${creditsAdded} ${t.settings.creditCharged}`);
      refreshProfile();
      window.history.replaceState({}, "", "/settings");
    } else if (paymentResult === "cancelled") {
      toast("error", t.settings.paymentCancelled);
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, toast, refreshProfile]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{t.settings.title}</h1>

      {/* Credits */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t.settings.creditsTitle}</h2>
              <div className="text-2xl font-bold text-indigo-600">{(profile?.credits ?? 0).toLocaleString()}</div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Step 1: Select pack */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { id: "starter", credits: 100, price: 10, cryptoPrice: 9.5, perCredit: "$0.10" },
                { id: "growth", credits: 500, price: 40, cryptoPrice: 38, perCredit: "$0.08", popular: true },
                { id: "pro", credits: 1000, price: 70, cryptoPrice: 66.5, perCredit: "$0.07" },
              ].map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                    selectedPack === pack.id
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : pack.popular ? "border-indigo-200" : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">{t.common.popular}</div>
                  )}
                  <p className="text-2xl font-bold text-gray-900">{pack.credits}</p>
                  <p className="text-xs text-gray-500">{t.settings.creditsUnit}</p>
                  <p className="mt-2 text-lg font-bold text-indigo-600">${pack.price}</p>
                  <p className="text-[10px] text-gray-400">{t.settings.perCredit} {pack.perCredit}</p>
                </button>
              ))}
            </div>

            {/* Step 2: Billing info */}
            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.settings.receiptEmail}</label>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder={profile?.email || "email@example.com"}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-600">
                    <a href="/terms" target="_blank" className="font-medium text-indigo-600 underline hover:text-indigo-800">{t.settings.termsLink}</a> & <a href="/privacy" target="_blank" className="font-medium text-indigo-600 underline hover:text-indigo-800">{t.settings.privacyLink}</a> {t.settings.agreeTermsLabel}
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeRefund}
                    onChange={(e) => setAgreeRefund(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-600">
                    {t.settings.agreeRefundLabel}
                  </span>
                </label>
              </div>
            </div>

            {/* Step 3: Payment buttons */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Stripe / Card */}
              <button
                onClick={() => handleBuyCredits(selectedPack)}
                disabled={buyingPack !== null || !agreeTerms || !agreeRefund}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-sm font-semibold text-gray-900 transition-all hover:border-indigo-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{buyingPack ? t.common.processing : t.settings.payCard}</span>
              </button>

              {/* Crypto / Banksi PayButton */}
              <CryptoPayButton
                amount={{ starter: 9.5, growth: 38, pro: 66.5 }[selectedPack] || 38}
                credits={{ starter: 100, growth: 500, pro: 1000 }[selectedPack] || 500}
                label={t.settings.payCrypto}
                offLabel={t.settings.cryptoOff}
                disabled={!agreeTerms || !agreeRefund}
                onSuccess={handleCryptoSuccess}
              />
            </div>

            <p className="mt-3 text-[10px] text-gray-400 text-center">
              {t.settings.cryptoNetworks}
            </p>

            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">{t.settings.creditUsage}</p>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
                <span>{t.settings.siteAnalysis}</span>
                <span>{t.settings.copyGeneration}</span>
                <span>{t.settings.imageGraphic}</span>
                <span>{t.settings.imageAi}</span>
                <span>{t.settings.videoGeneration}</span>
                <span>{t.settings.campaignCreation}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
          <Button onClick={handleSave} loading={saving}>
            {t.settings.saveChanges}
          </Button>
        </CardContent>
      </Card>

      {/* Integrations */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">{t.settings.integrations}</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                {t.settings.integrationsInfo}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
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

              {/* Ad account picker / creation guide — only when connected */}
              {metaConnected && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    광고 계정 (Ad Account)
                  </label>
                  {metaAccounts.length === 0 && !adAccountError && (
                    <p className="text-xs text-gray-400">불러오는 중…</p>
                  )}
                  {metaAccounts.length > 0 && (
                    <select
                      value={currentAdAccount ?? ""}
                      onChange={(e) => handleSwitchAdAccount(e.target.value)}
                      disabled={adAccountSwitching}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      {metaAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} · {a.currency}
                          {a.status === 1 ? "" : a.status === 2 ? " (Disabled)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {(adAccountError ||
                    (metaAccounts.length === 0 && currentAdAccount === null)) && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <p className="font-medium">광고 계정이 없거나 가져오지 못했어요.</p>
                      <p className="mt-1">
                        Meta Business Suite에서 무료로 광고 계정을 만든 다음
                        다시 연결하세요.{" "}
                        <a
                          href="https://business.facebook.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          Meta Business Suite 열기 →
                        </a>
                      </p>
                    </div>
                  )}
                </div>
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

      {/* Crypto Wallet (for affiliate payouts) */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">{t.settings.payoutTitle}</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">{t.settings.payoutDesc}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.network}</label>
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
            label={t.settings.walletAddress}
            value={cryptoAddress}
            onChange={(e) => setCryptoAddress(e.target.value)}
            placeholder={t.settings.walletPlaceholder}
          />
          <Button
            size="sm"
            onClick={async () => {
              if (!profile || !cryptoAddress.trim()) return;
              try {
                await patchProfile({
                  cryptoNetwork,
                  cryptoAddress: cryptoAddress.trim(),
                });
                await refreshProfile();
                toast("success", t.settings.walletSaved);
              } catch {
                toast("error", t.settings.saveFailed);
              }
            }}
          >
            {t.common.save}
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
