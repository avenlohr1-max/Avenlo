"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { checkoutSecondsRemaining } from "@/lib/payments/timing";
import s from "./payment-workspace.module.css";

export function PaymentFormButton({ children, name, value, disabled = false, secondary = false }: {
  children: ReactNode; name?: string; value?: string; disabled?: boolean; secondary?: boolean;
}) {
  const { pending } = useFormStatus();
  return <button type="submit" className={`${s.button} ${secondary ? s.secondary : ""}`} name={name} value={value} disabled={disabled || pending} aria-busy={pending}>{pending ? "Saving…" : children}</button>;
}

export function RefreshPaymentStatus() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className={`${s.button} ${s.secondary}`} disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Refreshing…" : "Refresh payment status"}</button>;
}

export function PaymentInstruction({ intent, qr, expiresAt, initialSeconds }: {
  intent: string; qr: string; expiresAt: string; initialSeconds: number;
}) {
  const [remaining, setRemaining] = useState(initialSeconds);
  useEffect(() => {
    const update = () => setRemaining(checkoutSecondsRemaining(expiresAt));
    const timer = setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [expiresAt]);
  if (remaining === 0) return <p role="status" className={s.notice}>Checkout expired. If you already paid, report that payment below. Do not pay again. A saved QR can still transfer money.</p>;
  return <>
    <p className={s.small}>Checkout closes in <strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</strong>.</p>
    <img className={s.qr} src={qr} width="260" height="260" alt="UPI QR for the private one-rupee Avenlo gateway test" />
    <a className={s.button} href={intent} onClick={event => { if (checkoutSecondsRemaining(expiresAt) === 0) { event.preventDefault(); setRemaining(0); } }}>Open UPI app to pay ₹1</a>
    <p className={s.small}>Already paid? Skip this QR and enter your transaction reference below. The site does not receive a bank confirmation from opening the UPI app. A saved QR may remain payable after checkout expires.</p>
  </>;
}
