"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/app/components/brand-logo";

export default function AdminLogin() {
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

      if (profile?.role !== "founder" && profile?.role !== "staff") {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for founder/admin access.");
      }

      // Establish a short-lived browser session marker so /staff cannot be entered
      // simply by having a founder/staff Supabase session from the normal login page.
      const sessionResponse = await fetch("/api/admin/session", { method: "POST" });
      if (!sessionResponse.ok) {
        await supabase.auth.signOut();
        throw new Error("Unable to establish the private operations session.");
      }

      window.location.assign("/staff");
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
          <span className="eyebrow eyebrow--light">FOUNDER & ADMIN</span>
          <h1>Operate the talent intelligence layer with confidence.</h1>
          <p>Secure access for the people responsible for Avenlo&apos;s matching, company relationships and platform operations.</p>
        </div>
      </div>
      <section className="auth-panel" aria-labelledby="admin-login-title">
        <div className="auth-panel__top"><Link href="/">← Back to Avenlo</Link><span>Private access</span></div>
        <div className="auth-card">
          <span className="eyebrow">AVENLO OPERATIONS</span>
          <h2 id="admin-login-title">Founder / admin sign in</h2>
          <p>Use your authorized Avenlo account. Admin access is controlled by server-side roles and policies.</p>
          <form className="form" onSubmit={submit}>
            <label>Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
            {error ? <p className="error" role="alert">{error}</p> : null}
            <button className="btn btn--primary" type="submit" disabled={loading}>{loading ? "Signing in…" : "Enter operations"}</button>
          </form>
          <Link className="auth-help" href="/forgot-password">Forgot your password?</Link>
        </div>
      </section>
    </main>
  );
}
