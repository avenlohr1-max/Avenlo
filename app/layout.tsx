import type { Metadata } from "next";
import "./globals.css";
import "./brand-polish.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://avenlo.in"),
  title: "Avenlo — Understand talent. Unlock human potential.",
  description: "A new approach to talent intelligence. Understand talent, explore possibility, and make more informed human decisions.",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/favicon.ico" },
  openGraph: {
    title: "Avenlo — Understand talent. Unlock human potential.",
    description: "Talent intelligence. Human decisions. A new chapter is in development for November 2026, subject to product readiness.",
    type: "website",
    url: "https://avenlo.in",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
