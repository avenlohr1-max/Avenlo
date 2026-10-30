"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function PrintInvoice() {
  return <button type="button" onClick={() => window.print()}>Print / save PDF</button>;
}

export function PendingInvoice() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stopped, setStopped] = useState(false);
  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(() => {
      if (++attempts >= 20) { clearInterval(timer); setStopped(true); return; }
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    }, 3000);
    return () => clearInterval(timer);
  }, [router]);
  return <><p role="status">{stopped ? "Confirmation is taking longer. You can refresh safely; contact support if the payment remains pending." : "Waiting for Razorpay confirmation. This page will show your invoice automatically."} Do not pay again.</p><button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Checking…" : "Refresh confirmation"}</button></>;
}
