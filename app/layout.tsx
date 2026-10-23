import type { Metadata } from "next";
import "./globals.css";
import "./brand-polish.css";
import "./signal-brand.css";
import "./signal-site.css";

export const metadata: Metadata = {
  title: "Avenlo — Signal & Match",
  description: "A private talent-intelligence platform connecting structured candidate intelligence with real company requirements and human-led matching.",
  icons: { icon: "/brand/avenlo-mark.svg", shortcut: "/brand/avenlo-mark.svg" },
  openGraph: {
    title: "Avenlo — Signal & Match",
    description: "Better talent decisions start with better intelligence.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
