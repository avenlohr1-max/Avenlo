"use client";

import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Props = {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
  planName: string;
  candidateEmail?: string | null;
  legalVersions: {
    candidate: string;
    privacy: string;
    paid: string;
    refund: string;
  };
};

export default function CheckoutClient({
  orderId,
  keyId,
  amount,
  currency,
  planName,
  candidateEmail,
  legalVersions,
}: Props) {
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    if (!accepted || busy) return;
    setBusy(true);
    setError("");

    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Unable to load secure payment checkout."));
      });

      if (!window.Razorpay) throw new Error("Secure payment checkout is unavailable.");

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "Avenlo",
        description: planName,
        order_id: orderId,
        prefill: candidateEmail ? { email: candidateEmail } : undefined,
        notes: { avenlo_order_id: orderId },
        theme: { color: "#111827" },
        handler: async (response: Record<string, string>) => {
          const verification = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              orderId,
              ...response,
              legalVersions,
            }),
          });
          const result = await verification.json();
          if (!verification.ok) throw new Error(result.error || "Payment verification failed.");
          window.location.assign("/dashboard?payment=success");
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
      setBusy(false);
    }
  }

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          disabled={busy}
        />{" "}
        I accept the current Candidate Terms, Privacy Notice, Paid Service Terms and Refund Policy shown by Avenlo.
      </label>
      <p>
        Avenlo records the accepted document versions with this purchase. Your six-month service does not
        automatically renew.
      </p>
      <button type="button" onClick={pay} disabled={!accepted || busy}>
        {busy ? "Opening secure payment…" : "Pay securely with Razorpay"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
