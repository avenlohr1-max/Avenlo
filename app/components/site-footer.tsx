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
            <Link href="/about">About Avenlo</Link>
            <Link href="/#why-avenlo">Why Avenlo</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div>
            <span>Get started</span>
            <Link href="/companies">For companies</Link>
            <Link href="/join">For candidates</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/amaan">Amaan Makhdoom Ghori</Link>
          </div>
          <div>
            <span>Company &amp; support</span>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
            <Link href="/refunds">Refund &amp; Cancellation</Link>
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