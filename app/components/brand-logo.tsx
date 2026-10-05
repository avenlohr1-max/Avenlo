import Image from "next/image";
import Link from "next/link";
import logoMark from "../../Avenlo-mark.png";

type BrandLogoProps = { href?: string; compact?: boolean; light?: boolean };

export function BrandLogo({ href = "/", compact = false, light = false }: BrandLogoProps) {
  const content = (
    <span className={`brand-lockup${compact ? " brand-lockup--compact" : ""}${light ? " brand-lockup--light" : ""}`}>
      <Image
        src={logoMark}
        alt="Avenlo"
        width={44}
        height={44}
        priority
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
