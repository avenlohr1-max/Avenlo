"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "../../components/site-header";

export default function CandidatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.assign("/login");
        return;
      }
      setLoading(false);
    }
    void checkSession();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      window.location.assign("/dashboard/profile?onboarding=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to set your password.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main><SiteHeader /><section className="company-hero"><div className="container"><p className="muted">Preparing your secure account…</p></div></section></main>;
  }

  return (
    <main>
      <SiteHeader />
      <section className="company-hero">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="inquiry-card">
            <span className="eyebrow">STEP 3 OF 3</span>
            <h1>Secure your account.</h1>
            <p>Your email is verified. Create a password now, then we&apos;ll take you to your professional profile.</p>

            <form className="form" onSubmit={submit}>
              <label>
                Password
                <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label>
                Confirm password
                <input required type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </label>

              {error ? <p className="error" role="alert">{error}</p> : null}

              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? "Securing account…" : "Continue to my profile →"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
