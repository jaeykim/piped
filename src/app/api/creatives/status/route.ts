import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

// Legacy endpoint — Nano Banana 2 generates synchronously, but the client
// still polls this for backward compat.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const creativeId = request.nextUrl.searchParams.get("creativeId");
    if (!creativeId) {
      return NextResponse.json(
        { error: "creativeId is required" },
        { status: 400 }
      );
    }

    const creative = await prisma.creative.findUnique({
      where: { id: creativeId },
      select: { status: true, imageUrl: true },
    });
    if (!creative) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: creative.status,
      imageUrl: creative.imageUrl || null,
    });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    );
  }
}
