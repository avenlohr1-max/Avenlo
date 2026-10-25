"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./scenarios.module.css";

type Scenario = { id: string; candidate_id: string; target_role: string; assumptions: string[]; open_questions: string[]; next_steps: string[]; created_at: string; updated_at: string };
type Signal = { id: string; statement: string; source_label: string; source_type: string; source_date: string | null; context: string; uncertainty_note: string };
type ScenarioEvidence = { scenario_id: string; signal_id: string };
type Draft = { target_role: string; assumptions: string; open_questions: string; next_steps: string };
type DraftField = keyof Draft;
const splitLines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
const makeDraft = (scenario: Scenario): Draft => ({
  target_role: scenario.target_role,
  assumptions: scenario.assumptions.join("\n"),
  open_questions: scenario.open_questions.join("\n"),
  next_steps: scenario.next_steps.join("\n"),
});
function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
}
function readTargetRoles(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  return readStringList((value as Record<string, unknown>).target_roles);
}

export default function CareerScenariosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [evidence, setEvidence] = useState<ScenarioEvidence[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [selectedSignals, setSelectedSignals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { window.location.assign("/login"); return; }
    setCandidateId(user.id);
    const [
      { data: profile },
      { data: candidate, error: candidateError },
      { data: skillRows, error: skillsError },
      { data: signalRows, error: signalsError },
      { data: scenarioRows, error: scenariosError },
      { data: evidenceRows, error: evidenceError },
    ] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("candidate_profiles").select("preferences").eq("user_id", user.id).maybeSingle(),
      supabase.from("candidate_skills").select("skill").eq("user_id", user.id).order("skill"),
      supabase.from("candidate_signals").select("id, statement, source_label, source_type, source_date, context, uncertainty_note").eq("candidate_id", user.id).eq("verification_status", "candidate_confirmed").order("created_at", { ascending: false }),
      supabase.from("candidate_scenarios").select("id, candidate_id, target_role, assumptions, open_questions, next_steps, created_at, updated_at").eq("candidate_id", user.id).order("created_at"),
      supabase.from("candidate_scenario_evidence").select("scenario_id, signal_id").eq("candidate_id", user.id),
    ]);
    if (profile?.role === "company") { window.location.assign("/company"); return; }
    if (profile?.role === "staff" || profile?.role === "founder") { window.location.assign("/staff"); return; }
    if (candidateError || skillsError || signalsError || scenariosError || evidenceError) {
      setError("The Scenario Lab could not load. Check that the local database has the Phase 2 migration, then retry.");
      setLoading(false);
      return;
    }
    const scenarioList = (scenarioRows ?? []) as Scenario[];
    setScenarios(scenarioList);
    setDrafts(Object.fromEntries(scenarioList.map((scenario) => [scenario.id, makeDraft(scenario)])));
    setEvidence((evidenceRows ?? []) as ScenarioEvidence[]);
    setSignals((signalRows ?? []) as Signal[]);
    setSkills((skillRows ?? []).map((row) => row.skill));
    setTargetRoles(readTargetRoles(candidate?.preferences));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  function patchDraft(id: string, field: DraftField, value: string) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  async function createScenario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!candidateId || !newRole.trim()) return;
    if (scenarios.length >= 3) { setError("Compare up to three role scenarios at a time."); return; }
    setBusy(true); setError(null); setMessage(null);
    const { error: insertError } = await supabase.from("candidate_scenarios").insert({
      candidate_id: candidateId,
      target_role: newRole.trim(),
      assumptions: [],
      open_questions: [],
      next_steps: [],
    });
    if (insertError) setError("Unable to add this scenario. Please retry.");
    else { setNewRole(""); await load(); setMessage("Scenario added. Add assumptions, questions, evidence, and next steps."); }
    setBusy(false);
  }

  async function saveScenario(scenario: Scenario) {
    if (!candidateId) return;
    const draft = drafts[scenario.id];
    if (!draft?.target_role.trim()) { setError("Each scenario needs a role name."); return; }
    setBusy(true); setError(null); setMessage(null);
    const { error: saveError } = await supabase.from("candidate_scenarios").update({
      target_role: draft.target_role.trim(),
      assumptions: splitLines(draft.assumptions),
      open_questions: splitLines(draft.open_questions),
      next_steps: splitLines(draft.next_steps),
    }).eq("id", scenario.id).eq("candidate_id", candidateId);
    if (saveError) setError("Unable to save this scenario. Please retry.");
    else { await load(); setMessage("Scenario saved."); }
    setBusy(false);
  }

  async function deleteScenario(scenario: Scenario) {
    if (!candidateId || !window.confirm(`Delete the ${scenario.target_role} scenario and its evidence links?`)) return;
    setBusy(true); setError(null); setMessage(null);
    const { error: deleteError } = await supabase.from("candidate_scenarios").delete().eq("id", scenario.id).eq("candidate_id", candidateId);
    if (deleteError) setError("Unable to delete this scenario. Please retry.");
    else { await load(); setMessage("Scenario and its evidence links deleted."); }
    setBusy(false);
  }

  async function linkSignal(scenario: Scenario) {
    if (!candidateId) return;
    const signalId = selectedSignals[scenario.id];
    if (!signalId) return;
    setBusy(true); setError(null); setMessage(null);
    const { error: linkError } = await supabase.from("candidate_scenario_evidence").insert({
      candidate_id: candidateId, scenario_id: scenario.id, signal_id: signalId,
    });
    if (linkError) setError(linkError.code === "23505" ? "That signal is already linked." : "Unable to link this signal.");
    else { setSelectedSignals((current) => ({ ...current, [scenario.id]: "" })); await load(); setMessage("Candidate-confirmed signal linked."); }
    setBusy(false);
  }

  async function unlinkSignal(scenario: Scenario, signal: Signal) {
    if (!candidateId) return;
    setBusy(true); setError(null); setMessage(null);
    const { error: unlinkError } = await supabase.from("candidate_scenario_evidence").delete()
      .eq("candidate_id", candidateId).eq("scenario_id", scenario.id).eq("signal_id", signal.id);
    if (unlinkError) setError("Unable to remove this evidence link.");
    else { await load(); setMessage("Evidence link removed."); }
    setBusy(false);
  }

  function addSuggestedRole(role: string) {
    if (scenarios.some((scenario) => scenario.target_role.toLocaleLowerCase() === role.toLocaleLowerCase())) {
      setMessage("That role is already in your comparison.");
      return;
    }
    setNewRole(role);
  }

  if (loading) return <main className={styles.page}><p className={styles.loading}>Loading your Career Scenario Lab…</p></main>;

  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Candidate navigation">
      <Link className={styles.brand} href="/dashboard">AVENLO</Link>
      <div className={styles.navLinks}><Link href="/dashboard">Overview</Link><Link href="/dashboard/profile">Talent Record</Link><Link href="/dashboard/signals">Signal Ledger</Link><Link href="/dashboard/skills">Capability Atlas</Link></div>
    </nav>

    <div className={styles.container}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>PRODUCT 4 · CAREER SCENARIO LAB</span>
          <h1>Explore a few possible next roles.</h1>
          <p>Choose adjacent roles you want to consider. Write down what you assume, what is still unknown, the candidate-confirmed evidence you want to consider, and a next step to learn more.</p>
        </div>
        <aside className={styles.boundary}><strong>Exploration, not prediction</strong><p>The lab does not score, rank, or promise outcomes. You choose the roles and can correct every note.</p></aside>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p className={styles.success} role="status">{message}</p>}

      <section className={styles.context}>
        <div className={styles.contextHeading}><span className={styles.eyebrow}>YOUR REVIEWED STARTING POINTS</span><h2>Use the information you chose to keep</h2><p>Recorded skills and candidate-confirmed signals are shown as context. They do not determine which role is right for you.</p></div>
        <div className={styles.contextColumns}>
          <div><strong>Talent Record skills</strong>{skills.length ? <ul className={styles.pills}>{skills.map((skill) => <li key={skill}>{skill}</li>)}</ul> : <p>No skills recorded yet. <Link href="/dashboard/profile">Review your Talent Record</Link></p>}</div>
          <div><strong>Candidate-confirmed signals</strong><p>{signals.length} available to connect as evidence. Only these reviewed signals can be linked to a scenario.</p><Link href="/dashboard/signals">Review your Signal Ledger →</Link></div>
        </div>
      </section>

      <section className={styles.addSection}>
        <div><span className={styles.eyebrow}>COMPARE UP TO THREE</span><h2>Add a role scenario</h2><p>Start with a role you are curious about. You can add roles from your Talent Record or enter another idea.</p></div>
        {targetRoles.length > 0 && <div className={styles.suggestions} aria-label="Target roles from your Talent Record">{targetRoles.map((role) => <button type="button" key={role} onClick={() => addSuggestedRole(role)}>{role} +</button>)}</div>}
        <form className={styles.addForm} onSubmit={createScenario}>
          <label>Role to explore<input maxLength={140} required value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="For example: Product Operations Manager" /></label>
          <button type="submit" disabled={busy || scenarios.length >= 3 || !newRole.trim()}>{busy ? "Saving…" : scenarios.length >= 3 ? "Three scenarios added" : "Add scenario"}</button>
        </form>
      </section>

      {scenarios.length === 0 ? <section className={styles.empty}><strong>No scenarios yet.</strong><span>Add up to three roles to explore. Avenlo will not guess a role or tell you which one to choose.</span></section> : <section className={styles.scenarioGrid} aria-label="Career role scenarios">
        {scenarios.map((scenario) => {
          const draft = drafts[scenario.id] ?? makeDraft(scenario);
          const linked = evidence.filter((link) => link.scenario_id === scenario.id);
          const linkedIds = new Set(linked.map((link) => link.signal_id));
          const options = signals.filter((signal) => !linkedIds.has(signal.id));
          return <article className={styles.scenario} key={scenario.id}>
            <header className={styles.scenarioHead}><span className={styles.eyebrow}>CANDIDATE-DEFINED SCENARIO</span><button type="button" className={styles.delete} onClick={() => void deleteScenario(scenario)} disabled={busy}>Delete</button></header>
            <label className={styles.roleLabel}>Role under consideration<input maxLength={140} value={draft.target_role} onChange={(event) => patchDraft(scenario.id, "target_role", event.target.value)} /></label>
            <label className={styles.textField}>Assumptions to test<textarea rows={4} value={draft.assumptions} onChange={(event) => patchDraft(scenario.id, "assumptions", event.target.value)} placeholder="One per line. What might be true about this role or your fit?" /><small>Separate each note with a new line.</small></label>
            <label className={styles.textField}>Open questions<textarea rows={4} value={draft.open_questions} onChange={(event) => patchDraft(scenario.id, "open_questions", event.target.value)} placeholder="What do you still need to learn from people, role descriptions, or practice?" /><small>Unknowns stay visible until you answer them.</small></label>
            <label className={styles.textField}>Possible next steps<textarea rows={4} value={draft.next_steps} onChange={(event) => patchDraft(scenario.id, "next_steps", event.target.value)} placeholder="One practical way to investigate this scenario." /><small>These are your proposed actions, not guaranteed outcomes.</small></label>

            <div className={styles.evidence}>
              <div><strong>Candidate-confirmed evidence</strong><p>Linked signals keep their source and uncertainty attached.</p></div>
              {options.length > 0 ? <div className={styles.linkForm}><label>Choose a signal<select value={selectedSignals[scenario.id] ?? ""} onChange={(event) => setSelectedSignals((current) => ({ ...current, [scenario.id]: event.target.value }))}><option value="" disabled>Choose confirmed evidence</option>{options.map((signal) => <option key={signal.id} value={signal.id}>{signal.statement}</option>)}</select></label><button type="button" onClick={() => void linkSignal(scenario)} disabled={busy || !selectedSignals[scenario.id]}>Link</button></div> : <p className={styles.noEvidence}>{signals.length ? "Every confirmed signal is already linked." : "Confirm a Signal Ledger entry before linking evidence."}</p>}
              {linked.length > 0 && <ul className={styles.evidenceList}>{linked.map((link) => {
                const signal = signals.find((item) => item.id === link.signal_id);
                if (!signal) return null;
                return <li key={link.signal_id}><div><strong>{signal.statement}</strong><span>{signal.source_label} · {signal.source_type.replace("_", " ")}{signal.source_date ? ` · ${new Date(signal.source_date + "T00:00:00").toLocaleDateString()}` : ""}</span><small>Uncertainty: {signal.uncertainty_note}</small></div><button type="button" onClick={() => void unlinkSignal(scenario, signal)} disabled={busy}>Remove</button></li>;
              })}</ul>}
            </div>
            <div className={styles.actions}><button className={styles.save} type="button" onClick={() => void saveScenario(scenario)} disabled={busy}>{busy ? "Saving…" : "Save scenario"}</button><span>Edited {new Date(scenario.updated_at).toLocaleDateString()}</span></div>
          </article>;
        })}
      </section>}

      <footer className={styles.footerNote}>No scenario is a hiring score, assessment, or prediction. Review your inputs and discuss open questions with people who understand the work.</footer>
    </div>
  </main>;
}
