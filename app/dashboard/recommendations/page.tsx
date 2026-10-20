import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { basisLabels, confirmedOpportunityEvidence, roleBasis, roleIsOpen, type OpportunityRole, type OpportunitySignal } from "@/lib/opportunity-context";
import { linkOpportunityEvidence, saveOpportunityDecision } from "./actions";
import styles from "./opportunities.module.css";

type Suggestion = { id: string; job_id: string | null; basis_field: string; curator_note: string; created_at: string; jobs: OpportunityRole | OpportunityRole[] | null };
type Decision = { opportunity_id: string; disposition: string; private_note: string };
type Evidence = { opportunity_id: string; signal_id: string };

export default async function OpportunityIntelligence({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "candidate") redirect("/dashboard");
  const [suggestions, signalResult] = await Promise.all([
    supabase.from("candidate_opportunities").select("id, job_id, basis_field, curator_note, created_at, jobs(id, title, description, skills, industry, location, work_mode, seniority, experience_years, status, expires_at)").eq("candidate_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("candidate_signals").select("id, statement, source_label, source_type, source_date, context, uncertainty_note, verification_status").eq("candidate_id", user.id).order("created_at", { ascending: false }).limit(200),
  ]);
  const rows = (suggestions.data ?? []) as unknown as Suggestion[];
  const ids = rows.map((row) => row.id);
  const [decisionResult, evidenceResult] = ids.length ? await Promise.all([
    supabase.from("candidate_opportunity_decisions").select("opportunity_id, disposition, private_note").eq("candidate_id", user.id).in("opportunity_id", ids),
    supabase.from("candidate_opportunity_evidence").select("opportunity_id, signal_id").eq("candidate_id", user.id).in("opportunity_id", ids),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  const decisions = (decisionResult.data ?? []) as Decision[];
  const evidence = (evidenceResult.data ?? []) as Evidence[];
  const signals = (signalResult.data ?? []) as OpportunitySignal[];
  const failed = suggestions.error || signalResult.error || decisionResult.error || evidenceResult.error;
  const { result } = await searchParams;

  return <main className={styles.page}><div className={styles.container}>
    <nav className={styles.nav} aria-label="Opportunity workspace"><Link href="/dashboard">← Dashboard</Link><Link href="/dashboard/signals">Signal Ledger</Link><Link href="/dashboard/profile">Sharing settings</Link></nav>
    <header><span className={styles.eyebrow}>OPPORTUNITY INTELLIGENCE</span><h1>Explore the roles suggested for you.</h1><p>Review the role information, Avenlo’s reasoning and the evidence you choose to connect. A suggestion is a starting point for your decision.</p></header>
    <aside className={styles.notice}>Your notes, decisions and evidence links stay private to you. Receiving or saving a suggestion grants no employer access to your Talent Record. Manage access in <Link href="/dashboard/profile">sharing settings</Link>.</aside>
    {result && <p role={result === "saved" ? "status" : "alert"}>{result === "saved" ? "Your private opportunity workspace has been updated." : "The change could not be saved. Check your inputs; evidence must still be candidate-confirmed."}</p>}
    {failed ? <p role="alert">Unable to load your opportunity workspace. Refresh to try again; your saved choices have not been replaced.</p> : !rows.length ? <section className={styles.card}><h2>No suggestions yet</h2><p>When Avenlo suggests a role, you can review it here. You can prepare by reviewing your Talent Record and confirming evidence in your Signal Ledger.</p><Link href="/dashboard/signals">Review your signals →</Link></section> : <>
      <p className={styles.meta}>Latest {rows.length} suggestions, newest first. Evidence choices use your latest {signals.length} ledger entries.</p>
      {rows.map((row) => {
        const role = Array.isArray(row.jobs) ? row.jobs[0] ?? null : row.jobs;
        const decision = decisions.find((item) => item.opportunity_id === row.id);
        const links = evidence.filter((item) => item.opportunity_id === row.id);
        const selectedIds = links.map((item) => item.signal_id);
        const approved = confirmedOpportunityEvidence(signals, selectedIds);
        const choices = signals.filter((signal) => signal.verification_status === "candidate_confirmed" && !selectedIds.includes(signal.id));
        const open = roleIsOpen(role);
        return <article className={styles.card} key={row.id}>
          <div className={styles.titleRow}><h2>{role?.title ?? "Role information unavailable"}</h2><span>{decision?.disposition ?? "considering"}</span></div>
          <p className={styles.meta}>Suggested {new Date(row.created_at).toLocaleDateString("en-IN")} · {open ? "Role currently open" : "Role no longer available for action"}</p>
          <h3>Avenlo’s reason to explore</h3><p className={styles.prose}>{row.curator_note}</p><p className={styles.meta}>Human curator judgment. Employer role information is the source below; candidate suitability has not been verified.</p>
          <dl><dt>{basisLabels[row.basis_field]}</dt><dd>{roleBasis(role, row.basis_field)}</dd></dl>
          {role && <details><summary>Review current employer role information</summary><p className={styles.prose}>{role.description}</p><dl>{Object.entries(basisLabels).map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{roleBasis(role, field)}</dd></div>)}</dl></details>}
          <section><h3>Your chosen evidence</h3><p>Only candidate-confirmed signals appear as evidence. Keep their source, context and uncertainty in view; confirmation records your review.</p>
            {!links.length && <p>No evidence linked. You can explore this suggestion without adding evidence.</p>}
            {links.map((link) => {
              const signal = approved.find((item) => item.id === link.signal_id);
              return <div className={styles.evidence} key={link.signal_id}>{signal ? <><strong>{signal.statement}</strong><p>Source: {signal.source_label} · {signal.source_type} · {signal.source_date ?? "Date not supplied"}</p><p>Context: {signal.context}</p><p>Uncertainty: {signal.uncertainty_note}</p></> : <p>This evidence is unavailable or needs review. <Link href="/dashboard/signals">Review your Signal Ledger</Link>.</p>}
                <form action={linkOpportunityEvidence}><input type="hidden" name="opportunityId" value={row.id} /><input type="hidden" name="signalId" value={link.signal_id} /><input type="hidden" name="operation" value="remove" /><button type="submit">Remove evidence link</button></form>
              </div>;
            })}
            {choices.length > 0 && <form action={linkOpportunityEvidence} className={styles.form}><input type="hidden" name="opportunityId" value={row.id} /><input type="hidden" name="operation" value="link" /><label>Choose confirmed evidence<select name="signalId" required defaultValue=""><option value="" disabled>Choose a signal</option>{choices.map((signal) => <option key={signal.id} value={signal.id}>{signal.statement}</option>)}</select></label><button type="submit">Link privately</button></form>}
          </section>
          <form action={saveOpportunityDecision} className={styles.form}><h3>Your decision and open questions</h3><input type="hidden" name="opportunityId" value={row.id} /><label>Status<select name="disposition" defaultValue={decision?.disposition ?? "considering"}><option value="considering">Considering</option><option value="saved">Saved for later</option><option value="dismissed">Dismissed</option></select></label><label>Private notes, corrections and questions<textarea name="note" rows={4} maxLength={2000} defaultValue={decision?.private_note ?? ""} placeholder="What needs clarifying? Which assumptions would you correct?" /></label><button className="btn btn--primary" type="submit">Save my choice</button></form>
          <div className={styles.actions}>{open && <Link className="btn" href={`/dashboard/jobs/${row.job_id}`}>Review role and application options</Link>}<Link href="/dashboard/signals">Correct a signal</Link></div>
        </article>;
      })}
    </>}
  </div></main>;
}
