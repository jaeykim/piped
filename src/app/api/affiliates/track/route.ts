import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    // Find the affiliate link
    const linksSnap = await adminDb
      .collection("affiliateLinks")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (linksSnap.empty) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const linkDoc = linksSnap.docs[0];
    const linkData = linkDoc.data();

    // Get cookie duration from program
    let cookieDays = 30;
    try {
      const programSnap = await adminDb.doc(`affiliatePrograms/${linkData.programId}`).get();
      if (programSnap.exists) {
        cookieDays = programSnap.data()?.cookieDurationDays || 30;
      }
    } catch { /* use default */ }

    // Record click event
    await adminDb.collection("affiliateEvents").add({
      linkId: linkDoc.id,
      programId: linkData.programId,
      influencerId: linkData.influencerId,
      type: "click",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Increment click counter
    await linkDoc.ref.update({ clicks: FieldValue.increment(1) });

    // Redirect with referral cookie
    const destinationUrl = linkData.destinationUrl || "/";
    const separator = destinationUrl.includes("?") ? "&" : "?";
    const redirectUrl = `${destinationUrl}${separator}ref=${code}`;

    const response = NextResponse.redirect(redirectUrl, 302);

    // Set referral cookie (lasts for cookieDuration days)
    response.cookies.set("piped_ref", code, {
      maxAge: cookieDays * 24 * 60 * 60,
      path: "/",
      httpOnly: false, // readable by client JS for conversion tracking
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.redirect("/", 302);
  }
}
