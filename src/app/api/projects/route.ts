import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import type { CampaignType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(100, parseInt(limitParam)) : undefined;

    const projects = await prisma.project.findMany({
      where: { ownerId: decoded.uid },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ projects });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "fetch failed" },
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

    const { url, name, campaignType } = await request.json();
    if (!url || !name) {
      return NextResponse.json(
        { error: "url and name are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        ownerId: decoded.uid,
        url,
        name,
        status: "crawling",
        pipelineStage: "analysis",
        campaignType: (campaignType as CampaignType) ?? null,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (typeof (error as { code?: string })?.code === "string" && (error as { code: string }).code.startsWith("auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "create failed" },
      { status: 500 }
    );
  }
}
