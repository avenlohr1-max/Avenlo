import Link from "next/link";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";

const principles = [
  ["01", "Private by design", "Professional information is treated as private intelligence, not a public résumé directory."],
  ["02", "Structured intelligence", "Skills, experience, preferences and company requirements become clear, usable signals."],
  ["03", "Human-led matching", "Technology surfaces evidence. Avenlo people make the final talent decisions."],
];

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="hero hero--home">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">TALENT INTELLIGENCE • HUMAN JUDGMENT</span>
            <h1>Better talent decisions start with better intelligence.</h1>
            <p className="hero-lede">Avenlo connects structured candidate intelligence with real company requirements, then keeps the most important part human: the decision.</p>
            <div className="actions"><Link className="btn btn--primary" href="/companies">Talk to Avenlo</Link><Link className="btn" href="/join">Build your profile</Link></div>
            <div className="hero-note"><span className="hero-note__dot" /> Private network · Explainable matching · Human review</div>
          </div>
          <div className="hero-orbit" aria-label="Avenlo talent intelligence illustration">
            <div className="orbit orbit--one" /><div className="orbit orbit--two" />
            <div className="signal signal--top"><strong>Skills</strong><span>structured</span></div>
            <div className="signal signal--left"><strong>Experience</strong><span>contextual</span></div>
            <div className="signal signal--right"><strong>Requirements</strong><span>role-aware</span></div>
            <div className="signal-core"><span>A</span><small>AVENLO</small></div>
            <div className="hero-gradient" />
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Avenlo principles"><div className="container proof-strip__inner"><span>Technology supports talent decisions.</span><span>It does not replace human judgment.</span></div></section>

      <section className="section section--light" id="why-avenlo"><div className="container"><div className="section-heading"><div><span className="eyebrow">WHY AVENLO</span><h2>A talent platform designed around trust, not noise.</h2></div><p>Most hiring systems optimize for volume. Avenlo is designed for signal: understanding the person, understanding the requirement, and making the connection explainable.</p></div><div className="principles-grid">{principles.map(([num, title, text]) => <article className="principle-card" key={num}><span>{num}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section className="section" id="how-it-works"><div className="container workflow"><div className="section-heading section-heading--stack"><span className="eyebrow">HOW AVENLO WORKS</span><h2>From requirement to relevant conversation.</h2><p>The platform creates structure around the workflow while experienced people stay accountable for the outcome.</p></div><div className="workflow-list"><article><span>01</span><div><h3>Understand the requirement</h3><p>Company needs are captured beyond a job title: skills, experience, context, work mode and the signals that actually matter.</p></div></article><article><span>02</span><div><h3>Understand the candidate</h3><p>Candidate profiles turn professional experience, skills and preferences into structured intelligence while staying private.</p></div></article><article><span>03</span><div><h3>Surface explainable matches</h3><p>Matching highlights why a candidate may fit instead of hiding the reasoning behind an opaque score.</p></div></article><article><span>04</span><div><h3>Human review & relationship</h3><p>Avenlo people review the context, manage the relationship and keep judgment where it belongs.</p></div></article></div></div></section>

      <section className="audience-section"><div className="container audience-grid"><article className="audience-card audience-card--dark"><span className="eyebrow eyebrow--light">FOR COMPANIES</span><h2>Bring us the role. We'll bring the intelligence behind the search.</h2><p>Tell us what you actually need and start a conversation with the Avenlo team.</p><Link className="btn btn--light" href="/companies">Start a company conversation →</Link></article><article className="audience-card"><span className="eyebrow">FOR CANDIDATES</span><h2>Build a professional profile that understands more than a résumé.</h2><p>Keep your information private, make your strengths clearer and let relevant opportunities find you.</p><Link className="btn" href="/join">Build your Avenlo profile →</Link></article></div></section>

      <section className="section section--cta"><div className="container cta"><span className="eyebrow">THE AVENLO PRINCIPLE</span><h2>Better technology should make human talent decisions clearer.</h2><p>Avenlo is being built to give candidates, companies and our team better information—not to remove judgment from the process.</p><Link className="btn btn--primary" href="/companies">Talk to the team</Link></div></section>
      <SiteFooter />
    </main>
  );
}
