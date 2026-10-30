import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ existing: vi.fn(), order: vi.fn(), insert: vi.fn(), update: vi.fn(), rpc: vi.fn(), fetchPayment: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({
  from: (table: string) => table === "payment_events" ? {
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.existing }) }) }),
    insert: (value: unknown) => ({ select: () => ({ single: () => mocks.insert(value) }) }),
    update: (value: unknown) => ({ eq: () => mocks.update(value) }),
  } : { select: () => ({ eq: () => ({ maybeSingle: mocks.order }) }) },
  rpc: mocks.rpc,
}) }));
vi.mock("razorpay", () => ({ default: class { payments = { fetch: mocks.fetchPayment }; } }));
import { POST } from "./route";
function request(amount = 19900, signature?: string) {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "payment", order_id: "order", status: "captured", amount, currency: "INR" } } } });
  return new Request("https://avenlo.test/api/payments/razorpay/webhook", { method: "POST", body, headers: {
    "x-razorpay-event-id": "event", "x-razorpay-signature": signature ?? crypto.createHmac("sha256", "webhook-secret").update(body).digest("hex"),
  } });
}
beforeEach(() => {
  vi.stubEnv("AVENLO_PAYMENT_PROVIDER", "razorpay");
  vi.resetAllMocks();
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "test-secret");
  mocks.fetchPayment.mockResolvedValue({ id: "payment", order_id: "order", status: "captured", captured: true, amount: 19900, currency: "INR" });
  vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook-secret");
  mocks.existing.mockResolvedValue({ data: null });
  mocks.order.mockResolvedValue({ data: { id: "internal-order", price: 199, currency: "INR" } });
  mocks.insert.mockResolvedValue({ data: { id: "event-row" }, error: null });
  mocks.update.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: { status: "payment_successful" }, error: null });
});
describe("trusted webhook settlement and retries", () => {
  it("does not process events while the provider is disabled", async () => {
    vi.stubEnv("AVENLO_PAYMENT_PROVIDER", "");
    expect((await POST(request())).status).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects an invalid signature before database access", async () => {
    expect((await POST(request(19900, "invalid"))).status).toBe(400);
    expect(mocks.existing).not.toHaveBeenCalled();
  });
  it("rejects a capture with a different amount", async () => {
    expect((await POST(request(100))).status).toBe(409);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("settles through the server-only RPC and marks processed only afterward", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("settle_candidate_service_order", { p_order_id: "internal-order", p_provider: "razorpay", p_provider_payment_id: "payment" });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "processed" }));
  });
  it("keeps failed settlement retryable", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "temporary failure" } });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("retries an already-recorded event that has not been processed", async () => {
    mocks.existing.mockResolvedValue({ data: { id: "event-row", status: "received" } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
  it("acknowledges completed duplicates without settling twice", async () => {
    mocks.existing.mockResolvedValue({ data: { id: "event-row", status: "processed" } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not acknowledge an event when its processing record cannot be saved", async () => {
    mocks.update.mockResolvedValue({ error: { message: "temporary failure" } });
    expect((await POST(request())).status).toBe(500);
  });
});


describe("webhook authoritative capture", () => {
  it.each([{ amount: 1 }, { currency: "USD" }, { order_id: "another" }, { captured: false }, { status: "authorized" }])("rejects inconsistent provider result %o", async patch => {
    mocks.fetchPayment.mockResolvedValue({ id: "payment", order_id: "order", status: "captured", captured: true, amount: 19900, currency: "INR", ...patch });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not acknowledge an outage as a successful capture", async () => {
    mocks.fetchPayment.mockRejectedValue(new Error("provider unavailable"));
    expect((await POST(request())).status).toBe(500);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("stores only the normalized payment identifiers and amount", async () => {
    await POST(request());
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ payload: {
      event: "payment.captured", payment: { id: "payment", order_id: "order", status: "captured", amount: 19900, currency: "INR" },
    } }));
  });
});
