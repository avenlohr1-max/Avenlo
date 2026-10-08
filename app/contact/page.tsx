import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export default function ContactPage() {
  return <main><SiteHeader />
    <section className="company-hero"><div className="container company-hero__grid">
      <div><span className="eyebrow">CONTACT AVENLO</span><h1>Start a conversation with the team.</h1><p>Whether you are exploring Avenlo as a candidate, company or partner, reach out and tell us what you need.</p><div className="company-hero__points"><span>✓ Candidate support</span><span>✓ Company enquiries</span><span>✓ General support</span></div></div>
      <div className="inquiry-card"><span className="eyebrow">DIRECT CONTACT</span><h2>We’re here to help.</h2><p><strong>Email</strong><br/><a href="mailto:support@avenlo.in">support@avenlo.in</a></p><p><strong>Phone</strong><br/><a href="tel:+918074646755">+91 80746 46755</a></p><p><strong>Founder</strong><br/><a href="mailto:amaan@avenlo.in">amaan@avenlo.in</a></p><p className="form-note">For company hiring requirements, use the <a href="/companies">company enquiry form</a>.</p></div>
    </div></section><SiteFooter /></main>;
}