"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./profile.module.css";

type Profile = {
  full_name: string;
  phone: string;
  headline: string;
  location: string;
  bio: string;
};

type Candidate = {
  experience_years: number | null;
  seniority: string;
  work_mode: string;
  industry: string;
  resume_path: string | null;
  preferences: Record<string, unknown>;
};

type Education = {
  id?: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number | null;
  end_year: number | null;
  currently_studying: boolean;
};

type WorkExperience = {
  id: string;
  company: string;
  title: string;
  location: string;
  start_year: number | null;
  end_year: number | null;
  currently_working: boolean;
  description: string;
};

const emptyEducation = (): Education => ({
  institution: "",
  degree: "",
  field_of_study: "",
  start_year: null,
  end_year: null,
  currently_studying: false,
});

const emptyWork = (): WorkExperience => ({
  id: crypto.randomUUID(),
  company: "",
  title: "",
  location: "",
  start_year: null,
  end_year: null,
  currently_working: false,
  description: "",
});

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", headline: "", location: "", bio: "" });
  const [candidate, setCandidate] = useState<Candidate>({ experience_years: null, seniority: "", work_mode: "", industry: "", resume_path: null, preferences: {} });
  const [education, setEducation] = useState<Education[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => Array.from({ length: 86 }, (_, index) => 1950 + index).reverse(), []);

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

      if (profileError) setError("Unable to load your profile.");
      if (profileData) setProfile((current) => ({ ...current, ...profileData }));
      if (candidateData) {
        const normalized = candidateData as Candidate;
        setCandidate(normalized);
        const savedWork = Array.isArray(normalized.preferences?.work_history) ? normalized.preferences.work_history : [];
        setWorkHistory(savedWork.map((item: Partial<WorkExperience>, index: number) => ({
          id: item.id || `work-${index}`,
          company: item.company || "",
          title: item.title || "",
          location: item.location || "",
          start_year: item.start_year ?? null,
          end_year: item.end_year ?? null,
          currently_working: Boolean(item.currently_working),
          description: item.description || "",
        })));
      }
      setSkills((skillData ?? []).map((item) => item.skill).join(", "));
      setEducation((educationData ?? []).map((item) => ({
        id: item.id,
        institution: item.institution ?? "",
        degree: item.degree ?? "",
        field_of_study: item.field_of_study ?? "",
        start_year: item.start_year ?? null,
        end_year: item.end_year ?? null,
        currently_studying: Boolean(item.currently_studying),
      })));
      setLoading(false);
    }
    void load();
  }, []);

  function updateEducation(index: number, patch: Partial<Education>) {
    setEducation((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function updateWork(index: number, patch: Partial<WorkExperience>) {
    setWorkHistory((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function validateEducation(rows: Education[]) {
    for (const row of rows) {
      if (!row.institution.trim()) throw new Error("Each education entry needs an institution.");
      if (row.start_year != null && (row.start_year < 1900 || row.start_year > 2100)) throw new Error("Education start year must be between 1900 and 2100.");
      if (row.end_year != null && (row.end_year < 1900 || row.end_year > 2100)) throw new Error("Education end year must be between 1900 and 2100.");
      if (!row.currently_studying && row.start_year != null && row.end_year != null && row.end_year < row.start_year) throw new Error("Education end year cannot be before the start year.");
    }
  }

  function validateWork(rows: WorkExperience[]) {
    for (const row of rows) {
      if (!row.company.trim()) throw new Error("Each work entry needs a company.");
      if (!row.title.trim()) throw new Error("Each work entry needs a job title.");
      if (row.start_year != null && row.end_year != null && !row.currently_working && row.end_year < row.start_year) throw new Error("A job end year cannot be before its start year.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Please sign in again.");

      if (candidate.experience_years != null && (!Number.isFinite(candidate.experience_years) || candidate.experience_years < 0 || candidate.experience_years > 60)) {
        throw new Error("Years of experience must be between 0 and 60.");
      }

      const educationRows = education.map((row) => ({ ...row }));
      validateEducation(educationRows);
      validateWork(workHistory);

      let resumePath = candidate.resume_path;
      if (resume) {
        if (resume.size > 10 * 1024 * 1024) throw new Error("CV must be 10 MB or smaller.");
        const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!allowed.includes(resume.type)) throw new Error("Upload a PDF, DOC, or DOCX CV.");
        const extension = resume.name.split(".").pop()?.toLowerCase();
        if (!extension || !["pdf", "doc", "docx"].includes(extension)) throw new Error("Upload a PDF, DOC, or DOCX CV.");
        const newResumePath = user.id + "/resume." + extension;
        const { error: uploadError } = await supabase.storage.from("candidate-documents").upload(newResumePath, resume, { upsert: true, contentType: resume.type });
        if (uploadError) throw new Error("Unable to upload CV.");
        resumePath = newResumePath;
      }

      const { error: profileError } = await supabase.from("profiles").update({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        headline: profile.headline.trim(),
        location: profile.location.trim(),
        bio: profile.bio.trim(),
      }).eq("id", user.id);
      if (profileError) throw new Error("Unable to save profile details.");

      const nextPreferences = { ...candidate.preferences, work_history: workHistory.map(({ id, ...row }) => ({ id, ...row })) };
      const { error: candidateError } = await supabase.from("candidate_profiles").upsert({
        user_id: user.id,
        experience_years: candidate.experience_years,
        seniority: candidate.seniority.trim() || null,
        work_mode: candidate.work_mode.trim() || null,
        industry: candidate.industry.trim() || null,
        resume_path: resumePath,
        preferences: nextPreferences,
      });
      if (candidateError) throw new Error("Unable to save professional details.");

      const skillList = [...new Set(skills.split(",").map((skill) => skill.trim().toLowerCase()).filter(Boolean))];
      const { error: deleteError } = await supabase.from("candidate_skills").delete().eq("user_id", user.id);
      if (deleteError) throw new Error("Unable to update skills.");
      if (skillList.length) {
        const { error: skillError } = await supabase.from("candidate_skills").insert(skillList.map((skill) => ({ user_id: user.id, skill })));
        if (skillError) throw new Error("Unable to update skills.");
      }

      const { data: existingEducation } = await supabase.from("candidate_education").select("id").eq("user_id", user.id);
      const keptIds = new Set(educationRows.flatMap((row) => row.id ? [row.id] : []));
      const idsToDelete = (existingEducation ?? []).map((row) => row.id).filter((id) => !keptIds.has(id));
      if (idsToDelete.length) {
        const { error: educationDeleteError } = await supabase.from("candidate_education").delete().in("id", idsToDelete);
        if (educationDeleteError) throw new Error("Unable to update education.");
      }

      if (educationRows.length) {
        const payload = educationRows.map((row) => ({
          ...(row.id ? { id: row.id } : {}),
          user_id: user.id,
          institution: row.institution.trim(),
          degree: row.degree.trim() || null,
          field_of_study: row.field_of_study.trim() || null,
          start_year: row.start_year,
          end_year: row.currently_studying ? null : row.end_year,
          currently_studying: row.currently_studying,
        }));
        const { data: savedEducation, error: educationError } = await supabase.from("candidate_education").upsert(payload).select("id, institution, degree, field_of_study, start_year, end_year, currently_studying");
        if (educationError) throw new Error("Unable to update education.");
        setEducation((savedEducation ?? []).map((row) => ({
          id: row.id,
          institution: row.institution ?? "",
          degree: row.degree ?? "",
          field_of_study: row.field_of_study ?? "",
          start_year: row.start_year ?? null,
          end_year: row.end_year ?? null,
          currently_studying: Boolean(row.currently_studying),
        })));
      } else {
        setEducation([]);
      }

      setCandidate((current) => ({ ...current, resume_path: resumePath, preferences: nextPreferences }));
      setResume(null);
      setMessage("Profile saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className={styles.page}><div className="container" style={{ padding: "80px 0" }}><p className={styles.muted}>Loading your profile…</p></div></main>;

  return <main className={styles.page}>
    <nav className={`container ${styles.nav}`}>
      <Link className={styles.brand} href="/" aria-label="Avenlo home">AVENLO</Link>
      <div className={styles.navActions}><Link className="btn" href="/dashboard">Dashboard</Link></div>
    </nav>

    <section className={`container ${styles.hero}`} style={{ maxWidth: 960 }}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>CANDIDATE PROFILE</span>
        <h1>Your professional profile.</h1>
        <p>Give Avenlo the context it needs to understand your experience, strengths and direction — so recommendations can be more relevant.</p>
      </div>

      <form className={styles.form} onSubmit={save}>
        <section className={styles.section}>
          <div className={styles.sectionHead}><div><span className={styles.eyebrow}>ABOUT YOU</span><h2>Profile basics</h2></div></div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>Full name<input className={styles.input} required value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></label>
            <label className={styles.field}>Phone<input className={styles.input} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
            <label className={styles.field}>Professional headline<input className={styles.input} value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="e.g. Product Manager — B2B SaaS" /></label>
            <label className={styles.field}>Location<input className={styles.input} value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Hyderabad, India" /></label>
            <label className={`${styles.field} ${styles.fieldFull}`}>Professional summary<textarea className={styles.textarea} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about your professional strengths, focus and direction." /></label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><span className={styles.eyebrow}>CAREER</span><h2>Career context</h2></div></div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>Years of experience<input className={styles.input} type="number" min="0" max="60" step="0.5" value={candidate.experience_years ?? ""} onChange={(e) => setCandidate({ ...candidate, experience_years: e.target.value ? Number(e.target.value) : null })} /></label>
            <label className={styles.field}>Seniority<select className={styles.select} value={candidate.seniority} onChange={(e) => setCandidate({ ...candidate, seniority: e.target.value })}><option value="">Select seniority</option><option>Entry level</option><option>Junior</option><option>Mid-level</option><option>Senior</option><option>Lead</option><option>Manager</option><option>Director</option><option>Executive</option></select></label>
            <label className={styles.field}>Preferred work mode<select className={styles.select} value={candidate.work_mode} onChange={(e) => setCandidate({ ...candidate, work_mode: e.target.value })}><option value="">Select work mode</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label>
            <label className={styles.field}>Industry<input className={styles.input} value={candidate.industry} onChange={(e) => setCandidate({ ...candidate, industry: e.target.value })} placeholder="Technology, Finance, Healthcare…" /></label>
            <label className={`${styles.field} ${styles.fieldFull}`}>Skills <span className={styles.fieldHint}>comma separated</span><input className={styles.input} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Product Management, SQL" /></label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><span className={styles.eyebrow}>WORK HISTORY</span><h2>Professional experience</h2><p className={styles.sectionCopy}>Add your current and past roles. This information helps Avenlo understand your trajectory and experience level.</p></div><button className={styles.addButton} type="button" onClick={() => setWorkHistory((rows) => [...rows, emptyWork()])}>+ Add role</button></div>
          {workHistory.map((row, index) => (
            <div className={styles.entry} key={row.id}>
              <div className={styles.entryHead}><span className={styles.entryTitle}>Role {index + 1}</span><button className={styles.remove} type="button" onClick={() => setWorkHistory((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button></div>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>Company<input className={styles.input} required value={row.company} onChange={(e) => updateWork(index, { company: e.target.value })} placeholder="Company name" /></label>
                <label className={styles.field}>Job title<input className={styles.input} required value={row.title} onChange={(e) => updateWork(index, { title: e.target.value })} placeholder="Software Engineer" /></label>
                <label className={styles.field}>Location<input className={styles.input} value={row.location} onChange={(e) => updateWork(index, { location: e.target.value })} placeholder="Bengaluru, India" /></label>
                <label className={styles.field}>Start year<select className={styles.select} value={row.start_year ?? ""} onChange={(e) => updateWork(index, { start_year: e.target.value ? Number(e.target.value) : null })}><option value="">Select year</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
                <label className={styles.field}>End year<select className={styles.select} disabled={row.currently_working} value={row.end_year ?? ""} onChange={(e) => updateWork(index, { end_year: e.target.value ? Number(e.target.value) : null })}><option value="">Select year</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
                <label className={styles.checkRow}><input type="checkbox" checked={row.currently_working} onChange={(e) => updateWork(index, { currently_working: e.target.checked, end_year: e.target.checked ? null : row.end_year })} /> I currently work here</label>
                <label className={`${styles.field} ${styles.fieldFull}`}>What did you do? <span className={styles.fieldHint}>Optional</span><textarea className={styles.textarea} value={row.description} onChange={(e) => updateWork(index, { description: e.target.value })} placeholder="Key responsibilities, products, achievements or impact." /></label>
              </div>
            </div>
          ))}
          {!workHistory.length ? <div className={styles.empty}>No work history added yet. Add your current role or previous jobs so Avenlo can understand your experience more accurately.</div> : null}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><span className={styles.eyebrow}>EDUCATION</span><h2>Education history</h2></div><button className={styles.addButton} type="button" onClick={() => setEducation((rows) => [...rows, emptyEducation()])}>+ Add education</button></div>
          {education.map((row, index) => (
            <div className={styles.entry} key={row.id ?? `new-${index}`}>
              <div className={styles.entryHead}><span className={styles.entryTitle}>Education {index + 1}</span><button className={styles.remove} type="button" onClick={() => setEducation((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button></div>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>Institution<input className={styles.input} required value={row.institution} onChange={(e) => updateEducation(index, { institution: e.target.value })} placeholder="University / College" /></label>
                <label className={styles.field}>Degree<input className={styles.input} value={row.degree} onChange={(e) => updateEducation(index, { degree: e.target.value })} placeholder="B.Sc. Computer Science" /></label>
                <label className={styles.field}>Field of study<input className={styles.input} value={row.field_of_study} onChange={(e) => updateEducation(index, { field_of_study: e.target.value })} /></label>
                <label className={styles.field}>Start year<select className={styles.select} value={row.start_year ?? ""} onChange={(e) => updateEducation(index, { start_year: e.target.value ? Number(e.target.value) : null })}><option value="">Select year</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
                <label className={styles.field}>End year<select className={styles.select} disabled={row.currently_studying} value={row.end_year ?? ""} onChange={(e) => updateEducation(index, { end_year: e.target.value ? Number(e.target.value) : null })}><option value="">Select year</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
                <label className={styles.checkRow}><input type="checkbox" checked={row.currently_studying} onChange={(e) => updateEducation(index, { currently_studying: e.target.checked, end_year: e.target.checked ? null : row.end_year })} /> Currently studying</label>
              </div>
            </div>
          ))}
          {!education.length ? <div className={styles.empty}>Add your degree, college and field of study so matching can use education as a signal.</div> : null}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><span className={styles.eyebrow}>RESUME</span><h2>CV / Resume</h2></div></div>
          <div className={styles.resumeBox}>
            <input className={styles.file} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setResume(e.target.files?.[0] ?? null)} />
            {candidate.resume_path ? <p className={styles.muted}>A CV is already stored securely. Upload a new one only if you want to replace it.</p> : <p className={styles.muted}>Upload a PDF, DOC or DOCX up to 10 MB.</p>}
          </div>
        </section>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {message ? <p className={styles.notice} role="status">{message}</p> : null}
        <div className={styles.actions}><button className={styles.save} type="submit" disabled={saving}>{saving ? "Saving profile…" : "Save profile"}</button><Link className="btn" href="/dashboard">Back to dashboard</Link></div>
      </form>
    </section>
  </main>;
}
