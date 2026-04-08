import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const link = await prisma.affiliateLink.findUnique({
      where: { code },
      include: { program: { select: { cookieDurationDays: true } } },
    });
    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const cookieDays = link.program?.cookieDurationDays ?? 30;

    await prisma.$transaction([
      prisma.affiliateEvent.create({
        data: {
          linkId: link.id,
          programId: link.programId,
          influencerId: link.influencerId,
          type: "click",
        },
      }),
      prisma.affiliateLink.update({
        where: { id: link.id },
        data: { clicks: { increment: 1 } },
      }),
    ]);

    const destinationUrl = link.destinationUrl || "/";
    const separator = destinationUrl.includes("?") ? "&" : "?";
    const redirectUrl = `${destinationUrl}${separator}ref=${code}`;

    const response = NextResponse.redirect(redirectUrl, 302);
    response.cookies.set("piped_ref", code, {
      maxAge: cookieDays * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.redirect("/", 302);
  }
}
