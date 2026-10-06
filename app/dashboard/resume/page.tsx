"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../tools.module.css";

type State = { fullName: string; headline: string; industry: string; resumePath: string | null; skills: string[]; educationCount: number; workCount: number; experience: number | null };

export default function ResumeCheckerPage() {
  const [state, setState] = useState<State>({ fullName: "", headline: "", industry: "", resumePath: null, skills: [], educationCount: 0, workCount: 0, experience: null });
  const [loading, setLoading] = useState(true); const [uploading, setUploading] = useState(false); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { window.location.assign("/login"); return; }
    const [{ data: profile }, { data: candidate }, { data: skills }, { count: educationCount }] = await Promise.all([
      supabase.from("profiles").select("full_name, headline").eq("id", user.id).maybeSingle(),
      supabase.from("candidate_profiles").select("resume_path, experience_years, industry, preferences").eq("user_id", user.id).maybeSingle(),
      supabase.from("candidate_skills").select("skill").eq("user_id", user.id).order("skill"),
      supabase.from("candidate_education").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    const workCount = Array.isArray(candidate?.preferences?.work_history) ? candidate?.preferences?.work_history.length : 0;
    setState({ fullName: profile?.full_name ?? "", headline: profile?.headline ?? "", industry: candidate?.industry ?? "", resumePath: candidate?.resume_path ?? null, skills: (skills ?? []).map((item) => item.skill), educationCount: educationCount ?? 0, workCount, experience: candidate?.experience_years ?? null }); setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const checks = useMemo(() => [
    { label: "Resume file", ok: Boolean(state.resumePath), detail: state.resumePath ? "A current CV is stored securely." : "Upload a PDF, DOC or DOCX to start." },
    { label: "Professional headline", ok: Boolean(state.headline.trim()), detail: state.headline ? "Your direction is visible at a glance." : "Add a clear role-focused headline." },
    { label: "Skills evidence", ok: state.skills.length >= 3, detail: state.skills.length >= 3 ? `${state.skills.length} skills are available for matching.` : "Add at least 3 core skills." },
    { label: "Experience context", ok: state.workCount > 0 || state.experience !== null, detail: state.workCount ? `${state.workCount} role${state.workCount === 1 ? "" : "s"} listed.` : state.experience !== null ? `${state.experience} years of experience recorded.` : "Add your current or past experience." },
    { label: "Education context", ok: state.educationCount > 0, detail: state.educationCount ? `${state.educationCount} education record${state.educationCount === 1 ? "" : "s"} listed.` : "Add your education history." },
    { label: "Career context", ok: Boolean(state.industry), detail: state.industry ? `${state.industry} is recorded as your industry.` : "Add an industry so role alignment is clearer." },
  ], [state]);
  const score = Math.round((checks.filter((item) => item.ok).length / checks.length) * 100);

  async function upload(file: File | undefined) {
    if (!file) return; setUploading(true); setMessage(null); setError(null);
    try { const form = new FormData(); form.append("file", file); const response = await fetch("/api/candidate/resume", { method: "POST", body: form }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Unable to upload your resume."); setMessage("Resume uploaded successfully. Your Avenlo checker is ready."); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to upload your resume."); } finally { setUploading(false); }
  }

  if (loading) return <main className={styles.page}><div className={styles.container}><p>Loading your resume checker…</p></div></main>;
  return <main className={styles.page}>
    <nav className={styles.nav}><Link href="/dashboard"><span className="brand-lockup brand-lockup--compact"><span className="brand-copy"><span className="brand-wordmark">AVENLO</span></span></span></Link><div className={styles.navLinks}><Link href="/dashboard">Overview</Link><Link href="/dashboard/skills">Skills</Link><Link href="/dashboard/courses">Courses</Link><Link href="/dashboard/profile">Profile</Link></div></nav>
    <div className={styles.container}><Link className={styles.back} href="/dashboard">← Back to dashboard</Link><header className={styles.header}><div><span className={styles.eyebrow}>RESUME CHECKER</span><h1>Make your resume easier to match.</h1><p>Avenlo checks whether the information around your resume is strong enough for meaningful recommendations. This is a readiness check, not a generic ATS score.</p></div></header>
      <div className={styles.grid}><section className={styles.card}><h2>Resume readiness</h2><div className={styles.score} style={{ ["--score" as string]: `${score * 3.6}deg` }}><strong>{score}</strong><span>READINESS</span></div><div className={styles.metricList}>{checks.map((check) => <div className={styles.metric} key={check.label}><span>{check.label}</span><strong className={!check.ok ? styles.warn : ""}>{check.ok ? "Ready" : "Needs work"}</strong></div>)}</div></section>
        <section className={styles.card}><h2>Resume file</h2><p>Keep one current CV on your profile. Avenlo stores it privately and uses it as part of the recommendation workflow.</p><div className={styles.upload}><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} />{state.resumePath ? <div className={styles.fileMeta}>✓ Resume on file — upload another to replace it.</div> : <div className={styles.fileMeta}>PDF, DOC or DOCX · maximum 10 MB</div>}</div>{message ? <p className={styles.notice}>{message}</p> : null}{error ? <p className={styles.error} role="alert">{error}</p> : null}<div className={styles.actions}><Link className="btn btn--primary btn--small" href="/dashboard/profile">Edit profile</Link><Link className="btn btn--small" href="/dashboard/skills">Check skills</Link></div></section></div>
      <section className={styles.card} style={{ marginTop: 16 }}><h2>What to improve</h2><div className={styles.checkList}>{checks.map((check) => <div className={styles.checkItem} key={check.label}><span className={`${styles.checkIcon} ${check.ok ? "" : styles.warn}`}>{check.ok ? "✓" : "!"}</span><div><strong>{check.label}</strong><span>{check.detail}</span></div></div>)}</div></section>
    </div>
  </main>;
}
