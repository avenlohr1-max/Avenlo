import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutDocuments, checkoutOffer, checkoutPoliciesApproved, checkoutPolicyVersion, checkoutRequest, invoiceIssuer } from "@/lib/payments/checkout";

export const dynamic = "force-dynamic";

const PROVIDER = "razorpay";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required payment configuration: ${name}`);
  return value;
}

export async function POST(request: Request) {
  try {
    const parsed = checkoutRequest(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Complete billing details and accept the current purchase terms." }, { status: 400 });
    if (!checkoutPoliciesApproved()) return NextResponse.json({ error: "Paid checkout is awaiting policy approval." }, { status: 503 });
    const body = parsed.data;
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
      .select("role,status")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "candidate" || !["active", "draft"].includes(profile.status) || !user.email_confirmed_at) {
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

    const offer = checkoutOffer(market, planCode);
    if (!offer || market === "international" && process.env.AVENLO_INTERNATIONAL_PAYMENTS_ENABLED !== "true") {
      return NextResponse.json({ error: "Contact Avenlo to confirm this service before purchase." }, { status: 409 });
    }
    const keyId = env("RAZORPAY_KEY_ID");
    if (keyId !== env("NEXT_PUBLIC_RAZORPAY_KEY_ID") || !process.env.RAZORPAY_WEBHOOK_SECRET) return NextResponse.json({ error: "Payment configuration is incomplete." }, { status: 503 });
    const keySecret = env("RAZORPAY_KEY_SECRET");
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const amount = Math.round(Number(plan.price) * 100);
    if (!Number.isSafeInteger(amount) || amount < 100) return NextResponse.json({ error: "Invalid service price." }, { status: 409 });
    const pending = await db.from("candidate_service_orders").select("id,provider_order_id,price,currency,checkout_snapshot")
      .eq("candidate_id", user.id).eq("plan_id", plan.id).eq("payment_status", "pending").eq("status", "payment_pending").maybeSingle();
    if (pending.error) return NextResponse.json({ error: "Unable to check an existing checkout." }, { status: 503 });
    if (pending.data) {
      const snapshot = pending.data.checkout_snapshot;
      if (!snapshot || snapshot.policyVersion !== checkoutPolicyVersion || Object.entries({ ...body.billing, email: user.email }).some(([key,value]) => snapshot.billing?.[key] !== value)) {
        return NextResponse.json({ error: "A pending order has different billing or terms. Contact support before paying." }, { status: 409 });
      }
      if (!pending.data.provider_order_id) return NextResponse.json({ error: "Checkout is being prepared. Retry shortly." }, { status: 409 });
      return NextResponse.json({ orderId: pending.data.provider_order_id, avenloOrderId: pending.data.id, amount: Math.round(Number(pending.data.price)*100), currency: pending.data.currency, keyId, planName: offer.title });
    }
    const acceptedAt = new Date().toISOString();
    const documents = checkoutDocuments.map(document => ({ type: document.type, version: checkoutPolicyVersion, path: document.path }));
    const snapshot = { issuer: invoiceIssuer, billing: { ...body.billing, email: user.email }, plan: offer.title,
      items: offer.items, termMonths: 6, amountPaise: amount, currency: plan.currency, accepted: true,
      policyVersion: checkoutPolicyVersion, documents, acceptedAt };
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
        checkout_snapshot: snapshot,
        legal_version: checkoutPolicyVersion,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      if (orderError?.code === "23505") return NextResponse.json({ error: "Another checkout is being prepared. Retry shortly; do not pay twice." }, { status: 409 });
      return NextResponse.json({ error: "Unable to create Avenlo service order." }, { status: 500 });
    }

    const acceptance = await db.from("candidate_legal_acceptances").insert(documents.map(document => ({
      candidate_id: user.id, document_type: document.type, version: document.version, source: "razorpay_checkout",
      accepted_at: acceptedAt, metadata: { service_order_id: order.id, accepted_before_payment: true },
    })));
    if (acceptance.error) {
      await db.from("candidate_service_orders").update({ status: "cancelled", next_action: "Unable to record purchase consent" }).eq("id", order.id);
      return NextResponse.json({ error: "Unable to save accepted purchase terms. No payment was started." }, { status: 503 });
    }

    let razorpayOrder: { id: string; amount: number; currency: string };
    try {
      const createdOrder = await razorpay.orders.create({
        amount,
        currency: plan.currency,
        receipt: order.id,
        notes: { avenlo_service_order_id: order.id, candidate_id: user.id },
      });
      razorpayOrder = {
        id: createdOrder.id,
        amount: Number(createdOrder.amount),
        currency: createdOrder.currency,
      };
    } catch {
      await db
        .from("candidate_service_orders")
        .update({ status: "cancelled", next_action: "Review failed payment-order creation" })
        .eq("id", order.id);
      return NextResponse.json({ error: "Razorpay could not prepare this checkout. Contact support if it continues." }, { status: 500 });
    }
    const { error: linkError } = await db
      .from("candidate_service_orders")
      .update({
        provider_order_id: razorpayOrder.id,
        next_action: "Complete Razorpay payment",
        next_action_at: null,
      })
      .eq("id", order.id);

    if (linkError) return NextResponse.json({ error: "Unable to attach secure checkout. No payment was started." }, { status: 503 });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      order_id: razorpayOrder.id,
      avenloOrderId: order.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: env("NEXT_PUBLIC_RAZORPAY_KEY_ID"),
      planName: plan.name,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to start payment. No payment has been confirmed." },
      { status: 500 },
    );
  }
}
