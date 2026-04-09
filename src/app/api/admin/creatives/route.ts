import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/creatives?limit=60
// Top-level admin creatives index — newest creatives across every user.
// Used to give admins a "gallery view" of everything that's been generated.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const limit = Math.min(
    300,
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "60"))
  );

  const creatives = await prisma.creative.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          owner: { select: { email: true, displayName: true } },
        },
      },
    },
  });

  return NextResponse.json({
    creatives: creatives.map((c) => ({
      id: c.id,
      imageUrl: c.imageUrl,
      concept: c.concept,
      subject: c.subject,
      size: c.size,
      platform: c.platform,
      status: c.status,
      createdAt: c.createdAt,
      project: {
        id: c.project.id,
        name: c.project.name,
        ownerId: c.project.ownerId,
        ownerEmail: c.project.owner.email,
        ownerName: c.project.owner.displayName,
      },
    })),
  });
}
