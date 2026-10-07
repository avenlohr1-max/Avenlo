import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./pricing.module.css";

export const dynamic = "force-dynamic";

const INDIA = [
  { code: "basic", name: "Basic", price: "Free", period: "Ongoing", description: "Stay visible to Avenlo and maintain your career profile.", features: ["Resume and profile workspace", "Core skills signal", "Career profile editing", "Relevant opportunities when available"] },
  { code: "intelligence", name: "Avenlo Intelligence", price: "₹1,999", period: "6 months", description: "Deeper career intelligence with human review and priority consideration.", features: ["Deeper talent assessment", "Skills and experience analysis", "Strengths and gaps", "Role and industry fit", "Career positioning and profile optimization", "Human review and priority consideration"], featured: true },
  { code: "executive", name: "Executive", price: "₹7,999", period: "6 months", description: "High-touch career positioning and dedicated human support.", features: ["Everything in Intelligence", "Personalized career positioning", "Dedicated human review", "Priority matching", "Interview preparation and feedback", "Company representation", "Post-interview support"] },
];

const INTERNATIONAL = [
  { code: "basic", name: "Basic", price: "Free", period: "Ongoing", description: "Stay visible to Avenlo and maintain your career profile.", features: ["Resume and profile workspace", "Core skills signal", "Career profile editing", "Relevant opportunities when available"] },
  { code: "intelligence", name: "Intelligence", price: "$100", period: "6 months", description: "Deeper talent intelligence, positioning and human review.", features: ["Deeper talent assessment", "Skills and experience analysis", "Strengths and gaps", "Role and industry fit", "Career positioning", "Human review and priority consideration"], featured: true },
  { code: "premium", name: "Premium", price: "$399", period: "6 months", description: "Enhanced international positioning and global career support.", features: ["Enhanced international positioning", "Global profile support", "Cross-market career strategy", "Interview support", "Related premium services"] },
  { code: "executive", name: "Executive", price: "$799", period: "6 months", description: "High-touch international career positioning and dedicated support.", features: ["Everything in Intelligence", "Personalized career positioning", "Dedicated human review", "Priority matching", "Interview preparation and feedback", "Company representation", "Post-interview support"] },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: verification }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("candidate_verifications").select("market,status").eq("candidate_id", user.id).maybeSingle(),
    supabase.from("candidate_service_orders").select("id,status,plan_id,price,currency,expires_at").eq("candidate_id", user.id).order("created_at",{ascending:false}).limit(3),
  ]);
  if (profile?.role !== "candidate") redirect("/dashboard");
  const market = verification?.market === "international" || verification?.market === "india" ? verification.market : null;
  const plans = market === "india" ? INDIA : market === "international" ? INTERNATIONAL : [];
  const active = orders?.find(o => ["active","delivery_in_progress","intelligence_complete","match_eligible"].includes(o.status));
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/dashboard" className={styles.back}>← Dashboard</Link><div><span className={styles.eyebrow}>AVENLO CANDIDATE SERVICES</span><h1>Choose the level of support you need.</h1></div><p>Paid services are six months, do not automatically renew at launch, and are designed to improve your career signal and Avenlo's ability to work on your behalf.</p></header>
    <section className={styles.notice}><strong>{market ? (market === "india" ? "India market" : "International market") : "Market classification pending"}</strong><span>{market ? "Pricing is based primarily on your current professional market and related verification information." : "Avenlo must classify your professional market before showing the applicable candidate price."}</span>{active ? <span className={styles.active}>Active service ends {active.expires_at ? new Date(active.expires_at).toLocaleDateString() : "after six months"}.</span> : null}</section>
    {!market ? <section className={styles.pending}><h2>We need to verify your market first.</h2><p>Market classification is based primarily on your current professional location, employment market and where you primarily work professionally. It is not determined by nationality, passport, phone code or email domain alone.</p><Link href="/dashboard/profile">Review my profile →</Link></section> : null}
    <section className={styles.grid}>{plans.map(plan => <article key={plan.code} className={plan.featured ? styles.featured : styles.card}>{plan.featured && <span className={styles.featuredTag}>MOST CHOSEN</span>}<span className={styles.planLabel}>{plan.name.toUpperCase()}</span><h2>{plan.price}</h2><span className={styles.period}>{plan.period}</span><p className={styles.desc}>{plan.description}</p><ul>{plan.features.map(f => <li key={f}>✓ {f}</li>)}</ul>{plan.code === "basic" ? <Link className={styles.secondary} href="/dashboard">Continue with Basic</Link> : <Link className={styles.primary} href={"/dashboard/checkout?market=" + market + "&plan=" + plan.code}>Choose {plan.name}</Link>}</article>)}</section>
    <section className={styles.legal}><h2>Before you purchase</h2><p>Checkout will show the applicable Candidate Paid Service Terms, refund policy, price, six-month term and no-auto-renewal position before payment. Avenlo does not guarantee an interview, offer or placement.</p><p className={styles.muted}>Pricing and payment mechanics are controlled by Avenlo's approved commercial configuration. Taxes, invoicing entity and payment processor are disclosed at purchase once Finance/Legal configuration is complete.</p></section>
  </main>;
}
