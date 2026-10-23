import Link from "next/link";
import type { ReactNode } from "react";

const links = [["Candidates", "/candidates"], ["Products", "/products"], ["Employers", "/companies"], ["About", "/about"]] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
  return <div className="signal-site">
    <a className="signal-skip" href="#top">Skip to content</a>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Avenlo home"><img src="/brand/avenlo-logo-horizontal.svg" alt="Avenlo — Signal & Match" width="222" height="68" /></Link>
      <nav className="site-nav" aria-label="Main navigation">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}<Link href="/login">Sign in</Link><Link className="nav-cta" href="/join">Start free ↗</Link></nav>
      <details className="signal-mobile-nav"><summary>Menu <span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}<Link href="/pricing">Candidate plans</Link><Link href="/contact">Contact</Link><Link href="/login">Sign in</Link><Link className="nav-cta" href="/join">Start free ↗</Link></nav></details>
    </header>
    {children}
    <footer className="site-footer"><Link className="brand footer-brand" href="/" aria-label="Avenlo home"><img src="/brand/avenlo-logo-horizontal.svg" alt="Avenlo — Signal & Match" width="195" height="60" /></Link><p>Talent intelligence &amp; hiring platform</p><nav aria-label="Footer navigation"><Link href="/pricing">Candidate plans</Link><Link href="/contact">Contact</Link><Link href="/founders">Founder</Link><Link href="/team">Team</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Refunds</Link></nav><small>© {new Date().getFullYear()} Avenlo · Candidate sharing by choice · Employer access by invitation</small></footer>
  </div>;
}
