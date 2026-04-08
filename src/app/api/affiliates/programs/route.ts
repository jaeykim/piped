import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    const programs = await prisma.affiliateProgram.findMany({
      where: projectId ? { projectId } : { status: "active" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ programs });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project || project.ownerId !== uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const program = await prisma.affiliateProgram.create({
      data: {
        projectId,
        ownerId: uid,
        name,
        description,
        commissionType: commissionType === "percentage" ? "percentage" : "fixed",
        commissionValue,
        cookieDurationDays: cookieDurationDays || 30,
        status: "active",
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { pipelineStage: "affiliates", status: "ready" },
    });

    return NextResponse.json({ success: true, programId: program.id });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating program:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Creation failed" },
      { status: 500 }
    );
  }
}
