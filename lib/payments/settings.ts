import { createAdminClient } from "@/lib/supabase/admin";
import { paymentSettings } from "./upi";

/** Receiver configuration is decrypted from Vault only for founder rendering/actions. */
export async function resolvePaymentSettings(founder: boolean) {
  const fallback = paymentSettings();
  if (!founder || process.env.AVENLO_UPI_ENABLED !== "true" || process.env.AVENLO_UPI_MODE !== "test") return fallback;
  try {
    const { data, error } = await createAdminClient().rpc("avenlo_upi_test_receiver");
    return error ? fallback : paymentSettings(process.env, data);
  } catch {
    return fallback;
  }
}
