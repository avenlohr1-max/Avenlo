import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function validSignature(payload: string, provided: string | null) {
  if (!provided || !process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(payload).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const payload = await request.text();
  if (!validSignature(payload, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    const event = JSON.parse(payload) as {
      id?: string;
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; status?: string; amount?: number; currency?: string } };
        order?: { entity?: { id?: string } };
      };
    };

    const providerEventId = event.id || null;
    const supabase = await createClient();
    const paymentEntity = event.payload?.payment?.entity;
    const providerOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;

    const { data: existing } = providerEventId
      ? await supabase.from("payment_events").select("id").eq("provider", "razorpay").eq("provider_event_id", providerEventId).maybeSingle()
      : { data: null };

    if (existing) return NextResponse.json({ ok: true, duplicate: true });

    const { data: serviceOrder } = providerOrderId
      ? await supabase.from("candidate_service_orders").select("id").eq("provider_order_id", providerOrderId).maybeSingle()
      : { data: null };

    const { error: eventError } = await supabase.from("payment_events").insert({
      service_order_id: serviceOrder?.id ?? null,
      provider: "razorpay",
      provider_event_id: providerEventId,
      event_type: event.event || "unknown",
      status: "received",
      payload: event,
    });
    if (eventError) return NextResponse.json({ error: "Unable to record webhook event." }, { status: 500 });

    if (serviceOrder?.id && paymentEntity?.id && event.event === "payment.captured") {
      await supabase.rpc("activate_candidate_service_order", {
        p_order_id: serviceOrder.id,
        p_provider: "razorpay",
        p_provider_payment_id: paymentEntity.id,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
