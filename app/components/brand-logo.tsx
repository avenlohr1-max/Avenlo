import Link from "next/link";

type BrandLogoProps = { href?: string; compact?: boolean; light?: boolean };

export function BrandLogo({ href = "/", compact = false, light = false }: BrandLogoProps) {
  const content = (
    <span className={`brand-lockup${compact ? " brand-lockup--compact" : ""}${light ? " brand-lockup--light" : ""}`}>
      <img
        src="/favicon.ico"
        alt="Avenlo"
        width={44}
        height={44}
        className="brand-mark brand-mark--image"
      />
      <span className="brand-copy">
        <span className="brand-wordmark">AVENLO</span>
        {!compact ? <span className="brand-tagline">Talent intelligence. Human decisions.</span> : null}
      </span>
    </span>
  );

  return href ? <Link href={href} aria-label="Avenlo home">{content}</Link> : content;
}
