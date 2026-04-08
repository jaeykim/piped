import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

// Returns the current user's Postgres profile, shaped to match the legacy
// UserProfile interface the client already understands. The client identifies
// itself with its Firebase ID token in the Authorization header.

function shape(u: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>) {
  return {
    uid: u.id,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    role: u.role,
    credits: u.credits,
    onboardingComplete: u.onboardingComplete,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    integrations: {
      meta: u.metaAccessToken
        ? {
            accessToken: u.metaAccessToken,
            adAccountId: u.metaAdAccountId ?? "",
            expiresAt: u.metaExpiresAt,
          }
        : undefined,
      google: u.googleRefreshToken
        ? {
            refreshToken: u.googleRefreshToken,
            customerId: u.googleCustomerId ?? "",
          }
        : undefined,
    },
    payoutSettings: {
      cryptoNetwork: u.cryptoNetwork ?? "",
      cryptoAddress: u.cryptoAddress ?? "",
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const u = await prisma.user.findUnique({ where: { id: decoded.uid } });
    if (!u) return NextResponse.json({ user: null }, { status: 200 });
    return NextResponse.json({ user: shape(u) });
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

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.displayName === "string") data.displayName = body.displayName;
    if (typeof body.photoURL === "string") data.photoURL = body.photoURL;
    if (typeof body.cryptoNetwork === "string") data.cryptoNetwork = body.cryptoNetwork;
    if (typeof body.cryptoAddress === "string") data.cryptoAddress = body.cryptoAddress;

    // Disconnect integrations: client passes { disconnectMeta: true } / { disconnectGoogle: true }
    if (body.disconnectMeta) {
      data.metaAccessToken = null;
      data.metaAdAccountId = null;
      data.metaExpiresAt = null;
      data.metaConnectedAt = null;
    }
    if (body.disconnectGoogle) {
      data.googleRefreshToken = null;
      data.googleCustomerId = null;
    }

    const u = await prisma.user.update({
      where: { id: decoded.uid },
      data,
    });
    return NextResponse.json({ user: shape(u) });
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

// POST = create the user row on first signup
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const u = await prisma.user.upsert({
      where: { id: decoded.uid },
      update: {},
      create: {
        id: decoded.uid,
        email: decoded.email ?? body.email ?? `${decoded.uid}@unknown.invalid`,
        displayName:
          body.displayName ||
          decoded.name ||
          (decoded.email ? decoded.email.split("@")[0] : "User"),
        photoURL: decoded.picture ?? null,
        role: body.role === "influencer" ? "influencer" : "owner",
        credits: 50, // free starter pack
        onboardingComplete: true,
      },
    });
    return NextResponse.json({ user: shape(u) });
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
