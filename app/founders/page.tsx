import type { Metadata } from "next";
import { FounderProfile } from "@/app/components/founder-profile";
export const metadata: Metadata = {
  title: "Amaan Makhdoom Ghori — CEO & Founder, Avenlo",
  description: "Meet Amaan Makhdoom Ghori, CEO & Founder of Avenlo. Talent intelligence. Human decisions.",
  alternates: { canonical: process.env.AVENLO_PORTALS_ENABLED === "true" ? "https://founders.avenlo.in" : "https://avenlo.in/amaan" },
};
export default function Founders() { return <FounderProfile />; }
