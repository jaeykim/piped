import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { programId } = await request.json();

    // Check program exists and is active
    const programSnap = await adminDb
      .doc(`affiliatePrograms/${programId}`)
      .get();
    if (!programSnap.exists || programSnap.data()?.status !== "active") {
      return NextResponse.json(
        { error: "Program not found or inactive" },
        { status: 404 }
      );
    }

    // Check if already joined
    const existingLinks = await adminDb
      .collection("affiliateLinks")
      .where("programId", "==", programId)
      .where("influencerId", "==", uid)
      .get();

    if (!existingLinks.empty) {
      const existingLink = existingLinks.docs[0];
      return NextResponse.json({
        success: true,
        linkId: existingLink.id,
        code: existingLink.data().code,
        alreadyJoined: true,
      });
    }

    // Get destination URL from the project
    const projectId = programSnap.data()!.projectId;
    const projectSnap = await adminDb.doc(`projects/${projectId}`).get();
    const destinationUrl = projectSnap.data()?.url || "";

    // Create affiliate link
    const code = nanoid(8);
    const linkRef = await adminDb.collection("affiliateLinks").add({
      programId,
      influencerId: uid,
      code,
      destinationUrl,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Increment affiliate count
    await adminDb.doc(`affiliatePrograms/${programId}`).update({
      totalAffiliates: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      linkId: linkRef.id,
      code,
    });
  } catch (error) {
    console.error("Error joining program:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to join" },
      { status: 500 }
    );
  }
}
