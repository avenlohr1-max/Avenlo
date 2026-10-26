"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { collaborationContext } from "@/lib/collaboration-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { referenceSchema } from "@/lib/payments/upi";
import { resolvePaymentSettings } from "@/lib/payments/settings";
import { bankCreditTimeUtc } from "@/lib/payments/timing";

const idSchema = z.guid();
function finish(role: string, result: string): never {
  revalidatePath("/admin/payments"); revalidatePath("/dashboard/payments");
  redirect(`${role === "founder" ? "/admin" : "/dashboard"}/payments?result=${result}`);
}

export async function createPaymentRequest() {
  const { user, role } = await collaborationContext(["candidate", "founder"]);
  const settings = await resolvePaymentSettings(role === "founder");
  if (!settings.enabled || settings.mode === "test" && role !== "founder") finish(role, "disabled");
  const { error } = await createAdminClient().rpc("create_avenlo_upi_request", {
    p_owner_id: user.id, p_mode: settings.mode, p_payee_upi: settings.payeeUpi, p_payee_name: settings.payeeName,
  });
  finish(role, error ? "error" : "created");
}

export async function reportPayment(form: FormData) {
  const { supabase, role } = await collaborationContext(["candidate", "founder"]);
  const id = idSchema.safeParse(form.get("id"));
  const reference = referenceSchema.safeParse(form.get("reference"));
  if (!id.success || !reference.success) finish(role, "invalid");
  const { error } = await supabase.rpc("report_avenlo_upi_payment", { p_request_id: id.data, p_reference: reference.data });
  finish(role, error ? "error" : "reported");
}

export async function reviewPayment(form: FormData) {
  const { supabase, role } = await collaborationContext(["founder"]);
  const parsed = z.object({ id: idSchema, decision: z.enum(["confirmed", "rejected"]), note: z.string().trim().min(10).max(1000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) finish(role, "invalid");
  const paise = form.get("amountPaise") ? Number(form.get("amountPaise")) : null;
  const received = form.get("receivedAt");
  const receivedAt = bankCreditTimeUtc(received);
  const { error } = await supabase.rpc("review_avenlo_upi_payment", {
    p_request_id: parsed.data.id, p_decision: parsed.data.decision, p_note: parsed.data.note,
    p_bank_reference: form.get("bankReference") || null, p_amount_paise: paise,
    p_payee_upi: form.get("receiver") || null, p_received_at: receivedAt, p_bank_checked: form.get("bankChecked") === "yes",
  });
  finish(role, error ? "review_error" : "reviewed");
}

export async function requestPaymentRefund(form: FormData) {
  const { supabase, role } = await collaborationContext(["candidate", "founder"]);
  const parsed = z.object({ id: idSchema, reason: z.string().trim().min(10).max(1000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) finish(role, "invalid");
  const { error } = await supabase.rpc("request_avenlo_upi_refund", { p_request_id: parsed.data.id, p_reason: parsed.data.reason });
  finish(role, error ? "error" : "refund_requested");
}
