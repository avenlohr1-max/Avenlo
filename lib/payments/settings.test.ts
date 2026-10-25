import { afterEach, expect, it, vi } from "vitest";

const { rpc, admin } = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpc, admin: vi.fn(() => ({ rpc })) };
});
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: admin }));
import { resolvePaymentSettings } from "./settings";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("does not read Vault for a non-founder", async () => {
  vi.stubEnv("AVENLO_UPI_ENABLED", "true");
  vi.stubEnv("AVENLO_UPI_MODE", "test");
  expect((await resolvePaymentSettings(false)).enabled).toBe(false);
  expect(admin).not.toHaveBeenCalled();
});

it("does not read Vault for sandbox", async () => {
  vi.stubEnv("AVENLO_UPI_ENABLED", "true");
  vi.stubEnv("AVENLO_UPI_MODE", "sandbox");
  expect((await resolvePaymentSettings(true)).payeeUpi).toBeNull();
  expect(admin).not.toHaveBeenCalled();
});

it("uses the fixed Vault receiver only for founder test mode", async () => {
  vi.stubEnv("AVENLO_UPI_ENABLED", "true");
  vi.stubEnv("AVENLO_UPI_MODE", "test");
  rpc.mockResolvedValue({ data: { upi: "fixture@bank", name: "Test Fixture" }, error: null });
  expect((await resolvePaymentSettings(true)).payeeUpi).toBe("fixture@bank");
  expect(rpc).toHaveBeenCalledWith("avenlo_upi_test_receiver");
});

it("fails closed when Vault is unavailable", async () => {
  vi.stubEnv("AVENLO_UPI_ENABLED", "true");
  vi.stubEnv("AVENLO_UPI_MODE", "test");
  rpc.mockRejectedValue(new Error("unavailable"));
  expect((await resolvePaymentSettings(true)).enabled).toBe(false);
});
