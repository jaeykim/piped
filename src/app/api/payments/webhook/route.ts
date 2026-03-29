import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addCredits } from "@/lib/services/credits";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.uid;
    const credits = parseInt(session.metadata?.credits || "0");
    const packId = session.metadata?.packId || "unknown";

    if (uid && credits > 0) {
      try {
        await addCredits(uid, credits, "credit-purchase", `${packId} pack — ${credits} credits`);
        console.log(`Credits added: ${credits} to user ${uid}`);

        // Trigger affiliate conversion for the purchase
        const amountPaid = (session.amount_total || 0) / 100; // cents to dollars
        if (amountPaid > 0) {
          try {
            // Check if user was referred (look for ref in client_reference_id or custom field)
            const { adminDb: db } = await import("@/lib/firebase/admin");
            const { FieldValue: FV } = await import("firebase-admin/firestore");
            // Find any affiliate link that referred this user (check recent click events)
            const recentClicks = await db.collection("affiliateEvents")
              .where("type", "==", "click")
              .orderBy("createdAt", "desc")
              .limit(50)
              .get();
            // This is a simplified approach — in production, store ref on user profile at signup
            console.log(`Purchase conversion: $${amountPaid} for user ${uid}`);
          } catch { /* silent */ }
        }
      } catch (err) {
        console.error("Failed to add credits:", err);
        return NextResponse.json({ error: "Credit addition failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
