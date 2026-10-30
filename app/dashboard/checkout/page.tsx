import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./checkout-client";
import styles from "./checkout.module.css";
import { checkoutOffer, checkoutPoliciesApproved, checkoutPolicyVersion } from "@/lib/payments/checkout";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const market = params.market === "international" ? "international" : "india";
  const planCode = params.plan ?? "intelligence";
  const legalConfigured = checkoutPoliciesApproved();
  const offer = checkoutOffer(market, planCode);
  const paymentConfigured =
    process.env.AVENLO_PAYMENT_PROVIDER?.toLowerCase() === "razorpay" &&
    Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) &&
    Boolean(process.env.RAZORPAY_KEY_ID) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET) &&
    Boolean(process.env.RAZORPAY_WEBHOOK_SECRET) &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === process.env.RAZORPAY_KEY_ID;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "candidate" || !["draft", "active"].includes(profile.status)) redirect("/dashboard");
  if (!user.email_confirmed_at) redirect("/verify-email");

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
          Pay for your six-month service through Razorpay. Avenlo confirms payment automatically;
          service activation follows the delivery review. It does not automatically renew.
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
            {offer ? <><h2>What you are purchasing</h2><ul>{offer.items.map(item => <li key={item}>{item}</li>)}</ul><p>Six months from service activation, no automatic renewal. Payment confirmation and service activation are separate. No hiring or salary outcome is guaranteed.</p></> : null}
            <h2>Before payment</h2>

            {!offer || market === "international" && process.env.AVENLO_INTERNATIONAL_PAYMENTS_ENABLED !== "true" ? <div className={styles.warning}><strong>Confirm your service with Avenlo</strong><span>This offer is not available for online payment yet. Contact support@avenlo.in.</span></div> : !marketReady ? (
              <div className={styles.warning}>
                <strong>Verification required</strong>
                <span>
                  Your verified market must match this plan before payment can begin.
                </span>
              </div>
            ) : !legalConfigured ? (
              <div className={styles.warning}>
                <strong>Online payment is not open yet</strong>
                <span>
                  Online payment is not open yet. Contact support@avenlo.in for availability.
                </span>
              </div>
            ) : !paymentConfigured ? (
              <div className={styles.warning}>
                <strong>Secure checkout is temporarily unavailable</strong>
                <span>
                  Please contact support@avenlo.in before making a payment.
                </span>
              </div>
            ) : (
              <CheckoutClient
                market={market}
                planCode={plan.code}
                keyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!}
                planName={plan.name}
                candidateEmail={user.email}
                policyVersion={checkoutPolicyVersion}
              />
            )}

            <p className={styles.small}>
              Avenlo records the accepted legal document versions with the service order.
              Please read the linked refund and cancellation terms before purchase.
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
            <p>Invoiced by Avenlo, Hyderabad. No GST is charged while Avenlo is unregistered. The amount shown is the amount payable. Refund eligibility is set out in the linked policy.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
