import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

// Verifies the bearer token AND that the user has the isAdmin flag.
// Returns either the uid (success) or a NextResponse to short-circuit
// with (failure). Use it like:
//
//   const auth = await requireAdmin(request);
//   if (auth instanceof NextResponse) return auth;
//   const uid = auth;
export async function requireAdmin(
  request: Request
): Promise<string | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const u = await prisma.user.findUnique({
      where: { id: decoded.uid },
      select: { id: true, isAdmin: true },
    });
    if (!u || !u.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return u.id;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
