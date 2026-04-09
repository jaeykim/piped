import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats — high-level numbers for the admin overview.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOf7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOf30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    signupsToday,
    signups7d,
    signups30d,
    metaConnected,
    googleConnected,
    totalProjects,
    totalCampaigns,
    activeCampaigns,
    optimizationActions,
    creativesGenerated,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOf7d } } }),
    prisma.user.count({ where: { createdAt: { gte: startOf30d } } }),
    prisma.user.count({ where: { metaAccessToken: { not: null } } }),
    prisma.user.count({ where: { googleRefreshToken: { not: null } } }),
    prisma.project.count(),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: "active" } }),
    prisma.optimizationLog.count({
      where: {
        kind: { in: ["pause", "scale_budget"] },
        createdAt: { gte: startOf7d },
      },
    }),
    prisma.creative.count(),
  ]);

  return NextResponse.json({
    users: {
      total: totalUsers,
      signupsToday,
      signups7d,
      signups30d,
      metaConnected,
      googleConnected,
    },
    projects: { total: totalProjects },
    campaigns: {
      total: totalCampaigns,
      active: activeCampaigns,
    },
    optimizer: {
      actions7d: optimizationActions,
    },
    creatives: { total: creativesGenerated },
  });
}
