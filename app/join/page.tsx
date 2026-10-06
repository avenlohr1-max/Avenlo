"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "../components/site-header";

export default function Join() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = fullName.trim();
      if (!normalizedName) throw new Error("Please enter your full name.");
      if (!normalizedEmail) throw new Error("Please enter your email address.");

      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          data: { full_name: normalizedName, account_type: "candidate" },
        },
      });

      if (otpError) throw otpError;
      window.location.assign(`/join/verify?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start verification.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <SiteHeader />
      <section className="company-hero">
        <div className="container company-hero__grid">
          <div>
            <span className="eyebrow">FOR CANDIDATES</span>
            <h1>Build a professional profile that goes beyond the résumé.</h1>
            <p>Keep your information private, describe your strengths clearly and let Avenlo help surface relevant opportunities.</p>
            <div className="company-hero__points">
              <span>✓ Private professional profile</span>
              <span>✓ Structured skills &amp; experience</span>
              <span>✓ Human-led opportunities</span>
            </div>
          </div>

          <div className="inquiry-card">
            <span className="eyebrow">CREATE YOUR PROFILE</span>
            <h2>Join Avenlo.</h2>
            <p>Create your account with your email first. We&apos;ll verify it with a one-time code before asking for your password and professional details.</p>

            <form className="form" onSubmit={submit}>
              <label>
                Full name
                <input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label>
                Email
                <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>

              {error ? <p className="error" role="alert">{error}</p> : null}
              {message ? <p className="muted" role="status">{message}</p> : null}

              <button className="btn btn--primary" type="submit" disabled={loading}>
                {loading ? "Sending verification code…" : "Continue to email verification →"}
              </button>
              <p className="form-note">Already have an account? <Link href="/login">Sign in</Link></p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
