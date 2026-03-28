"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDb, getAuth_ } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { User, Link, Shield } from "lucide-react";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(getDb(), "users", profile.uid), {
        displayName,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      toast("success", "Profile updated");
    } catch {
      toast("error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const metaConnected = !!profile?.integrations?.meta?.accessToken;
  const googleConnected = !!profile?.integrations?.google?.refreshToken;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Profile</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-sm text-gray-600">{profile?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <Badge>
              {profile?.role === "owner" ? "Product Owner" : "Influencer"}
            </Badge>
          </div>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Integrations (Owner only) */}
      {profile?.role === "owner" && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">
                Ad Platform Integrations
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-900">Meta Ads</p>
                <p className="text-sm text-gray-500">
                  Facebook &amp; Instagram advertising
                </p>
              </div>
              {metaConnected ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Button size="sm" variant="outline">
                  Connect
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-900">Google Ads</p>
                <p className="text-sm text-gray-500">
                  Search &amp; display advertising
                </p>
              </div>
              {googleConnected ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Button size="sm" variant="outline">
                  Connect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Security</h2>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              const { sendPasswordResetEmail } = await import("firebase/auth");
              if (profile?.email) {
                await sendPasswordResetEmail(getAuth_(), profile.email);
                toast("success", "Password reset email sent!");
              }
            }}
          >
            Reset Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
