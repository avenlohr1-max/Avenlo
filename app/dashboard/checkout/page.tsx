import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./checkout-client";
import styles from "./checkout.module.css";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const market = params.market === "international" ? "international" : "india";
  const planCode = params.plan ?? "intelligence";
  const versions = {
    candidate: process.env.AVENLO_CANDIDATE_TERMS_VERSION,
    privacy: process.env.AVENLO_PRIVACY_VERSION,
    paid: process.env.AVENLO_PAID_SERVICE_TERMS_VERSION,
    refund: process.env.AVENLO_REFUND_POLICY_VERSION,
  };
  const legalConfigured = Object.values(versions).every(Boolean);
  const paymentConfigured =
    process.env.AVENLO_PAYMENT_PROVIDER?.toLowerCase() === "razorpay" &&
    Boolean(process.env.RAZORPAY_KEY_ID) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET) &&
    Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "candidate") redirect("/dashboard");

  const { data: plan } = await supabase
    .from("candidate_plans")
    .select("id,name,price,currency,term_months,market,code")
    .eq("market", market)
    .eq("code", planCode)
    .eq("active", true)
    .maybeSingle();
  if (!plan || Number(plan.price) <= 0) redirect("/pricing");

  const { data: verification } = await supabase
    .from("candidate_verifications")
    .select("market,status")
    .eq("candidate_id", user.id)
    .maybeSingle();

  const marketReady =
    verification?.market === market &&
    (verification.status === "verified" || verification.status === "verified_with_conditions");

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/pricing" className={styles.back}>
          ← Back to plans
        </Link>
        <span className={styles.eyebrow}>SECURE CHECKOUT</span>
        <h1>Review your Avenlo service.</h1>
        <p className={styles.lead}>
          Your purchase activates a six-month paid service. It does not automatically renew at launch.
        </p>

        <section className={styles.layout}>
          <article className={styles.card}>
            <div className={styles.plan}>
              <span>{plan.name}</span>
              <strong>
                {plan.currency === "INR" ? "₹" : "$"}
                {Number(plan.price).toLocaleString()}
              </strong>
              <small>
                6 months · {plan.market === "india" ? "India" : "International"}
              </small>
            </div>
            <div className={styles.rule} />
            <h2>Before payment</h2>

            {!marketReady ? (
              <div className={styles.warning}>
                <strong>Verification required</strong>
                <span>
                  Your verified market must match this plan before payment can begin.
                </span>
              </div>
            ) : !legalConfigured ? (
              <div className={styles.warning}>
                <strong>Legal configuration required</strong>
                <span>
                  Effective versions for the four launch documents have not been configured yet.
                  This is a launch P0 and must be supplied after counsel approval.
                </span>
              </div>
            ) : !paymentConfigured ? (
              <div className={styles.warning}>
                <strong>Razorpay configuration required</strong>
                <span>
                  Razorpay credentials and webhook signing configuration must be present before
                  candidate payments can go live.
                </span>
              </div>
            ) : (
              <CheckoutClient
                market={market}
                planCode={plan.code}
                keyId={process.env.RAZORPAY_KEY_ID!}
                planName={plan.name}
                candidateEmail={user.email}
                legalVersions={{
                  candidate: versions.candidate!,
                  privacy: versions.privacy!,
                  paid: versions.paid!,
                  refund: versions.refund!,
                }}
              />
            )}

            <p className={styles.small}>
              Avenlo records the accepted legal document versions with the service order.
              Refund treatment follows the approved Refund Policy; no refund period is assumed here.
            </p>
          </article>

          <aside className={styles.summary}>
            <span className={styles.eyebrow}>ORDER SUMMARY</span>
            <h2>{plan.name}</h2>
            <dl>
              <div>
                <dt>Service</dt>
                <dd>6 months</dd>
              </div>
              <div>
                <dt>Auto-renewal</dt>
                <dd>No</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>
                  {plan.currency === "INR" ? "₹" : "$"}
                  {Number(plan.price).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>Razorpay</dd>
              </div>
            </dl>
            <p>Taxes, invoicing entity and approved refund treatment follow Finance/Legal configuration.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
