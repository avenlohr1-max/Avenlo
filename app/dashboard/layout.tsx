import type { ReactNode } from "react";

// Account data must never enter build-time or shared page caches.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
