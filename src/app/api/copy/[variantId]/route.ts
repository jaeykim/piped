import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

// PATCH /api/copy/[variantId]
// Lets the owner edit a single generated copy variant.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const { variantId } = await params;
    const variant = await prisma.copyVariant.findUnique({
      where: { id: variantId },
      include: { project: { select: { ownerId: true } } },
    });
    if (!variant || variant.project.ownerId !== decoded.uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { editedContent, isFavorited } = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof editedContent === "string") {
      data.editedContent = editedContent;
      data.isEdited = true;
    }
    if (typeof isFavorited === "boolean") data.isFavorited = isFavorited;

    const updated = await prisma.copyVariant.update({
      where: { id: variantId },
      data,
    });
    return NextResponse.json({ variant: updated });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "update failed" },
      { status: 500 }
    );
  }
}
