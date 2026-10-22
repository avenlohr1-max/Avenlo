import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amaan Makhdoom Ghori — CEO & Founder, Avenlo",
  description: "Amaan Makhdoom Ghori, CEO & Founder of Avenlo. Building a more intelligent, human approach to talent.",
  alternates: { canonical: process.env.AVENLO_PORTALS_ENABLED === "true" ? "https://founders.avenlo.in" : "https://avenlo.in/amaan" },
  openGraph: {
    title: "Amaan Makhdoom Ghori — CEO & Founder, Avenlo",
    description: "Building a more intelligent, human approach to talent.",
    type: "profile",
    url: process.env.AVENLO_PORTALS_ENABLED === "true" ? "https://founders.avenlo.in" : "https://avenlo.in/amaan",
  },
};

export default function AmaanLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
