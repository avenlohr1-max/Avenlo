import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkoutPolicyVersion, checkoutDocuments } from "@/lib/payments/checkout";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), query: vi.fn(), provider: vi.fn(), calls: [] as { table: string; operation: string; value: unknown }[] }));
function table(table: string) {
  let operation = "select";
  let value: unknown;
  const result = () => mocks.query(table,operation,value);
  const chain = {
    select: () => chain, eq: () => chain,
    insert: (input: unknown) => { operation="insert"; value=input; mocks.calls.push({ table,operation,value }); return chain; },
    update: (input: unknown) => { operation="update"; value=input; mocks.calls.push({ table,operation,value }); return chain; },
    maybeSingle: result, single: result,
    then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(result()).then(resolve,reject),
  };
  return chain;
}
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser }, from: table }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: table }) }));
vi.mock("razorpay", () => ({ default: class { orders = { create: mocks.provider }; } }));
import { POST } from "./route";
const billing = { name: "Synthetic Candidate", address: "123 Example Street", city: "Hyderabad", state: "Telangana", postalCode: "500008", country: "India" };
function request(patch: Record<string,unknown> = {}) {
  return new Request("https://avenlo.test/api/payments/razorpay/create-order", { method: "POST", body: JSON.stringify({ market: "india", plan: "intelligence", accepted: true, policyVersion: checkoutPolicyVersion, billing, ...patch }) });
}
const defaultQuery = (table: string, operation: string) => {
  if (table === "profiles") return { data: { role: "candidate", status: "active" } };
  if (table === "candidate_verifications") return { data: { status: "verified", market: "india" } };
  if (table === "candidate_plans") return { data: { id: "plan", name: "Intelligence", market: "india", code: "intelligence", price: 1999, currency: "INR", term_months: 6, auto_renew: false } };
  if (table === "candidate_service_orders" && operation === "select") return { data: null };
  if (table === "candidate_service_orders" && operation === "insert") return { data: { id: "internal-order" }, error: null };
  return { error: null };
};
beforeEach(() => {
  vi.resetAllMocks(); mocks.calls.length=0;
  for (const document of checkoutDocuments) vi.stubEnv(document.key, checkoutPolicyVersion);
  vi.stubEnv("AVENLO_PAYMENT_PROVIDER", "razorpay");
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture"); vi.stubEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "fixture-secret"); vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "fixture-webhook");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "candidate", email: "synthetic@example.invalid", email_confirmed_at: "2026-10-29T00:00:00Z" } } });
  mocks.query.mockImplementation(defaultQuery);
  mocks.provider.mockResolvedValue({ id: "provider-order", amount: 199900, currency: "INR" });
});
describe("pre-payment checkout controls", () => {
  it("requires affirmative current consent before touching the provider", async () => {
    expect((await POST(request({ accepted: false }))).status).toBe(400);
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("fails closed without owner-approved policies", async () => {
    vi.stubEnv("AVENLO_REFUND_POLICY_VERSION", "");
    expect((await POST(request())).status).toBe(503);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("requires a signed-in candidate", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("blocks a archived profile", async () => {
    mocks.query.mockImplementation((t,o) => t === "profiles" ? { data: { role: "candidate", status: "archived" } } : defaultQuery(t,o));
    expect((await POST(request())).status).toBe(403);
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("uses the server price and saves the billing snapshot and all consent before provider creation", async () => {
    mocks.provider.mockImplementation(async () => {
      expect(mocks.calls.find(c => c.table === "candidate_legal_acceptances")?.value).toHaveLength(4);
      return { id: "provider-order", amount: 199900, currency: "INR" };
    });
    expect((await POST(request({ amount: 1, price: 1 }))).status).toBe(200);
    expect(mocks.provider).toHaveBeenCalledWith(expect.objectContaining({ amount: 199900, currency: "INR" }));
    expect(mocks.calls.find(c => c.table === "candidate_service_orders" && c.operation === "insert")?.value).toEqual(expect.objectContaining({ price: 1999, checkout_snapshot: expect.objectContaining({ billing: { ...billing, email: "synthetic@example.invalid" }, accepted: true }) }));
  });
  it("never opens payment when consent cannot be saved", async () => {
    mocks.query.mockImplementation((t,o) => t === "candidate_legal_acceptances" ? { error: { message: "unavailable" } } : defaultQuery(t,o));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("does not return a provider order when database linking fails", async () => {
    mocks.query.mockImplementation((t,o) => t === "candidate_service_orders" && o === "update" ? { error: { message: "unavailable" } } : defaultQuery(t,o));
    expect((await POST(request())).status).toBe(503);
  });
  it("reuses an existing matching pending order without creating another payment", async () => {
    mocks.query.mockImplementation((t,o) => t === "candidate_service_orders" && o === "select" ? { data: { id: "existing", provider_order_id: "existing-provider", price: 1999, currency: "INR", checkout_snapshot: { policyVersion: checkoutPolicyVersion, billing: { email: "synthetic@example.invalid", ...billing } } } } : defaultQuery(t,o));
    const response=await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).orderId).toBe("existing-provider");
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("handles a concurrent checkout without creating a second provider order", async () => {
    mocks.query.mockImplementation((t,o) => t === "candidate_service_orders" && o === "insert" ? { error: { code: "23505" } } : defaultQuery(t,o));
    expect((await POST(request())).status).toBe(409);
    expect(mocks.provider).not.toHaveBeenCalled();
  });
});
