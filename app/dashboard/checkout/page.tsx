import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./checkout.module.css";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ market?: string; plan?: string }> }) {
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
  const paymentConfigured = Boolean(process.env.AVENLO_PAYMENT_PROVIDER);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "candidate") redirect("/dashboard");

  const { data: plan } = await supabase.from("candidate_plans").select("id,name,price,currency,term_months,market").eq("market",market).eq("code",planCode).eq("active",true).maybeSingle();
  if (!plan) redirect("/pricing");

  return <main className={styles.page}>
    <div className={styles.shell}>
      <Link href="/pricing" className={styles.back}>← Back to plans</Link>
      <span className={styles.eyebrow}>SECURE CHECKOUT</span>
      <h1>Review your Avenlo service.</h1>
      <p className={styles.lead}>Your purchase activates a six-month paid service. It does not automatically renew at launch.</p>
      <section className={styles.layout}>
        <article className={styles.card}>
          <div className={styles.plan}><span>{plan.name}</span><strong>{plan.currency === "INR" ? "₹" : "$"}{Number(plan.price).toLocaleString()}</strong><small>6 months · {plan.market === "india" ? "India" : "International"}</small></div>
          <div className={styles.rule}/>
          <h2>Before payment</h2>
          <label className={styles.check}><input type="checkbox" disabled={!legalConfigured}/><span>I accept the current Candidate Terms, Privacy Notice, Paid Service Terms and Refund Policy shown by Avenlo.</span></label>
          <p className={styles.small}>The final checkout must display the approved versions, price, six-month term, refund window and no-auto-renewal position.</p>
          <button className={styles.button} disabled={!legalConfigured || !paymentConfigured}>Continue to secure payment</button>
          {!legalConfigured && <div className={styles.warning}><strong>Legal configuration required</strong><span>Effective versions for the four launch documents have not been configured yet. This is a launch P0 and must be supplied after counsel approval.</span></div>}
          {legalConfigured && !paymentConfigured && <div className={styles.warning}><strong>Payment configuration required</strong><span>The payment processor and invoicing mechanics are still a Finance P0 dependency. No processor has been assumed or hard-coded.</span></div>}
        </article>
        <aside className={styles.summary}><span className={styles.eyebrow}>ORDER SUMMARY</span><h2>{plan.name}</h2><dl><div><dt>Service</dt><dd>6 months</dd></div><div><dt>Auto-renewal</dt><dd>No</dd></div><div><dt>Price</dt><dd>{plan.currency === "INR" ? "₹" : "$"}{Number(plan.price).toLocaleString()}</dd></div><div><dt>Refund window</dt><dd>7 calendar days*</dd></div></dl><p>*Subject to applicable law and service-delivery conditions.</p></aside>
      </section>
    </div>
  </main>;
}
