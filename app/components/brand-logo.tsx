import Link from "next/link";

type BrandLogoProps = { href?: string; compact?: boolean };

export function BrandLogo({ href = "/", compact = false }: BrandLogoProps) {
  const content = <span className={`brand-lockup${compact ? " brand-lockup--compact" : ""}`}>
    <svg aria-hidden="true" viewBox="0 0 72 72" className="brand-mark"><path d="M11 58 31 17c2.2-4.6 8.7-4.6 11 0l7.5 15.3-8.6 4.2-4.4-9-11.5 24.2H11Z" fill="currentColor"/><path d="m18 57 19.5-24.7c2-2.5 5.8-2.9 8.2-.8L61 44.3l-7.4 5.9-10.8-8.8L31 57H18Z" fill="var(--brand-green)"/></svg>
    <span className="brand-copy"><span className="brand-wordmark">AVENLO</span>{!compact?<span className="brand-tagline">Build Your Career. Find Your Opportunity.</span>:null}</span>
  </span>;
  return href ? <Link href={href} aria-label="Avenlo home">{content}</Link> : content;
}
