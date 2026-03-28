import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

// Legacy endpoint - Nano Banana 2 generates synchronously,
// so this just returns current Firestore status for backward compatibility
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const creativeId = request.nextUrl.searchParams.get("creativeId");
    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!creativeId || !projectId) {
      return NextResponse.json(
        { error: "creativeId and projectId are required" },
        { status: 400 }
      );
    }

    const docSnap = await adminDb
      .doc(`projects/${projectId}/creatives/${creativeId}`)
      .get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = docSnap.data()!;
    return NextResponse.json({
      status: data.status,
      imageUrl: data.imageUrl || null,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    );
  }
}
