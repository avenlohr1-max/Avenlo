import crypto from "node:crypto";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function signature(orderId: string, paymentId: string) {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (process.env.AVENLO_PAYMENT_PROVIDER !== "razorpay" || !process.env.RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_KEY_ID) {
    return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });
  }
  try {
    const body = (await request.json()) as {
      orderId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!body.orderId || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return NextResponse.json({ error: "Incomplete payment confirmation." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const db = createAdminClient();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const { data: order } = await db
      .from("candidate_service_orders")
      .select("id,candidate_id,provider_order_id,status,payment_status,price,currency")
      .eq("id", body.orderId)
      .eq("candidate_id", user.id)
      .maybeSingle();

    if (!order || order.provider_order_id !== body.razorpay_order_id) {
      return NextResponse.json({ error: "Payment order could not be verified." }, { status: 409 });
    }

    const expected = signature(body.razorpay_order_id, body.razorpay_payment_id);
    if (!safeEqual(expected, body.razorpay_signature)) {
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    // A valid checkout signature authenticates the response, not capture of funds.
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const payment = await razorpay.payments.fetch(body.razorpay_payment_id);
    if (payment.id !== body.razorpay_payment_id || payment.order_id !== order.provider_order_id ||
        Number(payment.amount) !== Math.round(Number(order.price) * 100) || payment.currency !== order.currency) {
      return NextResponse.json({ error: "Payment does not match your Avenlo order." }, { status: 409 });
    }
    if (payment.status !== "captured" || payment.captured !== true) {
      return NextResponse.json({ pending: true, error: "Razorpay confirmation is pending. Do not pay again." }, { status: 202 });
    }

    const { data: activated, error: activationError } = await db.rpc(
      "settle_candidate_service_order",
      {
        p_order_id: order.id,
        p_provider: "razorpay",
        p_provider_payment_id: body.razorpay_payment_id,
      },
    );

    if (activationError || !activated) {
      return NextResponse.json({ error: "Payment was verified but service activation needs review." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: activated.status, invoiceUrl: `/dashboard/billing/${order.id}` });
  } catch {
    return NextResponse.json({ error: "Unable to verify payment." }, { status: 500 });
  }
}
