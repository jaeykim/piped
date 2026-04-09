import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users/[userId]
// Returns the user's full record + recent projects, campaigns,
// optimization log entries, credit history. Used by /admin/users/[id].
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      photoURL: true,
      role: true,
      isAdmin: true,
      credits: true,
      onboardingComplete: true,
      createdAt: true,
      updatedAt: true,
      metaAccessToken: true,
      metaAdAccountId: true,
      metaConnectedAt: true,
      metaExpiresAt: true,
      googleRefreshToken: true,
      googleCustomerId: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [projects, campaigns, optimizationLogs, creditHistory] =
    await Promise.all([
      prisma.project.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          name: true,
          url: true,
          status: true,
          pipelineStage: true,
          createdAt: true,
          _count: {
            select: { creatives: true, copyVariants: true, campaigns: true },
          },
        },
      }),
      prisma.campaign.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          name: true,
          platform: true,
          status: true,
          objective: true,
          budgetAmount: true,
          targetRoas: true,
          optimizationEnabled: true,
          createdAt: true,
        },
      }),
      prisma.optimizationLog.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { campaign: { select: { name: true } } },
      }),
      prisma.creditHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: user.role,
      isAdmin: user.isAdmin,
      credits: user.credits,
      onboardingComplete: user.onboardingComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      metaConnected: !!user.metaAccessToken,
      metaAdAccountId: user.metaAdAccountId,
      metaConnectedAt: user.metaConnectedAt,
      metaExpiresAt: user.metaExpiresAt,
      googleConnected: !!user.googleRefreshToken,
      googleCustomerId: user.googleCustomerId,
    },
    projects,
    campaigns,
    optimizationLogs: optimizationLogs.map((l) => ({
      id: l.id,
      campaignId: l.campaignDocId,
      campaignName: l.campaign?.name ?? "(deleted)",
      kind: l.kind,
      reason: l.reason,
      recentRoas: l.recentRoas,
      recentSpend: l.recentSpend,
      targetRoas: l.targetRoas,
      nextDailyBudget: l.nextDailyBudget,
      createdAt: l.createdAt,
    })),
    creditHistory,
  });
}

// PATCH /api/admin/users/[userId]
// Admin can adjust credits and toggle isAdmin.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { userId } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.credits === "number") data.credits = body.credits;
  if (typeof body.isAdmin === "boolean") data.isAdmin = body.isAdmin;

  const u = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return NextResponse.json({ user: { id: u.id, credits: u.credits, isAdmin: u.isAdmin } });
}
