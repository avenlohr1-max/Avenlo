import { expect, test } from "vitest";
import { paymentIntent, paymentSettings, paymentStatus, referenceSchema, type PaymentRequest } from "./upi";

const request = { mode: "test", amount_paise: 100, currency: "INR", status: "awaiting_payment", payee_upi: "test@example", payee_name: "Synthetic Receiver", reference: "AVT" + "A".repeat(32), expires_at: "2026-12-01T00:00:00Z" } as PaymentRequest;
test("payments default off and never accept an unsupported live mode", () => {
  expect(paymentSettings({}).enabled).toBe(false);
  expect(paymentSettings({ AVENLO_UPI_ENABLED: "true", AVENLO_UPI_MODE: "live" }).enabled).toBe(false);
});
test("sandbox contains no real payee or transferable intent", () => {
  expect(paymentSettings({ AVENLO_UPI_ENABLED: "true" }).payeeUpi).toBeNull();
  expect(paymentIntent({ ...request, mode: "sandbox" }, 0)).toBeNull();
});
test("personal test mode requires both receiver fields", () => {
  expect(paymentSettings({ AVENLO_UPI_ENABLED: "true", AVENLO_UPI_MODE: "test" }).enabled).toBe(false);
  expect(paymentSettings({ AVENLO_UPI_ENABLED: "true", AVENLO_UPI_MODE: "test" }, { upi: "synthetic@example", name: "Synthetic receiver" }).enabled).toBe(true);
});
test("test intent fixes the amount, currency and encoded receiver", () => {
  const uri = new URL(paymentIntent(request, 0)!);
  expect(uri.searchParams.get("am")).toBe("1.00");
  expect(uri.searchParams.get("cu")).toBe("INR");
  expect(uri.searchParams.get("pa")).toBe("test@example");
  expect(uri.searchParams.get("pn")).toBe("Synthetic Receiver");
});
test.each([{ amount_paise: 199900 }, { currency: "USD" }, { status: "confirmed" }, { status: "reported" }, { payee_upi: "fake@example&am=1000" }, { expires_at: "invalid" }])("reject unsafe or non-payable instructions %o", patch => {
  expect(paymentIntent({ ...request, ...patch } as PaymentRequest, 0)).toBeNull();
});
test("expired intents stop being generated", () => expect(paymentIntent(request, Date.parse(request.expires_at))).toBeNull());
test("reports and confirmations never claim plan activation", () => {
  expect(paymentStatus({ mode: "test", status: "reported" })).toContain("pending");
  expect(paymentStatus({ mode: "test", status: "confirmed" })).toContain("no plan purchased");
  expect(referenceSchema.safeParse("<script>alert()</script>").success).toBe(false);
});
