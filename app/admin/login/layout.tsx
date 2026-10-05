import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avenlo Operations | Private Access",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
