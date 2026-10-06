"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "../components/site-header";

const productionSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export default function Join() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      if (!fullName.trim()) throw new Error("Please enter your full name.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (!productionSiteUrl) throw new Error("Avenlo authentication is temporarily unavailable. Please try again later.");

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${productionSiteUrl}/auth/callback?redirect=/dashboard/profile`,
          data: { full_name: fullName.trim(), account_type: "candidate" },
        },
      });

      if (signUpError) throw signUpError;
      if (data.session) {
        window.location.assign("/dashboard/profile");
        return;
      }

      window.location.assign(`/join/verify?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
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
            <p>Create your account first. We&apos;ll verify your email with a one-time code before asking for your professional details.</p>

            <form className="form" onSubmit={submit}>
              <label>
                Full name
                <input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label>
                Email
                <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label>
                Password
                <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
