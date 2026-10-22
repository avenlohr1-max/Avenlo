"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./evidence-links.module.css";

type Skill = { id: string; skill: string };
type Signal = { id: string; signal_type: string; statement: string; source_label: string; source_type: string; context: string; uncertainty_note: string; verification_status: string };
type EvidenceLink = { candidate_skill_id: string; signal_id: string };

export default function EvidenceLinks() {
  const supabase = useMemo(() => createClient(), []);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [links, setLinks] = useState<EvidenceLink[]>([]);
  const [skillId, setSkillId] = useState("");
  const [signalId, setSignalId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { window.location.assign("/login"); return; }
    const [{ data: skillRows, error: skillError }, { data: signalRows, error: signalError }, { data: linkRows, error: linkError }] = await Promise.all([
      supabase.from("candidate_skills").select("id, skill").eq("user_id", user.id).order("skill"),
      supabase.from("candidate_signals").select("id, signal_type, statement, source_label, source_type, context, uncertainty_note, verification_status").eq("candidate_id", user.id).eq("verification_status", "candidate_confirmed").order("created_at", { ascending: false }),
      supabase.from("candidate_capability_evidence").select("candidate_skill_id, signal_id").eq("candidate_id", user.id),
    ]);
    if (skillError || signalError || linkError) {
      setError("Evidence links could not be loaded. Confirm the local database has the Phase 1 migrations.");
      return;
    }
    const nextSkills = (skillRows ?? []) as Skill[];
    const nextSignals = (signalRows ?? []) as Signal[];
    setSkills(nextSkills); setSignals(nextSignals); setLinks((linkRows ?? []) as EvidenceLink[]);
    setSkillId((current) => nextSkills.some((row) => row.id === current) ? current : nextSkills[0]?.id ?? "");
    setSignalId((current) => nextSignals.some((row) => row.id === current) ? current : nextSignals[0]?.id ?? "");
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function addLink() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !skillId || !signalId) return;
    setBusy(true); setError(null); setMessage(null);
    const { error: insertError } = await supabase.from("candidate_capability_evidence").insert({
      candidate_id: user.id, candidate_skill_id: skillId, signal_id: signalId,
    });
    if (insertError) {
      setError(insertError.code === "23505" ? "That signal is already linked to this skill." : "Unable to link this signal. Please retry.");
    } else {
      await load();
      setMessage("Reviewed signal linked to your capability.");
    }
    setBusy(false);
  }

  async function removeLink(link: EvidenceLink) {
    setBusy(true); setError(null); setMessage(null);
    const { error: deleteError } = await supabase.from("candidate_capability_evidence")
      .delete().eq("candidate_skill_id", link.candidate_skill_id).eq("signal_id", link.signal_id);
    if (deleteError) setError("Unable to remove this evidence link. Please retry.");
    else { await load(); setMessage("Evidence link removed."); }
    setBusy(false);
  }

  const linkedSignalIds = new Set(links.map((link) => link.signal_id));

  return <section className={styles.section}>
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>CAPABILITY ATLAS · EVIDENCE LINKS</span><h2>Connect reviewed signals to skills</h2></div>
      <p>Only signals you marked candidate-confirmed are offered here. A link keeps their source and uncertainty visible; it does not assign a proficiency score.</p>
    </div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {message && <p className={styles.success} role="status">{message}</p>}
    {signals.length === 0 ? <div className={styles.empty}><strong>No confirmed signals yet.</strong><span>Add a signal in your Signal Ledger and mark it candidate-confirmed before linking it to a skill.</span></div> : skills.length === 0 ? <div className={styles.empty}><strong>No skills are on your Talent Record.</strong><span>Add or correct skills from your profile before connecting evidence.</span></div> : <div className={styles.linkForm}>
      <label>Talent Record skill<select value={skillId} onChange={(event) => setSkillId(event.target.value)}>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.skill}</option>)}</select></label>
      <label>Candidate-confirmed signal<select value={signalId} onChange={(event) => setSignalId(event.target.value)}>{signals.map((signal) => <option key={signal.id} value={signal.id}>{signal.statement}</option>)}</select></label>
      <button type="button" onClick={() => void addLink()} disabled={busy || !skillId || !signalId || linkedSignalIds.has(signalId) && links.some((link) => link.candidate_skill_id === skillId && link.signal_id === signalId)}>{busy ? "Saving…" : "Link evidence"}</button>
    </div>}
    <div className={styles.skillGroups}>
      {skills.map((skill) => {
        const skillLinks = links.filter((link) => link.candidate_skill_id === skill.id);
        return <article className={styles.skill} key={skill.id}>
          <div className={styles.skillTitle}><h3>{skill.skill}</h3><span>{skillLinks.length} linked {skillLinks.length === 1 ? "signal" : "signals"}</span></div>
          {skillLinks.length === 0 ? <p className={styles.emptyLine}>No candidate-confirmed signals linked yet.</p> : <ul>{skillLinks.map((link) => {
            const signal = signals.find((row) => row.id === link.signal_id);
            if (!signal) return null;
            return <li key={link.signal_id}>
              <div><strong>{signal.statement}</strong><span>{signal.source_label} · {signal.source_type.replace("_", " ")}</span><p>{signal.context}</p><small>Uncertainty: {signal.uncertainty_note}</small></div>
              <button type="button" onClick={() => void removeLink(link)} disabled={busy} aria-label={`Remove evidence link for ${skill.skill}`}>Remove</button>
            </li>;
          })}</ul>}
        </article>;
      })}
    </div>
  </section>;
}
