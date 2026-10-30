import Link from "next/link";

type BrandLogoProps = { href?: string | null; compact?: boolean; light?: boolean };

export function BrandLogo({ href = "/", compact = false, light = false }: BrandLogoProps) {
  const content = <span className={`brand-lockup${compact ? " brand-lockup--compact" : ""}`}><img className="brand-logo-image" src={`/brand/avenlo-logo-${light ? "reversed" : "horizontal"}.svg`} alt="Avenlo — Signal & Match" width={compact ? 156 : 195} height={compact ? 48 : 60} /></span>;
  return href ? <Link href={href} aria-label="Avenlo home">{content}</Link> : content;
}
