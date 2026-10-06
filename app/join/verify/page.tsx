"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "../../components/site-header";

function VerifyCandidateEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!email) throw new Error("Your verification email is missing. Please start again.");
      const code = token.replace(/\D/g, "");
      if (code.length !== 6) throw new Error("Enter the 6-digit verification code from your email.");

      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        // Candidate signup confirmation codes are the `signup` OTP type.
        // Using `email` here is for other email-based auth flows and can reject
        // a valid signup confirmation token.
        type: "signup",
      });
      if (verifyError) throw verifyError;

      window.location.assign("/dashboard/profile?onboarding=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify your email.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      if (!email) throw new Error("Your verification email is missing. Please start again.");
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
      if (resendError) throw resendError;
      setMessage("A new verification code has been sent. Please check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend the verification code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main>
      <SiteHeader />
      <section className="company-hero">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="inquiry-card">
            <span className="eyebrow">STEP 2 OF 2</span>
            <h1>Verify your email.</h1>
            <p>
              We sent a 6-digit verification code to <strong>{email || "your email address"}</strong>. Enter it below to continue to your professional profile.
            </p>

            <form className="form" onSubmit={verify}>
              <label>
                Verification code
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  aria-describedby="verification-help"
                />
              </label>
              <p id="verification-help" className="form-note">The code expires according to your Avenlo authentication settings.</p>

              {error ? <p className="error" role="alert">{error}</p> : null}
              {message ? <p className="muted" role="status">{message}</p> : null}

              <button className="btn btn--primary" type="submit" disabled={loading}>
                {loading ? "Verifying…" : "Verify email & continue →"}
              </button>
            </form>

            <div className="actions" style={{ justifyContent: "space-between", marginTop: 20 }}>
              <button className="btn" type="button" onClick={resend} disabled={resending || !email}>
                {resending ? "Sending…" : "Resend code"}
              </button>
              <Link className="form-note" href="/join">Use a different email</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function VerifyCandidateEmail() {
  return (
    <Suspense fallback={<main><SiteHeader /><section className="company-hero"><div className="container"><p className="muted">Loading verification…</p></div></section></main>}>
      <VerifyCandidateEmailContent />
    </Suspense>
  );
}
