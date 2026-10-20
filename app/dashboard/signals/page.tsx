"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./signals.module.css";

type SignalType = "skill" | "experience" | "education" | "achievement" | "preference" | "other";
type SourceType = "candidate" | "resume" | "work_sample" | "education" | "employment" | "other";
type Status = "needs_review" | "candidate_confirmed" | "disputed";
type Signal = {
  id: string; candidate_id: string; signal_type: SignalType; statement: string;
  source_type: SourceType; source_label: string; source_date: string | null; context: string;
  uncertainty_note: string; verification_status: Status; created_at: string; updated_at: string;
};
type Revision = { id: string; signal_id: string; before_data: Record<string, unknown>; after_data: Record<string, unknown>; changed_at: string };
type FormValue = Omit<Signal, "id" | "candidate_id" | "created_at" | "updated_at">;
const emptyForm: FormValue = { signal_type: "experience", statement: "", source_type: "candidate", source_label: "", source_date: "", context: "", uncertainty_note: "", verification_status: "needs_review" };
const signalTypes: { value: SignalType; label: string }[] = [
  { value: "skill", label: "Skill" }, { value: "experience", label: "Experience" }, { value: "education", label: "Education" },
  { value: "achievement", label: "Achievement" }, { value: "preference", label: "Preference" }, { value: "other", label: "Other" },
];
const sourceTypes: { value: SourceType; label: string }[] = [
  { value: "candidate", label: "Candidate statement" }, { value: "resume", label: "Resume" }, { value: "work_sample", label: "Work sample" },
  { value: "education", label: "Education record" }, { value: "employment", label: "Employment record" }, { value: "other", label: "Other source" },
];
const statusLabels: Record<Status, string> = { needs_review: "Needs review", candidate_confirmed: "Candidate confirmed", disputed: "Disputed" };

export default function SignalLedgerPage() {
  const supabase = useMemo(() => createClient(), []);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [form, setForm] = useState<FormValue>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { window.location.assign("/login"); return; }
    setCandidateId(user.id);
    const [{ data: signalRows, error: signalError }, { data: revisionRows, error: revisionError }] = await Promise.all([
      supabase.from("candidate_signals").select("id, candidate_id, signal_type, statement, source_type, source_label, source_date, context, uncertainty_note, verification_status, created_at, updated_at").eq("candidate_id", user.id).order("created_at", { ascending: false }),
      supabase.from("candidate_signal_revisions").select("id, signal_id, before_data, after_data, changed_at").eq("candidate_id", user.id).order("changed_at", { ascending: false }),
    ]);
    if (signalError || revisionError) {
      setError("Your Signal Ledger could not be loaded. Confirm the local database has the Phase 1 migration, then retry.");
      setLoading(false);
      return;
    }
    setSignals((signalRows ?? []) as Signal[]);
    setRevisions((revisionRows ?? []) as Revision[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  function startEdit(signal: Signal) {
    setEditing(signal.id); setMessage(null); setError(null);
    setForm({
      signal_type: signal.signal_type, statement: signal.statement, source_type: signal.source_type,
      source_label: signal.source_label, source_date: signal.source_date ?? "", context: signal.context,
      uncertainty_note: signal.uncertainty_note, verification_status: signal.verification_status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() { setEditing(null); setForm(emptyForm); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!candidateId) return;
    setSaving(true); setError(null); setMessage(null);
    const payload = {
      ...form, candidate_id: candidateId, source_date: form.source_date || null,
      statement: form.statement.trim(), source_label: form.source_label.trim(),
      context: form.context.trim(), uncertainty_note: form.uncertainty_note.trim(),
    };
    const result = editing
      ? await supabase.from("candidate_signals").update(payload).eq("id", editing).eq("candidate_id", candidateId)
      : await supabase.from("candidate_signals").insert(payload);
    if (result.error) { setError("The signal could not be saved. Please check the fields and try again."); setSaving(false); return; }
    const wasEditing = Boolean(editing);
    await load();
    resetForm();
    setMessage(wasEditing ? "Correction saved. The previous version is retained in its history." : "Signal added to your private ledger.");
    setSaving(false);
  }

  if (loading) return <main className={styles.page}><div className={styles.loading}>Loading your Signal Ledger…</div></main>;

  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Candidate navigation">
      <Link className={styles.brand} href="/dashboard">AVENLO</Link>
      <div className={styles.navLinks}><Link href="/dashboard">Overview</Link><Link href="/dashboard/profile">Talent Record</Link><Link href="/dashboard/skills">Capability Atlas</Link></div>
    </nav>
    <div className={styles.container}>
      <header className={styles.hero}>
        <div><span className={styles.eyebrow}>PRODUCT 2 · SIGNAL LEDGER</span><h1>Keep the source and the uncertainty attached.</h1><p>Record career signals with their origin, context, and what still needs checking. A signal is information, not proof of ability or a hiring score.</p></div>
        <div className={styles.privateNote}><span aria-hidden="true">◈</span><strong>Private to you</strong><p>Only your account can read these entries in this first version.</p></div>
      </header>
      <section className={styles.workspace}>
        <form className={styles.form} onSubmit={save}>
          <div className={styles.formHead}><div><span className={styles.eyebrow}>{editing ? "CORRECT A SIGNAL" : "ADD A SIGNAL"}</span><h2>{editing ? "Update the record" : "Capture a career signal"}</h2></div>{editing && <button className={styles.quietButton} type="button" onClick={resetForm}>Cancel edit</button>}</div>
          <label className={styles.full}>Signal statement<textarea required maxLength={2000} rows={3} value={form.statement} onChange={(event) => setForm({ ...form, statement: event.target.value })} placeholder="Describe the experience, skill, achievement, or preference." /></label>
          <div className={styles.fields}>
            <label>Signal type<select value={form.signal_type} onChange={(event) => setForm({ ...form, signal_type: event.target.value as SignalType })}>{signalTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label>Source type<select value={form.source_type} onChange={(event) => setForm({ ...form, source_type: event.target.value as SourceType })}>{sourceTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label>Source label<input required maxLength={200} value={form.source_label} onChange={(event) => setForm({ ...form, source_label: event.target.value })} placeholder="For example: 2024 project, resume, or reflection" /></label>
            <label>Source date<input type="date" value={form.source_date} onChange={(event) => setForm({ ...form, source_date: event.target.value })} /></label>
            <label className={styles.full}>Context<textarea required maxLength={3000} rows={3} value={form.context} onChange={(event) => setForm({ ...form, context: event.target.value })} placeholder="Where did this happen? What was the role, task, or situation?" /></label>
            <label className={styles.full}>Uncertainty or what needs checking<textarea required maxLength={1500} rows={2} value={form.uncertainty_note} onChange={(event) => setForm({ ...form, uncertainty_note: event.target.value })} placeholder="Name what is unknown, unverified, or disputed. If none, say so." /></label>
            <label>Review status<select value={form.verification_status} onChange={(event) => setForm({ ...form, verification_status: event.target.value as Status })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.success} role="status">{message}</p>}
          <button className={styles.submit} type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save correction" : "Add to my ledger"}</button>
        </form>
        <section className={styles.listSection}>
          <div className={styles.listHead}><div><span className={styles.eyebrow}>YOUR RECORDS</span><h2>{signals.length} {signals.length === 1 ? "signal" : "signals"}</h2></div><p>Each entry keeps its origin, context, and uncertainty visible.</p></div>
          {signals.length === 0 ? <div className={styles.empty}><strong>Your ledger is empty.</strong><p>Add a signal when you want to record a career detail and where it came from.</p></div> : <div className={styles.cards}>
            {signals.map((signal) => {
              const history = revisions.filter((revision) => revision.signal_id === signal.id);
              return <article className={styles.card} key={signal.id}>
                <div className={styles.cardTop}><div><span className={styles.type}>{signal.signal_type}</span><h3>{signal.statement}</h3></div><span className={styles.status}>{statusLabels[signal.verification_status]}</span></div>
                <div className={styles.metadata}><span>Source: <strong>{signal.source_label}</strong> ({signal.source_type.replace("_", " ")})</span>{signal.source_date && <span>Date: <strong>{new Date(signal.source_date + "T00:00:00").toLocaleDateString()}</strong></span>}</div>
                <div className={styles.detail}><strong>Context</strong><p>{signal.context}</p></div><div className={styles.uncertainty}><strong>Uncertainty</strong><p>{signal.uncertainty_note}</p></div>
                <div className={styles.cardActions}><button className={styles.quietButton} type="button" onClick={() => startEdit(signal)}>Correct or review</button>{history.length > 0 && <span>{history.length} {history.length === 1 ? "correction" : "corrections"} recorded</span>}</div>
                {history.length > 0 && <details className={styles.history}><summary>View correction history</summary><ol>{history.map((revision) => <li key={revision.id}><time dateTime={revision.changed_at}>{new Date(revision.changed_at).toLocaleString()}</time><p><strong>Before:</strong> {String(revision.before_data.statement ?? "")}</p><p><strong>After:</strong> {String(revision.after_data.statement ?? "")}</p></li>)}</ol></details>}
              </article>;
            })}
          </div>}
        </section>
      </section>
    </div>
  </main>;
}
