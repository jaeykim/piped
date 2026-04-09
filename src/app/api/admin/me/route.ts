import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";

// Lightweight "am I an admin?" probe used by the admin sidebar link to
// decide whether to render itself. Always returns 200 with { isAdmin: bool }
// so the client can branch without juggling 401/403.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ isAdmin: false });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const u = await prisma.user.findUnique({
      where: { id: decoded.uid },
      select: { isAdmin: true },
    });
    return NextResponse.json({ isAdmin: !!u?.isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
