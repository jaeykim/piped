import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users?q=...&limit=50
// Lists users with the activity counts a human admin actually wants:
// projects + campaigns owned, ad-platform connection state, signup date.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  const limit = Math.min(
    200,
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "50"))
  );

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { id: { contains: q } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      isAdmin: true,
      credits: true,
      createdAt: true,
      updatedAt: true,
      metaAccessToken: true,
      metaConnectedAt: true,
      metaAdAccountId: true,
      googleRefreshToken: true,
      _count: {
        select: {
          projects: true,
          campaigns: true,
          optimizationLogs: true,
        },
      },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      isAdmin: u.isAdmin,
      credits: u.credits,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      metaConnected: !!u.metaAccessToken,
      metaConnectedAt: u.metaConnectedAt,
      metaAdAccountId: u.metaAdAccountId,
      googleConnected: !!u.googleRefreshToken,
      counts: u._count,
    })),
  });
}
