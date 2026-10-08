import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export const metadata = { title: "Refund & Cancellation Policy — Avenlo" };

export default function RefundsPage() {
  return <main><SiteHeader /><section className="section section--light"><div className="container company-principle">
    <span className="eyebrow">REFUND & CANCELLATION POLICY</span><h1>Clear terms for paid Avenlo services.</h1><p className="muted">Last updated: 8 October 2026</p>
    <h2>1. Before purchase</h2><p>Before a paid service is purchased, Avenlo presents the applicable plan, price, currency, service period, payment information and service-specific terms. Please review these details before completing payment.</p>
    <h2>2. Service period</h2><p>Paid candidate services are currently offered for defined service periods. At launch, these services do not automatically renew unless the applicable purchase terms expressly say otherwise.</p>
    <h2>3. Cancellation</h2><p>Cancellation requests should be sent to <a href="mailto:support@avenlo.in">support@avenlo.in</a> with the account email and relevant order or payment reference. Cancellation does not by itself guarantee a refund; eligibility depends on the applicable service terms and applicable law.</p>
    <h2>4. Refund requests</h2><p>Refund requests are reviewed against the service-specific terms accepted at purchase, the status of service delivery and applicable law. If a refund is approved, Avenlo will process it through the applicable payment method or payment provider workflow.</p>
    <h2>5. Failed, duplicate or reversed payments</h2><p>If a payment is duplicated, fails after a debit, is reversed by the payment provider, or otherwise requires reconciliation, Avenlo will review the payment record and take the appropriate settlement or refund action through the payment workflow.</p>
    <h2>6. Service outcomes</h2><p>Payment for a service does not guarantee employment, an interview, a job offer, placement or any particular professional outcome. Refund eligibility is not based on whether a candidate receives a particular career outcome unless a specific service term expressly provides otherwise.</p>
    <h2>7. Contact</h2><p>For cancellation or refund support, contact <a href="mailto:support@avenlo.in">support@avenlo.in</a> with sufficient transaction details to identify the purchase.</p>
  </div></section><SiteFooter /></main>;
}