import { bindings, defineConfig, defineWorker } from "cf/config";

// Only the disposable, loopback CI stack may opt into these test bindings.
// Real deployment secrets must be provisioned separately, never embedded here.
const localIntegration = process.env.AVENLO_LOCAL_INTEGRATION === "true";
const hostedTrial = process.env.AVENLO_HOSTED_TRIAL === "true";
if (localIntegration && !["localhost", "127.0.0.1"].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.example").hostname)) {
  throw new Error("Cloudflare integration requires disposable loopback Supabase");
}

export default defineConfig({
  worker: defineWorker({
    name: "avenlo-compatibility",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-30",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      AVENLO_PREVIEW_HOST: bindings.text("avenlo-compatibility.avenlohr1.workers.dev"),
      ...(hostedTrial ? {
        AVENLO_HOSTED_TRIAL: bindings.text("true"),
        AVENLO_HOSTED_TRIAL_USER_IDS: bindings.secret(),
        NEXT_PUBLIC_SUPABASE_URL: bindings.text(process.env.NEXT_PUBLIC_SUPABASE_URL!),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: bindings.text(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
        NEXT_PUBLIC_RAZORPAY_KEY_ID: bindings.text(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!),
        NEXT_PUBLIC_SITE_URL: bindings.text("https://avenlo-compatibility.avenlohr1.workers.dev"),
        SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
        RAZORPAY_KEY_ID: bindings.secret(),
        RAZORPAY_KEY_SECRET: bindings.secret(),
        RAZORPAY_WEBHOOK_SECRET: bindings.secret(),
        AVENLO_PAYMENT_PROVIDER: bindings.text("razorpay"),
        AVENLO_CANDIDATE_TERMS_VERSION: bindings.text("2026-10-29"),
        AVENLO_PAID_SERVICE_TERMS_VERSION: bindings.text("2026-10-29"),
        AVENLO_PRIVACY_VERSION: bindings.text("2026-10-29"),
        AVENLO_REFUND_POLICY_VERSION: bindings.text("2026-10-29"),
        ENABLE_CANDIDATE_ACCOUNT_ERASURE: bindings.text("true"),
        AVENLO_PORTALS_ENABLED: bindings.text("false"),
      } : {}),
      ...(localIntegration ? {
        NEXT_PUBLIC_SUPABASE_URL: bindings.text(process.env.NEXT_PUBLIC_SUPABASE_URL!),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: bindings.text(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
        NEXT_PUBLIC_SITE_URL: bindings.text("http://127.0.0.1:3000"),
        SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
        ENABLE_CANDIDATE_ACCOUNT_ERASURE: bindings.text("true"),
        AVENLO_UPI_ENABLED: bindings.text("true"),
        AVENLO_UPI_MODE: bindings.text("sandbox"),
      } : {}),
    },
  }),
});

