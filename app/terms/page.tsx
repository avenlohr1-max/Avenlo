import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export const metadata = { title: "Terms & Conditions — Avenlo" };

export default function TermsPage() {
  return <main><SiteHeader /><section className="section section--light"><div className="container company-principle">
    <span className="eyebrow">TERMS & CONDITIONS</span><h1>Terms for using Avenlo.</h1><p className="muted">Last updated: 8 October 2026</p>
    <h2>1. Using Avenlo</h2><p>By accessing Avenlo, you agree to use the website and services lawfully, provide information that is accurate to the best of your knowledge, and keep your account credentials secure.</p>
    <h2>2. Candidate services</h2><p>Avenlo provides professional profile, talent intelligence and career-oriented services. Service scope depends on the plan or service purchased and the terms presented before checkout.</p>
    <h2>3. No guaranteed outcome</h2><p>Avenlo does not guarantee employment, an interview, an offer, a specific compensation level, placement, promotion or any other particular career outcome. Talent decisions remain dependent on candidates, companies and other parties.</p>
    <h2>4. Company services</h2><p>Company users are responsible for the accuracy and lawfulness of role requirements and candidate-related information they submit. Avenlo supports structured, human-led talent workflows and does not represent that any match is suitable without human review.</p>
    <h2>5. Payments and service terms</h2><p>Prices, currency, service duration, applicable taxes or charges, payment method and other purchase terms are shown at the relevant checkout or purchase step. Paid candidate services are currently offered for defined service periods and do not automatically renew at launch unless the purchase terms expressly state otherwise.</p>
    <h2>6. Refunds and cancellations</h2><p>Refund and cancellation eligibility is governed by the Refund & Cancellation Policy and any service-specific terms presented before purchase. Where a purchase has additional terms, those terms form part of the transaction.</p>
    <h2>7. Intellectual property</h2><p>Avenlo and its licensors retain rights in the Avenlo website, software, branding, design and platform materials except for information that belongs to users or third parties.</p>
    <h2>8. Misuse</h2><p>Users must not attempt to access another person's account or private information, interfere with the platform, submit malicious content, misrepresent their identity, or use Avenlo for unlawful discrimination, fraud or other unlawful activity.</p>
    <h2>9. Availability</h2><p>We aim to keep Avenlo available and reliable, but the service may occasionally be unavailable because of maintenance, technical issues, third-party dependencies or events outside our reasonable control.</p>
    <h2>10. Changes</h2><p>Avenlo may update these terms as the platform and services evolve. The latest version published on this page applies to future use and purchases, subject to applicable law and any specific contractual terms.</p>
    <h2>11. Contact</h2><p>Questions about these terms can be sent to <a href="mailto:support@avenlo.in">support@avenlo.in</a>.</p>
  </div></section><SiteFooter /></main>;
}