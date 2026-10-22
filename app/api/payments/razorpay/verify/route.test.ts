import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), order: vi.fn(), legal: vi.fn(), adminRpc: vi.fn(), userRpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.userRpc }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({
  from: (table: string) => table === "candidate_legal_acceptances" ? { insert: mocks.legal } : {
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.order }) }) }),
  }, rpc: mocks.adminRpc,
}) }));
import { POST } from "./route";

function request(signature?: string) {
  return new Request("https://avenlo.test/api/payments/razorpay/verify", { method: "POST", body: JSON.stringify({
    orderId: "internal-order", razorpay_order_id: "provider-order", razorpay_payment_id: "provider-payment",
    razorpay_signature: signature ?? crypto.createHmac("sha256", "test-secret").update("provider-order|provider-payment").digest("hex"),
  }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("RAZORPAY_KEY_SECRET", "test-secret");
  for (const key of ["AVENLO_CANDIDATE_TERMS_VERSION", "AVENLO_PRIVACY_VERSION", "AVENLO_PAID_SERVICE_TERMS_VERSION", "AVENLO_REFUND_POLICY_VERSION"]) vi.stubEnv(key, "reviewed-test-version");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "candidate" } } });
  mocks.order.mockResolvedValue({ data: { id: "internal-order", candidate_id: "candidate", provider_order_id: "provider-order" } });
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
