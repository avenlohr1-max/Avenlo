import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export default function AboutPage() {
  return <main><SiteHeader />
    <section className="section section--light"><div className="container company-principle">
      <span className="eyebrow">ABOUT AVENLO</span>
      <h1>Talent intelligence. Human decisions.</h1>
      <p>Avenlo is a talent intelligence platform designed to help people and companies make better-informed professional decisions.</p>
      <p>We bring together professional profile information, experience, skills, preferences, career direction and company requirements into clearer, structured signals. Technology helps organize the evidence; human judgment remains central to important talent decisions.</p>
      <div className="principles-grid">
        <article className="principle-card"><span>01</span><h3>Understand the person</h3><p>A richer professional profile goes beyond a résumé and captures context that matters to career decisions.</p></article>
        <article className="principle-card"><span>02</span><h3>Understand the requirement</h3><p>Company needs are considered through skills, experience, context and role requirements.</p></article>
        <article className="principle-card"><span>03</span><h3>Keep judgment human</h3><p>Avenlo surfaces useful signals and explainable context without treating technology as a replacement for people.</p></article>
      </div>
      <p style={{marginTop:"2rem"}}><Link className="btn btn--primary" href="/join">Build your Avenlo profile →</Link> <Link className="btn" href="/companies">Talk to Avenlo</Link></p>
    </div></section><SiteFooter /></main>;
}