import Link from "next/link";
import styles from "./pricing.module.css";

export const metadata = { title: "Pricing — Avenlo" };

const INDIA = [
  { name: "Basic", price: "Free", period: "Ongoing", description: "Stay visible to Avenlo and maintain your career profile.", features: ["Resume and profile workspace", "Core skills signal", "Career profile editing", "Relevant opportunities when available"] },
  { name: "Avenlo Intelligence", price: "₹1,999", period: "6 months", description: "Deeper career intelligence with human review and priority consideration.", features: ["Deeper talent assessment", "Skills and experience analysis", "Strengths and gaps", "Role and industry fit", "Career positioning and profile optimization", "Human review and priority consideration"], featured: true },
  { name: "Executive", price: "₹7,999", period: "6 months", description: "High-touch career positioning and dedicated human support.", features: ["Everything in Intelligence", "Personalized career positioning", "Dedicated human review", "Priority matching", "Interview preparation and feedback", "Company representation", "Post-interview support"] },
];

const INTERNATIONAL = [
  { name: "Basic", price: "Free", period: "Ongoing", description: "Stay visible to Avenlo and maintain your career profile.", features: ["Resume and profile workspace", "Core skills signal", "Career profile editing", "Relevant opportunities when available"] },
  { name: "Intelligence", price: "$100", period: "6 months", description: "Deeper talent intelligence, positioning and human review.", features: ["Deeper talent assessment", "Skills and experience analysis", "Strengths and gaps", "Role and industry fit", "Career positioning", "Human review and priority consideration"], featured: true },
  { name: "Premium", price: "$399", period: "6 months", description: "Enhanced international positioning and global career support.", features: ["Enhanced international positioning", "Global profile support", "Cross-market career strategy", "Interview support", "Related premium services"] },
  { name: "Executive", price: "$799", period: "6 months", description: "High-touch international career positioning and dedicated support.", features: ["Everything in Intelligence", "Personalized career positioning", "Dedicated human review", "Priority matching", "Interview preparation and feedback", "Company representation", "Post-interview support"] },
];

function Plan({ plan }: { plan: (typeof INDIA)[number] }) {
  return <article className={plan.featured ? styles.featured : styles.card}>
    {plan.featured && <span className={styles.featuredTag}>MOST CHOSEN</span>}
    <span className={styles.planLabel}>{plan.name.toUpperCase()}</span>
    <h2>{plan.price}</h2><span className={styles.period}>{plan.period}</span>
    <p className={styles.desc}>{plan.description}</p>
    <ul>{plan.features.map(f => <li key={f}>✓ {f}</li>)}</ul>
    <Link className={plan.name === "Basic" ? styles.secondary : styles.primary} href="/join">{plan.name === "Basic" ? "Create a profile" : "Get started"}</Link>
  </article>;
}

export default function PricingPage() {
  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.back}>← Avenlo</Link>
      <div><span className={styles.eyebrow}>AVENLO CANDIDATE SERVICES</span><h1>Choose the level of support you need.</h1></div>
      <p>Paid services are defined service periods designed to improve your career signal and Avenlo's ability to work on your behalf. At launch, paid services do not automatically renew.</p>
    </header>
    <section className={styles.notice}><strong>India</strong><span>Candidate pricing for the India professional market.</span></section>
    <section className={styles.grid}>{INDIA.map(plan => <Plan key={plan.name} plan={plan} />)}</section>
    <section className={styles.notice}><strong>International</strong><span>Candidate pricing for international professional markets. Applicable market classification is confirmed within the candidate experience.</span></section>
    <section className={styles.grid}>{INTERNATIONAL.map(plan => <Plan key={plan.name} plan={plan} />)}</section>
    <section className={styles.legal}><h2>Before you purchase</h2><p>The final checkout step shows the applicable service terms, refund and cancellation policy, price, currency and service period before payment. Avenlo does not guarantee an interview, offer, placement or other specific career outcome.</p><p className={styles.muted}>Questions about services or pricing: <a href="mailto:support@avenlo.in">support@avenlo.in</a>.</p></section>
  </main>;
}