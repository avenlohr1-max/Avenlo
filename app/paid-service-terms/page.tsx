import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { checkoutOffer, invoiceIssuer } from "@/lib/payments/checkout";

export const metadata = { title: "Paid Service Terms — Avenlo" };
export default function PaidServiceTerms() {
  return <main><SiteHeader /><section className="section section--light"><div className="container company-principle">
    <span className="eyebrow">PAID SERVICE TERMS</span><h1>Know your service before paying.</h1><p className="muted">Last updated: 29 October 2026</p>
    <p>{invoiceIssuer.name}, {invoiceIssuer.address}, Telangana, India. Contact <a href="mailto:support@avenlo.in">support@avenlo.in</a>.</p>
    <h2>1. Service scope</h2><p>The selected plan, price and currency are shown before payment. Your purchase records the service scope and billing details you accepted.</p>
    {["intelligence","executive"].map(code => { const offer=checkoutOffer("india",code)!; return <section key={code}><h3>{offer.title}</h3><ul>{offer.items.map(item=><li key={item}>{item}</li>)}</ul></section>; })}
    <p>Specific delivery milestones and availability are agreed before activation. Priority matching is consideration for suitable opportunities, subject to employer requirements and human review. It does not guarantee an interview or placement.</p>
    <h2>2. Eligibility and activation</h2><p>Candidate verification and the correct market classification must be complete before payment. A captured payment confirms your purchase. Avenlo separately reviews activation and delivery readiness. Your six-month service period begins on activation. The service does not automatically renew.</p>
    <h2>3. Payment and invoice</h2><p>Razorpay handles checkout. Avenlo confirms captured payment with Razorpay and issues a private invoice, available in your billing history. Customers do not need to submit a UTR. If confirmation is delayed, check billing history or contact support before paying again.</p><p>Avenlo is not GST registered and does not charge GST. The checkout total is the amount payable. Future changes apply prospectively to the terms presented before a later purchase.</p>
    <h2>4. Candidate participation</h2><p>Provide accurate information and review the agreed scope. Share only materials you have permission to use. Avenlo does not guarantee employment, a job offer, interview, compensation level or other career outcome.</p>
    <h2>5. Cancellation and support</h2><p>Read the <Link href="/refunds">Refund and Cancellation Policy</Link> before purchase. Contact support@avenlo.in using your account email and Avenlo order or invoice reference. Do not send passwords, OTPs or payment PINs.</p>
    <h2>6. Your records</h2><p>We retain the accepted purchase terms, order and invoice snapshot for financial and transaction purposes. See the <Link href="/privacy">Privacy Policy</Link>. The collaboration retention periods are separate from the paid plan period.</p>
    <p>These terms accompany the <Link href="/terms">Candidate Terms</Link>, <Link href="/privacy">Privacy Notice</Link> and <Link href="/refunds">Refund and Cancellation Policy</Link> presented at checkout.</p>
  </div></section><SiteFooter /></main>;
}
