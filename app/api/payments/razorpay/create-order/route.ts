import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PROVIDER = "razorpay";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required payment configuration: ${name}`);
  return value;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { market?: string; plan?: string };
    const market = body.market;
    const planCode = body.plan;

    if (market !== "india" && market !== "international") {
      return NextResponse.json({ error: "Market classification is required." }, { status: 400 });
    }
    if (!planCode || planCode === "basic") {
      return NextResponse.json({ error: "A paid candidate plan is required." }, { status: 400 });
    }
    if (process.env.AVENLO_PAYMENT_PROVIDER?.toLowerCase() !== PROVIDER) {
      return NextResponse.json({ error: "Razorpay is not configured for payments." }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "candidate") {
      return NextResponse.json({ error: "Candidate account required." }, { status: 403 });
    }

    const db = createAdminClient();
    const { data: verification } = await db
      .from("candidate_verifications")
      .select("market,status")
      .eq("candidate_id", user.id)
      .maybeSingle();
    if (verification?.status !== "verified" && verification?.status !== "verified_with_conditions") {
      return NextResponse.json({ error: "Candidate verification must be complete before payment." }, { status: 409 });
    }
    if (verification.market !== market) {
      return NextResponse.json({ error: "Market classification does not match this plan." }, { status: 409 });
    }

    const { data: plan } = await db
      .from("candidate_plans")
      .select("id,name,price,currency,term_months,auto_renew,market,code")
      .eq("market", market)
      .eq("code", planCode)
      .eq("active", true)
      .maybeSingle();
    if (!plan || Number(plan.price) <= 0 || plan.term_months !== 6 || plan.auto_renew) {
      return NextResponse.json({ error: "Selected plan is not available for paid checkout." }, { status: 409 });
    }

    const keyId = env("RAZORPAY_KEY_ID");
    const keySecret = env("RAZORPAY_KEY_SECRET");
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const { data: order, error: orderError } = await db
      .from("candidate_service_orders")
      .insert({
        candidate_id: user.id,
        plan_id: plan.id,
        market: plan.market,
        price: plan.price,
        currency: plan.currency,
        status: "payment_pending",
        payment_status: "pending",
        payment_provider: PROVIDER,
        owner_id: user.id,
        next_action: "Complete Razorpay payment",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Unable to create Avenlo service order." }, { status: 500 });
    }

    const amount = Math.round(Number(plan.price) * 100);
    if (amount < 100) {
      return NextResponse.json({ error: "Payment amount must be at least 100 paise." }, { status: 400 });
    }

    let razorpayOrder: { id: string; amount: number; currency: string };
    try {
      razorpayOrder = await razorpay.orders.create({
        amount,
        currency: plan.currency,
        receipt: order.id,
        notes: { avenlo_service_order_id: order.id, candidate_id: user.id },
      });
    } catch (error) {
      await db
        .from("candidate_service_orders")
        .update({ status: "cancelled", next_action: "Review failed payment-order creation" })
        .eq("id", order.id);
      return NextResponse.json({ error: error instanceof Error ? error.message : "Razorpay could not create the payment order." }, { status: 500 });
    }
    await db
      .from("candidate_service_orders")
      .update({
        provider_order_id: razorpayOrder.id,
        next_action: "Complete Razorpay payment",
        next_action_at: null,
      })
      .eq("id", order.id);

    return NextResponse.json({
      orderId: razorpayOrder.id,
      avenloOrderId: order.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
      planName: plan.name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start payment." },
      { status: 500 },
    );
  }
}
