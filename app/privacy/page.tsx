import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export const metadata = { title: "Privacy Policy — Avenlo" };

export default function PrivacyPage() {
  return <main><SiteHeader /><section className="section section--light"><div className="container company-principle">
    <span className="eyebrow">PRIVACY POLICY</span><h1>How Avenlo handles personal information.</h1><p className="muted">Last updated: 8 October 2026</p>
    <h2>1. Scope</h2><p>This Privacy Policy explains how Avenlo handles information submitted through the Avenlo website, account experience, candidate profile, company enquiries and related services.</p>
    <h2>2. Information we may collect</h2><p>Depending on how you use Avenlo, this may include your name, email address, phone number, professional profile, résumé, skills, experience, education, career preferences, company and role information, account information, service selections, payment-related records and communications with Avenlo.</p>
    <h2>3. How we use information</h2><p>We use information to create and operate accounts, provide candidate and company services, understand professional and role requirements, communicate with users, process service requests and payments, maintain security, prevent misuse, improve the platform and meet applicable legal obligations.</p>
    <h2>4. Professional information</h2><p>Avenlo is designed around private professional information. We do not present the platform as a public résumé directory. Information is used within the relevant candidate, company and Avenlo workflows and is subject to access controls.</p>
    <h2>5. Service providers</h2><p>Avenlo may use trusted technology and service providers to operate authentication, hosting, storage, analytics, communications and payment processing. Providers receive information only as needed for the services they support and subject to applicable contractual and legal requirements.</p>
    <h2>6. Payments</h2><p>Where a paid service is purchased, payment processing is handled through the payment provider presented at checkout. Avenlo records relevant transaction and payment-event information needed to verify payments, activate services, support refunds or disputes and maintain an audit trail.</p>
    <h2>7. Security</h2><p>Avenlo uses access controls, authenticated workflows and technical safeguards intended to protect account and professional information. No internet service can guarantee absolute security.</p>
    <h2>8. Retention</h2><p>Information is retained for as long as reasonably necessary to provide the service, maintain account and transaction records, resolve disputes, enforce agreements and meet legal or regulatory obligations.</p>
    <h2>9. Your choices</h2><p>You may contact Avenlo to ask about your personal information, request correction of inaccurate information, or raise a privacy concern. Some information may need to be retained where required for legal, security or transaction purposes.</p>
    <h2>10. Contact</h2><p>Privacy questions can be sent to <a href="mailto:support@avenlo.in">support@avenlo.in</a>.</p>
  </div></section><SiteFooter /></main>;
}