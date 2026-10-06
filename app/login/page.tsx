"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "../components/brand-logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error("Email or password is incorrect.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unable to load your account.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // Founder/staff accounts must enter through the private operations login.
      // Do not allow the normal login form to become an alternate admin entry point.
      if (profile?.role === "founder" || profile?.role === "staff") {
        await supabase.auth.signOut();
        throw new Error("Founder and staff accounts must sign in through the private admin panel.");
      }

      if (profile?.role === "company") {
        window.location.assign("/company");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-shell__visual">
        <BrandLogo />
        <div>
          <span className="eyebrow eyebrow--light">CANDIDATE & COMPANY ACCESS</span>
          <h1>Come back to the talent network.</h1>
          <p>Access your Avenlo profile, opportunities, company workspace and matching workflow.</p>
        </div>
      </div>
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-panel__top"><Link href="/">← Back to Avenlo</Link><span>Secure sign in</span></div>
        <div className="auth-card">
          <span className="eyebrow">AVENLO ACCOUNT</span>
          <h2 id="login-title">Welcome back.</h2>
          <p>Sign in with the account you already use for Avenlo.</p>
          <form className="form" onSubmit={submit}>
            <label>Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
            <p className="muted"><Link href="/forgot-password">Forgot your password?</Link></p>
            {error ? <p className="error" role="alert">{error}</p> : null}
            <button className="btn btn--primary" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          </form>
          <p className="muted">New to Avenlo? <Link href="/join">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}
