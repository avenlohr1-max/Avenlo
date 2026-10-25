import { z } from "zod";

export const paymentModes = ["sandbox", "test"] as const;
export type PaymentMode = typeof paymentModes[number];
export type PaymentRequest = {
  id: string; owner_id: string; reference: string; mode: PaymentMode;
  amount_paise: number; currency: "INR"; payee_upi: string | null; payee_name: string;
  status: "awaiting_payment" | "reported" | "confirmed" | "rejected" | "expired";
  payer_reference: string | null; bank_reference: string | null; review_note: string | null;
  refund_status: "none" | "requested"; refund_reason: string | null;
  created_at: string; expires_at: string; reviewed_at: string | null;
};
export const referenceSchema = z.string().trim().min(6).max(80).regex(/^[A-Za-z0-9-]+$/);
const upiSchema = z.string().trim().min(5).max(100).regex(/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/);

export function paymentSettings(env: Record<string, string | undefined> = process.env, receiver?: unknown) {
  const mode = z.enum(paymentModes).safeParse(env.AVENLO_UPI_MODE || "sandbox");
  if (env.AVENLO_UPI_ENABLED !== "true" || !mode.success) return { enabled: false as const, mode: "sandbox" as const, payeeUpi: null, payeeName: "Avenlo sandbox" };
  if (mode.data === "sandbox") return { enabled: true as const, mode: "sandbox" as const, payeeUpi: null, payeeName: "Avenlo sandbox" };
  const parsed = z.object({ upi: upiSchema, name: z.string().trim().min(2).max(120) }).safeParse(receiver);
  if (!parsed.success) return { enabled: false as const, mode: "test" as const, payeeUpi: null, payeeName: "Test receiver not configured" };
  return { enabled: true as const, mode: "test" as const, payeeUpi: parsed.data.upi, payeeName: parsed.data.name };
}

/** A QR/intent is a payment instruction, never proof of payment. */
export function paymentIntent(request: PaymentRequest, now = Date.now()): string | null {
  if (request.mode !== "test" || request.amount_paise !== 100 || request.currency !== "INR" ||
      request.status !== "awaiting_payment" || !Number.isFinite(Date.parse(request.expires_at)) || Date.parse(request.expires_at) <= now ||
      !request.payee_upi || !upiSchema.safeParse(request.payee_upi).success || !/^[A-Z0-9]{35}$/.test(request.reference)) return null;
  const fields = { pa: request.payee_upi, pn: request.payee_name, am: "1.00", cu: "INR", tr: request.reference, tn: "Avenlo gateway test only" };
  return "upi://pay?" + Object.entries(fields).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
}

export function paymentStatus(request: Pick<PaymentRequest, "mode" | "status">) {
  if (request.status === "confirmed") return request.mode === "sandbox" ? "Simulation confirmed — no money moved" : "₹1 test reconciled — no plan purchased";
  return { awaiting_payment: "Awaiting payment", reported: "Reported — bank reconciliation pending", rejected: "Not reconciled — contact support", expired: "Checkout expired — report any late payment" }[request.status];
}

export function paymentTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) + " IST";
}
