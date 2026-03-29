import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Seed demo affiliate programs for testing.
 * POST /api/affiliates/seed
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const demoPrograms = [
      {
        projectId: "demo-piped",
        ownerId: "demo-owner",
        name: "Piped 제휴 프로그램",
        description: "마케팅 자동화 플랫폼 Piped를 홍보하고 건당 $5 커미션을 받으세요. URL만 입력하면 AI가 광고를 만들어주는 서비스입니다.",
        commissionType: "fixed",
        commissionValue: 5,
        cookieDurationDays: 30,
        status: "active",
        totalAffiliates: 12,
        destinationUrl: "https://pied-pi.vercel.app",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        projectId: "demo-glowbook",
        ownerId: "demo-owner",
        name: "Glowbook 뷰티 제휴",
        description: "AI 피부 분석 서비스 Glowbook을 추천하고 매 가입당 15% 커미션을 받으세요. 뷰티/스킨케어 인플루언서에게 최적!",
        commissionType: "percentage",
        commissionValue: 15,
        cookieDurationDays: 60,
        status: "active",
        totalAffiliates: 28,
        destinationUrl: "https://glowbook.kr",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        projectId: "demo-coderunner",
        ownerId: "demo-owner",
        name: "CodeRunner Pro 제휴",
        description: "개발자를 위한 AI 코드 리뷰 툴. 유료 전환 시 $10 고정 커미션. 개발자 커뮤니티에서 홍보하세요.",
        commissionType: "fixed",
        commissionValue: 10,
        cookieDurationDays: 14,
        status: "active",
        totalAffiliates: 5,
        destinationUrl: "https://example.com",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    ];

    const ids: string[] = [];
    for (const prog of demoPrograms) {
      // Check if already exists
      const existing = await adminDb.collection("affiliatePrograms")
        .where("projectId", "==", prog.projectId)
        .limit(1)
        .get();

      if (existing.empty) {
        const ref = await adminDb.collection("affiliatePrograms").add(prog);
        ids.push(ref.id);
      } else {
        // Fix ownerId if it was set to a real user
        const existingDoc = existing.docs[0];
        if (existingDoc.data().ownerId !== "demo-owner") {
          await existingDoc.ref.update({ ownerId: "demo-owner" });
        }
        ids.push(existingDoc.id);
      }
    }

    return NextResponse.json({ success: true, programIds: ids });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}
