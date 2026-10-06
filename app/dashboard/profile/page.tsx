"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./profile.module.css";

type Profile = { full_name: string; phone: string; headline: string; location: string; bio: string };
type Candidate = { experience_years: number | null; seniority: string; work_mode: string; industry: string; resume_path: string | null; preferences: Record<string, unknown> };
type Education = { id?: string; institution: string; degree: string; field_of_study: string; start_year: number | null; end_year: number | null; currently_studying: boolean };
type Work = { id: string; company: string; title: string; location: string; start_year: number | null; end_year: number | null; currently_working: boolean; description: string };
type ExtractedProfile = { full_name: string | null; email: string | null; phone: string | null; headline: string | null; location: string | null; bio: string | null; skills: string[]; target_roles: string[]; experience_years: number | null; seniority: string | null; education: Education[]; work_history: Work[] };

const emptyEducation = (): Education => ({ institution: "", degree: "", field_of_study: "", start_year: null, end_year: null, currently_studying: false });
const emptyWork = (): Work => ({ id: crypto.randomUUID(), company: "", title: "", location: "", start_year: null, end_year: null, currently_working: false, description: "" });

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", headline: "", location: "", bio: "" });
  const [candidate, setCandidate] = useState<Candidate>({ experience_years: null, seniority: "", work_mode: "", industry: "", resume_path: null, preferences: {} });
  const [education, setEducation] = useState<Education[]>([]);
  const [workHistory, setWorkHistory] = useState<Work[]>([]);
  const [skills, setSkills] = useState("");
  const [targetRoles, setTargetRoles] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const years = useMemo(() => Array.from({ length: 81 }, (_, index) => new Date().getFullYear() - index), []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.assign("/login"); return; }
      const [{ data: profileData, error: profileError }, { data: candidateData }, { data: skillData }, { data: educationData }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, headline, location, bio").eq("id", user.id).single(),
        supabase.from("candidate_profiles").select("experience_years, seniority, work_mode, industry, resume_path, preferences").eq("user_id", user.id).maybeSingle(),
        supabase.from("candidate_skills").select("skill").eq("user_id", user.id).order("skill"),
        supabase.from("candidate_education").select("id, institution, degree, field_of_study, start_year, end_year, currently_studying").eq("user_id", user.id).order("start_year", { ascending: false }),
      ]);
      if (profileError) setError("Unable to load your profile. Please refresh and try again.");
      if (profileData) setProfile((current) => ({ ...current, ...profileData }));
      if (candidateData) {
        const normalized = candidateData as Candidate;
        normalized.preferences = normalized.preferences ?? {};
        setCandidate(normalized);
        const prefs = normalized.preferences;
        const savedWork = Array.isArray(prefs.work_history) ? prefs.work_history : [];
        const savedRoles = Array.isArray(prefs.target_roles) ? prefs.target_roles : [];
        setTargetRoles(savedRoles.map(String).join(", "));
        setWorkHistory(savedWork.map((item: Partial<Work>, index: number) => ({ id: item.id || `work-${index}`, company: item.company || "", title: item.title || "", location: item.location || "", start_year: item.start_year ?? null, end_year: item.end_year ?? null, currently_working: Boolean(item.currently_working), description: item.description || "" })));
        const imported = prefs.resume_import as Partial<ExtractedProfile> | undefined;
        if (imported) {
          setProfile((current) => ({ ...current, full_name: current.full_name || imported.full_name || "", phone: current.phone || imported.phone || "", headline: current.headline || imported.headline || "", location: current.location || imported.location || "", bio: current.bio || imported.bio || "" }));
          if (!savedWork.length && Array.isArray(imported.work_history)) setWorkHistory(imported.work_history.map((item, index) => ({ ...emptyWork(), ...item, id: item.id || `imported-${index}` })));
          if (!savedRoles.length && Array.isArray(imported.target_roles)) setTargetRoles(imported.target_roles.map(String).join(", "));
          if (!skillData?.length && Array.isArray(imported.skills)) setSkills(imported.skills.join(", "));
          if (!educationData?.length && Array.isArray(imported.education)) setEducation(imported.education.map((item, index) => ({ ...emptyEducation(), ...item, id: item.id || `imported-education-${index}` })));
        }
      }
      setSkills((skillData ?? []).map((item) => item.skill).join(", "));
      setEducation((educationData ?? []).map((item) => ({ id: item.id, institution: item.institution ?? "", degree: item.degree ?? "", field_of_study: item.field_of_study ?? "", start_year: item.start_year ?? null, end_year: item.end_year ?? null, currently_studying: Boolean(item.currently_studying) })));
      setLoading(false);
    }
    void load();
  }, []);

  function updateEducation(index: number, patch: Partial<Education>) { setEducation((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row)); }
  function updateWork(index: number, patch: Partial<Work>) { setWorkHistory((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row)); }

  async function importResume(file: File | null) {
    setResume(file); setMessage(null); setError(null);
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/candidate/resume", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to read your resume.");
      const imported = payload.extractedProfile as ExtractedProfile | undefined;
      if (!imported) throw new Error("The resume was uploaded, but no profile data could be extracted.");
      setProfile((current) => ({ ...current, full_name: current.full_name || imported.full_name || "", phone: current.phone || imported.phone || "", headline: current.headline || imported.headline || "", location: current.location || imported.location || "", bio: current.bio || imported.bio || "" }));
      if (imported.skills?.length) setSkills((current) => current || imported.skills.join(", "));
      if (imported.target_roles?.length) setTargetRoles((current) => current || imported.target_roles.join(", "));
      if (imported.experience_years != null) setCandidate((current) => ({ ...current, experience_years: current.experience_years ?? imported.experience_years, seniority: current.seniority || imported.seniority || "" }));
      if (imported.work_history?.length) setWorkHistory((current) => current.length ? current : imported.work_history.map((item, index) => ({ ...emptyWork(), ...item, id: item.id || `imported-${index}` })));
      if (imported.education?.length) setEducation((current) => current.length ? current : imported.education.map((item, index) => ({ ...emptyEducation(), ...item, id: item.id || `imported-education-${index}` })));
      setCandidate((current) => ({ ...current, resume_path: payload.path, preferences: { ...current.preferences, resume_analysis: payload.analysis, resume_import: imported } }));
      setResume(null);
      setMessage("Resume imported. Review the extracted details below and edit or add anything before saving.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import your resume.");
    } finally { setImporting(false); }
  }

  function validate() {
    if (!profile.full_name.trim()) throw new Error("Please add your full name.");
    if (candidate.experience_years != null && (!Number.isFinite(candidate.experience_years) || candidate.experience_years < 0 || candidate.experience_years > 60)) throw new Error("Years of experience must be between 0 and 60.");
    for (const row of education) {
      if (!row.institution.trim()) throw new Error("Each education entry needs an institution.");
      if (!row.currently_studying && row.start_year != null && row.end_year != null && row.end_year < row.start_year) throw new Error("Education end year cannot be before the start year.");
    }
    for (const row of workHistory) {
      if (!row.company.trim() || !row.title.trim()) throw new Error("Each work entry needs a company and job title.");
      if (!row.currently_working && row.start_year != null && row.end_year != null && row.end_year < row.start_year) throw new Error("A job end year cannot be before its start year.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null); setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Please sign in again.");
      validate();
      let resumePath = candidate.resume_path;
      if (resume) {
        await importResume(resume);
        resumePath = candidate.resume_path;
      }
      const { error: profileError } = await supabase.from("profiles").update({ full_name: profile.full_name.trim(), phone: profile.phone.trim(), headline: profile.headline.trim(), location: profile.location.trim(), bio: profile.bio.trim() }).eq("id", user.id);
      if (profileError) throw new Error("Unable to save profile details.");
      const skillList = [...new Set(skills.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))];
      const roleList = [...new Set(targetRoles.split(",").map((item) => item.trim()).filter(Boolean))];
      const nextPreferences = { ...candidate.preferences, target_roles: roleList, work_history: workHistory.map(({ id, ...row }) => ({ id, ...row })) };
      const { error: candidateError } = await supabase.from("candidate_profiles").upsert({ user_id: user.id, experience_years: candidate.experience_years, seniority: candidate.seniority.trim() || null, work_mode: candidate.work_mode.trim() || null, industry: candidate.industry.trim() || null, resume_path: resumePath, preferences: nextPreferences }, { onConflict: "user_id" });
      if (candidateError) throw new Error("Unable to save professional details.");
      const { error: deleteSkillError } = await supabase.from("candidate_skills").delete().eq("user_id", user.id);
      if (deleteSkillError) throw new Error("Unable to update skills.");
      if (skillList.length) { const { error: skillError } = await supabase.from("candidate_skills").insert(skillList.map((skill) => ({ user_id: user.id, skill }))); if (skillError) throw new Error("Unable to update skills."); }
      const { data: existingEducation } = await supabase.from("candidate_education").select("id").eq("user_id", user.id);
      const keptIds = new Set(education.filter((row) => row.id && !row.id.startsWith("imported-")).map((row) => row.id as string));
      const idsToDelete = (existingEducation ?? []).map((row) => row.id).filter((id) => !keptIds.has(id));
      if (idsToDelete.length) { const { error } = await supabase.from("candidate_education").delete().in("id", idsToDelete); if (error) throw new Error("Unable to update education."); }
      if (education.length) {
        const payload = education.map((row) => ({ ...(row.id && !row.id.startsWith("imported-") ? { id: row.id } : {}), user_id: user.id, institution: row.institution.trim(), degree: row.degree.trim() || null, field_of_study: row.field_of_study.trim() || null, start_year: row.start_year, end_year: row.currently_studying ? null : row.end_year, currently_studying: row.currently_studying }));
        const { data: savedEducation, error } = await supabase.from("candidate_education").upsert(payload).select("id, institution, degree, field_of_study, start_year, end_year, currently_studying");
        if (error) throw new Error("Unable to update education.");
        setEducation((savedEducation ?? []).map((row) => ({ id: row.id, institution: row.institution ?? "", degree: row.degree ?? "", field_of_study: row.field_of_study ?? "", start_year: row.start_year ?? null, end_year: row.end_year ?? null, currently_studying: Boolean(row.currently_studying) })));
      } else setEducation([]);
      setCandidate((current) => ({ ...current, resume_path: resumePath, preferences: nextPreferences })); setResume(null); setMessage("Profile saved successfully.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save your profile."); } finally { setSaving(false); }
  }

  if (loading) return <main className={styles.page}><div className={styles.loading}>Loading your profile…</div></main>;
  return <main className={styles.page}>
    <nav className={styles.nav}><Link href="/dashboard" className={styles.brand}><span className="brand-lockup brand-lockup--compact"><span className="brand-copy"><span className="brand-wordmark">AVENLO</span></span></span></Link><div className={styles.navActions}><Link className="btn btn--small" href="/dashboard">Dashboard</Link></div></nav>
    <section className={styles.hero}><div className={styles.heroInner}><div className={styles.eyebrow}>CANDIDATE PROFILE</div><h1>Build the context behind your career.</h1><p>Upload your resume first. Avenlo will extract the useful career context for you to review, edit and add to — you stay in control of what becomes part of your profile.</p><div className={styles.heroMeta}><span>Resume-first</span><span>Editable anytime</span><span>Private profile</span></div></div></section>
    <form className={styles.form} onSubmit={save}>
      <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>01 · RESUME IMPORT</span><h2>Start with your resume</h2><p>Upload your latest CV and Avenlo will extract your identity, skills, experience and education. Nothing is final until you review and save it.</p></div></div><div className={styles.resumeBox}><div><input className={styles.file} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={importing || saving} onChange={(e) => void importResume(e.target.files?.[0] ?? null)} /><div className={styles.resumeMeta}><strong>{importing ? "Reading your resume…" : candidate.resume_path ? "Resume imported" : "No resume uploaded yet"}</strong><span>{importing ? "Extracting profile details and preparing them for review." : "PDF, DOC or DOCX · maximum 10 MB"}</span></div></div><Link href="/dashboard/resume" className={styles.resumeLink}>Open resume checker →</Link></div></section>

      <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>02 · ABOUT YOU</span><h2>Review your profile basics</h2><p>These fields are pre-filled from your resume where possible. Edit anything that is wrong or add what the resume could not provide.</p></div></div><div className={styles.fieldGrid}>
        <Field label="Full name" required><input className={styles.input} required value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></Field>
        <Field label="Phone"><input className={styles.input} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
        <Field label="Professional headline"><input className={styles.input} value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="e.g. Product Manager — B2B SaaS" /></Field>
        <Field label="Location"><input className={styles.input} value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Bengaluru, India" /></Field>
        <Field label="Professional summary" full><textarea className={styles.textarea} rows={5} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Your strengths, focus areas, achievements and the direction you want to move toward." /></Field>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>03 · CAREER</span><h2>Career context</h2><p>Review the signals Avenlo uses to understand seniority, fit and your preferred direction.</p></div></div><div className={styles.fieldGrid}>
        <Field label="Years of experience"><input className={styles.input} type="number" min="0" max="60" step="0.5" value={candidate.experience_years ?? ""} onChange={(e) => setCandidate({ ...candidate, experience_years: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Seniority"><select className={styles.select} value={candidate.seniority} onChange={(e) => setCandidate({ ...candidate, seniority: e.target.value })}><option value="">Select seniority</option>{["Entry level","Junior","Mid-level","Senior","Lead","Manager","Director","Executive"].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Preferred work mode"><select className={styles.select} value={candidate.work_mode} onChange={(e) => setCandidate({ ...candidate, work_mode: e.target.value })}><option value="">Select work mode</option>{["Remote","Hybrid","On-site"].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Industry"><input className={styles.input} value={candidate.industry} onChange={(e) => setCandidate({ ...candidate, industry: e.target.value })} placeholder="Technology, Finance, Healthcare…" /></Field>
        <Field label="Target roles" hint="comma separated" full><input className={styles.input} value={targetRoles} onChange={(e) => setTargetRoles(e.target.value)} placeholder="Product Manager, Business Analyst, Operations Manager" /></Field>
        <Field label="Core skills" hint="comma separated" full><input className={styles.input} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, SQL, Product Management, Figma" /></Field>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>04 · EXPERIENCE</span><h2>Professional experience</h2><p>Imported roles can be corrected, expanded or removed. Add anything missing from your resume.</p></div><button className={styles.addButton} type="button" onClick={() => setWorkHistory((rows) => [...rows, emptyWork()])}>+ Add role</button></div><div className={styles.entries}>
        {workHistory.map((row, index) => <div className={styles.entry} key={row.id}><div className={styles.entryHead}><strong>Role {index + 1}</strong><button className={styles.remove} type="button" onClick={() => setWorkHistory((rows) => rows.filter((_, i) => i !== index))}>Remove</button></div><div className={styles.fieldGrid}>
          <Field label="Company" required><input className={styles.input} required value={row.company} onChange={(e) => updateWork(index, { company: e.target.value })} placeholder="Company name" /></Field>
          <Field label="Job title" required><input className={styles.input} required value={row.title} onChange={(e) => updateWork(index, { title: e.target.value })} placeholder="Software Engineer" /></Field>
          <Field label="Location"><input className={styles.input} value={row.location} onChange={(e) => updateWork(index, { location: e.target.value })} placeholder="Bengaluru, India" /></Field>
          <YearField label="Start year" value={row.start_year} years={years} onChange={(value) => updateWork(index, { start_year: value })} />
          <YearField label="End year" value={row.end_year} years={years} disabled={row.currently_working} onChange={(value) => updateWork(index, { end_year: value })} />
          <label className={styles.checkRow}><input type="checkbox" checked={row.currently_working} onChange={(e) => updateWork(index, { currently_working: e.target.checked, end_year: e.target.checked ? null : row.end_year })} /> I currently work here</label>
          <Field label="What did you do?" hint="optional" full><textarea className={styles.textarea} rows={4} value={row.description} onChange={(e) => updateWork(index, { description: e.target.value })} placeholder="Responsibilities, achievements, products shipped or measurable impact." /></Field>
        </div></div>)}
        {!workHistory.length ? <div className={styles.empty}>No work history found yet. Add your current role or a previous job so Avenlo can understand your experience level.</div> : null}
      </div></section>

      <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>05 · EDUCATION</span><h2>Education history</h2><p>Review imported education and add anything missing. Start and end years use dropdowns for consistency.</p></div><button className={styles.addButton} type="button" onClick={() => setEducation((rows) => [...rows, emptyEducation()])}>+ Add education</button></div><div className={styles.entries}>
        {education.map((row, index) => <div className={styles.entry} key={row.id ?? `new-${index}`}><div className={styles.entryHead}><strong>Education {index + 1}</strong><button className={styles.remove} type="button" onClick={() => setEducation((rows) => rows.filter((_, i) => i !== index))}>Remove</button></div><div className={styles.fieldGrid}>
          <Field label="Institution" required><input className={styles.input} required value={row.institution} onChange={(e) => updateEducation(index, { institution: e.target.value })} placeholder="University / College" /></Field>
          <Field label="Degree"><input className={styles.input} value={row.degree} onChange={(e) => updateEducation(index, { degree: e.target.value })} placeholder="B.Sc. Computer Science" /></Field>
          <Field label="Field of study"><input className={styles.input} value={row.field_of_study} onChange={(e) => updateEducation(index, { field_of_study: e.target.value })} placeholder="Computer Science" /></Field>
          <YearField label="Start year" value={row.start_year} years={years} onChange={(value) => updateEducation(index, { start_year: value })} />
          <YearField label="End year" value={row.end_year} years={years} disabled={row.currently_studying} onChange={(value) => updateEducation(index, { end_year: value })} />
          <label className={styles.checkRow}><input type="checkbox" checked={row.currently_studying} onChange={(e) => updateEducation(index, { currently_studying: e.target.checked, end_year: e.target.checked ? null : row.end_year })} /> Currently studying</label>
        </div></div>)}
        {!education.length ? <div className={styles.empty}>No education added yet. Add your degree, institution and field of study.</div> : null}
      </div></section>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}{message ? <p className={styles.notice} role="status">{message}</p> : null}
      <div className={styles.actions}><button className={styles.save} type="submit" disabled={saving || importing}>{saving ? "Saving profile…" : importing ? "Importing resume…" : "Save profile"}</button><Link className="btn" href="/dashboard">Back to dashboard</Link></div>
    </form>
  </main>;
}

function Field({ label, hint, required, full, children }: { label: string; hint?: string; required?: boolean; full?: boolean; children: ReactNode }) {
  return <label className={`${styles.field} ${full ? styles.fieldFull : ""}`}><span>{label}{required ? " *" : ""}{hint ? <small>{hint}</small> : null}</span>{children}</label>;
}
function YearField({ label, value, years, disabled, onChange }: { label: string; value: number | null; years: number[]; disabled?: boolean; onChange: (value: number | null) => void }) {
  return <label className={styles.field}><span>{label}</span><select className={styles.select} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}><option value="">Select year</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>;
}
