"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccount({ enabled }: { enabled: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(null);
    try {
      const response = await fetch("/api/candidate/account", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.deleted) throw new Error(result.error || "Unable to complete account deletion.");
      setDeleted(true);
      // Server cookies are cleared as well; clear this browser's auth state.
      await createClient().auth.signOut({ scope: "local" }).catch(() => undefined);
      window.location.replace("/login?account=deleted");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to complete account deletion.");
    } finally { setPassword(""); setPending(false); }
  }

  if (deleted) return <p role="status">Your account has been deleted. Returning to sign in…</p>;
  return <section aria-labelledby="delete-account-title">
    <h2 id="delete-account-title">Delete your candidate account</h2>
    <p>This permanently removes your sign-in account, Talent Record, uploaded resumes, skills, education, applications, Signal Ledger, evidence links, career scenarios, opportunity suggestions, private notes, decision rooms, proof snapshots, dossiers and human service cases. It ends your account sessions. You cannot undo it.</p>
    <p>Accounts with service orders need support review first. Previously downloaded copies, support correspondence, security records and backup copies may remain subject to Avenlo’s retention policy. Read the <a href="/privacy">privacy policy</a> or contact <a href="mailto:candidates@avenlo.in">candidates@avenlo.in</a>.</p>
    {!enabled ? <p role="status">Self-service deletion is being prepared. Contact candidates@avenlo.in to request account deletion.</p> : <form className="form" onSubmit={submit}>
      <label>Current password<input type="password" autoComplete="current-password" required maxLength={512} value={password} disabled={pending} onChange={(event) => setPassword(event.target.value)} /></label>
      <label>Type DELETE to confirm<input autoComplete="off" required pattern="DELETE" value={confirmation} disabled={pending} onChange={(event) => setConfirmation(event.target.value)} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={pending || confirmation !== "DELETE" || !password}>{pending ? "Deleting your account…" : "Permanently delete my account"}</button>
    </form>}
  </section>;
}
