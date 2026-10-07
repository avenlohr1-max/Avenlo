import crypto from "node:crypto";
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
  try {
    const body = (await request.json()) as {
      orderId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      legalVersions?: { candidate?: string; privacy?: string; paid?: string; refund?: string };
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
      .select("id,candidate_id,provider_order_id,status,payment_status")
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

    const versions = [
      ["candidate_terms", body.legalVersions?.candidate],
      ["privacy_notice", body.legalVersions?.privacy],
      ["paid_service_terms", body.legalVersions?.paid],
      ["refund_policy", body.legalVersions?.refund],
    ] as const;

    if (versions.some(([, version]) => !version)) {
      return NextResponse.json({ error: "Launch legal configuration is incomplete." }, { status: 503 });
    }

    for (const [documentType, version] of versions) {
      const { error } = await db.from("candidate_legal_acceptances").insert({
        candidate_id: user.id,
        document_type: documentType,
        version,
        source: "razorpay_checkout",
        metadata: { service_order_id: order.id, provider: "razorpay" },
      });
      if (error) return NextResponse.json({ error: "Unable to record legal acceptance." }, { status: 500 });
    }

    const { data: activated, error: activationError } = await db.rpc(
      "activate_candidate_service_order",
      {
        p_order_id: order.id,
        p_provider: "razorpay",
        p_provider_payment_id: body.razorpay_payment_id,
      },
    );

    if (activationError || !activated) {
      return NextResponse.json({ error: "Payment was verified but service activation needs review." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: activated.status });
  } catch {
    return NextResponse.json({ error: "Unable to verify payment." }, { status: 500 });
  }
}
