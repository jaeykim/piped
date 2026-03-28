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

    // Record click event
    await adminDb.collection("affiliateEvents").add({
      linkId: linkDoc.id,
      programId: linkData.programId,
      influencerId: linkData.influencerId,
      type: "click",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Increment click counter
    await linkDoc.ref.update({
      clicks: FieldValue.increment(1),
    });

    // Redirect to destination
    const destinationUrl = linkData.destinationUrl || "/";
    const separator = destinationUrl.includes("?") ? "&" : "?";
    const redirectUrl = `${destinationUrl}${separator}ref=${code}`;

    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.redirect("/", 302);
  }
}
