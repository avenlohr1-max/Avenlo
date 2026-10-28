import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), order: vi.fn(), legal: vi.fn(), adminRpc: vi.fn(), userRpc: vi.fn(), fetchPayment: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.userRpc }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({
  from: (table: string) => table === "candidate_legal_acceptances" ? { insert: mocks.legal } : {
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.order }) }) }),
  }, rpc: mocks.adminRpc,
}) }));
vi.mock("razorpay", () => ({ default: class { payments = { fetch: mocks.fetchPayment }; } }));
import { POST } from "./route";

function request(signature?: string) {
  return new Request("https://avenlo.test/api/payments/razorpay/verify", { method: "POST", body: JSON.stringify({
    orderId: "internal-order", razorpay_order_id: "provider-order", razorpay_payment_id: "provider-payment",
    razorpay_signature: signature ?? crypto.createHmac("sha256", "test-secret").update("provider-order|provider-payment").digest("hex"),
  }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AVENLO_PAYMENT_PROVIDER", "razorpay");
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "test-secret");
  mocks.fetchPayment.mockResolvedValue({ id: "provider-payment", order_id: "provider-order", amount: 19900, currency: "INR", status: "captured", captured: true });
  for (const key of ["AVENLO_CANDIDATE_TERMS_VERSION", "AVENLO_PRIVACY_VERSION", "AVENLO_PAID_SERVICE_TERMS_VERSION", "AVENLO_REFUND_POLICY_VERSION"]) vi.stubEnv(key, "reviewed-test-version");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "candidate" } } });
  mocks.order.mockResolvedValue({ data: { id: "internal-order", candidate_id: "candidate", provider_order_id: "provider-order", price: 199, currency: "INR" } });
  mocks.legal.mockResolvedValue({ error: null });
  mocks.adminRpc.mockResolvedValue({ data: { status: "payment_successful" }, error: null });
});
describe("verified server settlement", () => {
  it("fails closed when its signing secret is missing", async () => {
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");
    expect((await POST(request())).status).toBe(503);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("requires a signed-in owner", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
  });
  it("rejects an invalid provider signature", async () => {
    expect((await POST(request("invalid"))).status).toBe(400);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
  });
  it("keeps settlement blocked without configured legal versions", async () => {
    vi.stubEnv("AVENLO_PRIVACY_VERSION", "");
    expect((await POST(request())).status).toBe(503);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
  });
  it("uses only the trusted client after ownership, signature and legal checks", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.adminRpc).toHaveBeenCalledWith("settle_candidate_service_order", { p_order_id: "internal-order", p_provider: "razorpay", p_provider_payment_id: "provider-payment" });
    expect(mocks.userRpc).not.toHaveBeenCalled();
  });
  it("reports settlement failure rather than successful activation", async () => {
    mocks.adminRpc.mockResolvedValue({ data: null, error: { message: "retry" } });
    expect((await POST(request())).status).toBe(500);
  });
});


describe("authoritative Razorpay capture check", () => {
  it("does not enable a disabled provider", async () => {
    vi.stubEnv("AVENLO_PAYMENT_PROVIDER", "");
    expect((await POST(request())).status).toBe(503);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
  });
  it("keeps an authorised but uncaptured payment pending", async () => {
    mocks.fetchPayment.mockResolvedValue({ id: "provider-payment", order_id: "provider-order", amount: 19900, currency: "INR", status: "authorized", captured: false });
    expect((await POST(request())).status).toBe(202);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
    expect(mocks.legal).not.toHaveBeenCalled();
  });
  it.each([{ amount: 100 }, { currency: "USD" }, { order_id: "other" }, { id: "other-payment" }])("rejects mismatched fetched payment %o", async patch => {
    mocks.fetchPayment.mockResolvedValue({ id: "provider-payment", order_id: "provider-order", amount: 19900, currency: "INR", status: "captured", captured: true, ...patch });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
  });
  it("fails closed when provider status cannot be fetched", async () => {
    mocks.fetchPayment.mockRejectedValue(new Error("provider unavailable"));
    expect((await POST(request())).status).toBe(500);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
  });
});
