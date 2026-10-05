import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <BrandLogo />
          <p>Talent intelligence built to support better human decisions.</p>
        </div>
        <div className="footer-links">
          <div>
            <span>Explore</span>
            <Link href="/#why-avenlo">Why Avenlo</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/companies">For companies</Link>
            <Link href="/join">For candidates</Link>
          </div>
          <div>
            <span>Sign in</span>
            <Link href="/login">Candidate / company sign in</Link>
          </div>
          <div>
            <span>Contact</span>
            <a href="mailto:support@avenlo.in">support@avenlo.in</a>
            <a href="tel:+918074646755">+91 80746 46755</a>
          </div>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <span>© {new Date().getFullYear()} Avenlo. All rights reserved.</span>
        <span>Technology supports talent decisions. It does not replace human judgment.</span>
      </div>
    </footer>
  );
}
