import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  try {
    // List active programs (public)
    const snap = await adminDb
      .collection("affiliatePrograms")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .get();

    const programs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await request.json();
    const {
      projectId,
      name,
      description,
      commissionType,
      commissionValue,
      cookieDurationDays,
    } = body;

    // Verify project ownership
    const projectSnap = await adminDb.doc(`projects/${projectId}`).get();
    if (!projectSnap.exists || projectSnap.data()?.ownerId !== uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const programRef = await adminDb.collection("affiliatePrograms").add({
      projectId,
      ownerId: uid,
      name,
      description,
      commissionType,
      commissionValue,
      cookieDurationDays: cookieDurationDays || 30,
      status: "active",
      totalAffiliates: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update project pipeline stage
    await adminDb.doc(`projects/${projectId}`).update({
      pipelineStage: "affiliates",
      status: "ready",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      programId: programRef.id,
    });
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Creation failed" },
      { status: 500 }
    );
  }
}
