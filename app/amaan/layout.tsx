import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amaan Makhdoom Ghori — CEO & Founder, Avenlo",
  description: "Amaan Makhdoom Ghori, CEO & Founder of Avenlo. Building a more intelligent, human approach to talent.",
  alternates: { canonical: "https://www.avenlo.in/amaan" },
  openGraph: {
    title: "Amaan Makhdoom Ghori — CEO & Founder, Avenlo",
    description: "Building a more intelligent, human approach to talent.",
    type: "profile",
    url: "https://www.avenlo.in/amaan",
  },
};

export default function AmaanLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
