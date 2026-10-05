import type { Metadata } from "next";
import "./globals.css";
import "./brand-polish.css";

export const metadata: Metadata = {
  title: "Avenlo — Talent intelligence. Human decisions.",
  description: "A private talent-intelligence platform connecting structured candidate intelligence with real company requirements and human-led matching.",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/favicon.ico" },
  openGraph: {
    title: "Avenlo — Talent intelligence. Human decisions.",
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
