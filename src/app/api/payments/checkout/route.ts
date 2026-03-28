import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
}

const CREDIT_PACKS = [
  { id: "starter", credits: 100, priceInCents: 1000, name: "Starter Pack — 100 Credits" },
  { id: "growth", credits: 500, priceInCents: 4000, name: "Growth Pack — 500 Credits" },
  { id: "pro", credits: 1000, priceInCents: 7000, name: "Pro Pack — 1,000 Credits" },
];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { packId } = await request.json();
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: pack.name },
          unit_amount: pack.priceInCents,
        },
        quantity: 1,
      }],
      metadata: {
        uid,
        packId: pack.id,
        credits: pack.credits.toString(),
      },
      success_url: `${baseUrl}/settings?payment=success&credits=${pack.credits}`,
      cancel_url: `${baseUrl}/settings?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
