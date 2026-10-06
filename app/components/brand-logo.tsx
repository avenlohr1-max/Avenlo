import Link from "next/link";

type BrandLogoProps = { href?: string; compact?: boolean; light?: boolean };

function AvenloMark({ light = false }: { light?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="brand-mark brand-mark--svg"
      role="presentation"
    >
      <defs>
        <linearGradient id="avenlo-blue" x1="7" y1="7" x2="35" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={light ? "#7dd3fc" : "#2563eb"} />
          <stop offset="1" stopColor={light ? "#38bdf8" : "#0ea5e9"} />
        </linearGradient>
        <linearGradient id="avenlo-green" x1="27" y1="12" x2="40" y2="39" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path d="M6 39 22.7 8.5c1.1-2 4-2 5.1 0L42 39h-8.1L25.2 19.8 15 39H6Z" fill="url(#avenlo-blue)" />
      <path d="m25.1 28.3 5.2-9.4L39.8 39H31l-5.9-10.7Z" fill="url(#avenlo-green)" />
      <path d="M18.3 31.5h10.5l3.1 5.6H15.2l3.1-5.6Z" fill={light ? "#fff" : "#0f172a"} opacity=".9" />
    </svg>
  );
}

export function BrandLogo({ href = "/", compact = false, light = false }: BrandLogoProps) {
  const content = (
    <span className={`brand-lockup${compact ? " brand-lockup--compact" : ""}${light ? " brand-lockup--light" : ""}`}>
      <AvenloMark light={light} />
      <span className="brand-copy">
        <span className="brand-wordmark">AVENLO</span>
        {!compact ? <span className="brand-tagline">Talent intelligence. Human decisions.</span> : null}
      </span>
    </span>
  );

  return href ? <Link href={href} aria-label="Avenlo home">{content}</Link> : content;
}
