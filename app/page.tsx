import { MarketingShell } from "@/app/components/marketing-shell";
import Link from "next/link";
import { productCatalog } from "@/lib/product-catalog";

export const metadata = { title: "Avenlo \u2014 Signal & Match" };

export default function Page() {
  return <MarketingShell><main id="top">
    <section className="hero section-wrap">
      <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot"></span> TALENT INTELLIGENCE · HIRING PLATFORM</p>
        <h1>Good matches start with a <em>clearer signal.</em></h1>
        <p className="hero-lede">Avenlo serves candidates and employers through one talent intelligence and hiring platform.</p>
        <div className="hero-actions"><a className="button button-dark" href="/join">Start free <span aria-hidden="true">↗</span></a><a className="text-link" href="/companies">For employers <span aria-hidden="true">→</span></a></div>
        <p className="hero-note"><span className="hero-note-item">Candidate-facing services</span><span className="hero-note-separator" aria-hidden="true">·</span><span className="hero-note-item">Invitation-only employer onboarding</span></p>
      </div>
      <div className="hero-art" role="img" aria-label="Candidate and employer paths come together at Avenlo's signal and move forward">
        <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="path-label candidate-label"><span className="mini-node teal-node"></span> CANDIDATE</div><div className="path-label employer-label"><span className="mini-node navy-node"></span> EMPLOYER</div>
        <svg className="merge-paths" viewBox="0 0 580 430" fill="none" aria-hidden="true"><path d="M54 112C181 112 165 205 279 215M54 318C181 318 165 225 279 215" stroke="#102B5A" strokeWidth="5" strokeLinecap="round"/><path d="M301 215H506m-21-21 22 21-22 21" stroke="#07988F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="290" cy="215" r="22" fill="#B6E51F" stroke="#102B5A" strokeWidth="5"/><circle cx="54" cy="112" r="8" fill="#FBF9F2" stroke="#102B5A" strokeWidth="4"/><circle cx="54" cy="318" r="8" fill="#FBF9F2" stroke="#102B5A" strokeWidth="4"/></svg>
        <div className="signal-label"><span className="signal-icon"><img src="/brand/avenlo-mark.svg" alt="" width="25" height="25" /></span><span>THE MEETING POINT</span></div><span className="art-index">01 / 02</span>
      </div>
    </section>
    <section id="how-it-works" className="approach section-wrap"><div className="section-heading"><p className="eyebrow">THE AVENLO APPROACH</p><h2>Two sides of hiring.<br /><em>One clearer connection.</em></h2></div><p className="approach-copy">Avenlo brings the candidate-facing experience and invitation-only employer onboarding into a shared talent intelligence and hiring platform.</p><div className="approach-rule"><span></span><span>01 — 02</span></div></section>
    <section className="home-paths section-wrap" aria-label="Explore Avenlo"><a className="path-card path-card-candidate" href="/candidates"><span className="path-number">01 / CANDIDATES</span><h2>Your next move<br />deserves <em>your focus.</em></h2><p>Explore Avenlo’s candidate-facing services and find information for your next step.</p><span className="path-action">Explore candidate services <b aria-hidden="true">↗</b></span><span className="path-orbit" aria-hidden="true"></span></a><a className="path-card path-card-employer" href="/companies"><span className="path-number">02 / EMPLOYERS · BY INVITATION</span><h2>Bring better<br />focus to <em>hiring.</em></h2><p>Employer onboarding is invitation-only. Learn how Avenlo’s employer pathway works.</p><span className="path-action">Employer information <b aria-hidden="true">↗</b></span><span className="path-orbit" aria-hidden="true"></span></a></section>
    <section className="signal-products section-wrap"><p className="eyebrow">ONE CONNECTED PLATFORM</p><h2>Ten products.<br /><em>One professional journey.</em></h2><div className="signal-product-grid">{productCatalog.map(product => <Link key={product.number} href={`/products#product-${product.number}`}><span>{product.number} / {product.group}</span><h3>{product.name} ↗</h3><p>{product.description}</p></Link>)}</div><Link className="text-link" href="/pricing">Compare candidate plans →</Link></section><section className="home-about section-wrap"><div><p className="eyebrow">AVENLO / SIGNAL &amp; MATCH</p><h2>Find the signal.<br /><em>Make the connection.</em></h2></div><p>Avenlo’s identity brings together an open A, a signal point, and two distinct paths. It reflects the connection between candidates and employers at the heart of the platform.</p><a className="button button-outline" href="/about">Discover Avenlo <span aria-hidden="true">↗</span></a></section>
    <section className="home-contact"><div className="section-wrap home-contact-inner"><div><p className="eyebrow">YOUR NEXT STEP</p><h2>Start with the right path.</h2></div><a className="button button-lime" href="/contact">Contact Avenlo <span aria-hidden="true">↗</span></a></div></section>
  </main></MarketingShell>;
}
