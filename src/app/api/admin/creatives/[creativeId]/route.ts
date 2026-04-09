import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/creatives/[creativeId]
// Admin drill-down for a single ad creative. Returns the creative row,
// the parent project, the project owner, and any campaigns in the
// project (so admins can see "where did this image end up running").
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { creativeId } = await params;

  const creative = await prisma.creative.findUnique({
    where: { id: creativeId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          url: true,
          ownerId: true,
          status: true,
          owner: {
            select: { id: true, email: true, displayName: true },
          },
          campaigns: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              name: true,
              status: true,
              platform: true,
              budgetAmount: true,
              targetRoas: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!creative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    creative: {
      id: creative.id,
      imageUrl: creative.imageUrl,
      prompt: creative.prompt,
      size: creative.size,
      platform: creative.platform,
      concept: creative.concept,
      subject: creative.subject,
      overlayText: creative.overlayText,
      status: creative.status,
      createdAt: creative.createdAt,
    },
    project: creative.project,
    owner: creative.project.owner,
    campaigns: creative.project.campaigns,
  });
}
