"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Link as LinkIcon, MousePointer, DollarSign } from "lucide-react";
import type { AffiliateLink } from "@/types/affiliate";

export default function MyProgramsPage() {
  const { profile } = useAuth();
  const [links, setLinks] = useState<(AffiliateLink & { programName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      const q = query(
        collection(getDb(), "affiliateLinks"),
        where("influencerId", "==", profile!.uid)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as AffiliateLink
      );

      // Enrich with program names
      const enriched = await Promise.all(
        items.map(async (link) => {
          const { getDoc, doc } = await import("firebase/firestore");
          const programSnap = await getDoc(
            doc(getDb(), "affiliatePrograms", link.programId)
          );
          return {
            ...link,
            programName: programSnap.exists()
              ? (programSnap.data() as { name: string }).name
              : "Unknown Program",
          };
        })
      );

      setLinks(enriched);
      setLoading(false);
    }
    load();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">My Programs</h1>
      <p className="mt-2 text-gray-600">
        Programs you&apos;ve joined and your tracking links.
      </p>

      {links.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-600">
              You haven&apos;t joined any programs yet.
            </p>
            <Link
              href="/affiliates"
              className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-700"
            >
              Browse programs &rarr;
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {links.map((link) => (
            <Card key={link.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {link.programName}
                  </p>
                  <code className="mt-1 block text-xs text-gray-500">
                    Code: {link.code}
                  </code>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm">
                      <MousePointer className="h-3 w-3 text-gray-400" />
                      <span className="font-semibold">{link.clicks}</span>
                    </div>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      <span className="font-semibold">
                        ${link.earnings.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Earned</p>
                  </div>
                  <Badge variant="success">{link.conversions} conv.</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
