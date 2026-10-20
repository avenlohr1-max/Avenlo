import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../tools.module.css";
import EvidenceLinks from "./evidence-links";

const skillGroups: Record<string, string[]> = { "Product & strategy": ["product", "roadmap", "strategy", "analytics", "research", "sql", "figma", "stakeholder"], "Engineering & data": ["javascript", "typescript", "react", "next", "node", "python", "java", "sql", "aws", "docker", "data", "machine learning", "git"], "Business & operations": ["sales", "crm", "operations", "excel", "finance", "marketing", "project management", "communication"], "Design & creative": ["figma", "ux", "ui", "design", "photoshop", "illustrator", "research", "branding"] };

type ResumeAnalysis = { detectedSkills?: unknown; analyzedAt?: unknown; fileName?: unknown };
type CandidatePreferences = { resume_analysis?: ResumeAnalysis } | null;

function readResumeAnalysis(value: unknown): ResumeAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const analysis = (value as CandidatePreferences)?.resume_analysis;
  return analysis && typeof analysis === "object" ? analysis : null;
}

function readDetectedSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))];
}

export default async function SkillsCheckerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: skills }, { data: candidate }] = await Promise.all([
    supabase.from("candidate_skills").select("skill").eq("user_id", user.id).order("skill"),
    supabase.from("candidate_profiles").select("industry, seniority, preferences").eq("user_id", user.id).maybeSingle(),
  ]);

  const recordedSkills = (skills ?? []).map((item) => item.skill.trim()).filter(Boolean);
  const recordedKeys = new Set(recordedSkills.map((skill) => skill.toLocaleLowerCase()));
  const analysis = readResumeAnalysis(candidate?.preferences);
  const detectedSkills = readDetectedSkills(analysis?.detectedSkills);
  const detectedOnly = detectedSkills.filter((skill) => !recordedKeys.has(skill.toLocaleLowerCase()));
  const names = recordedSkills.map((skill) => skill.toLocaleLowerCase());
  const groups = Object.entries(skillGroups).map(([name, keywords]) => ({
    name,
    count: names.filter((skill) => keywords.some((keyword) => skill.includes(keyword))).length,
  })).sort((a, b) => b.count - a.count);
  const coverage = Math.min(100, Math.round((recordedSkills.length / 10) * 100));

  return <main className={styles.page}>
    <nav className={styles.nav}>
      <Link href="/dashboard"><span className="brand-lockup brand-lockup--compact"><span className="brand-copy"><span className="brand-wordmark">AVENLO</span></span></span></Link>
      <div className={styles.navLinks}><Link href="/dashboard">Overview</Link><Link href="/dashboard/resume">Resume</Link><Link href="/dashboard/courses">Courses</Link><Link href="/dashboard/profile">Profile</Link></div>
    </nav>
    <div className={styles.container}>
      <Link className={styles.back} href="/dashboard">← Back to dashboard</Link>
      <header className={styles.header}><div><span className={styles.eyebrow}>CAPABILITY ATLAS · FIRST REVIEW SLICE</span><h1>Review the skills in your record.</h1><p>See what is already on your Talent Record separately from terms found in your resume. A detected term is a starting point to review; it does not prove a capability by itself.</p></div></header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Skills on your Talent Record</h2>
          <p>These are the skills currently saved to your profile. Edit or remove anything that does not describe you.</p>
          {recordedSkills.length ? <div className={styles.list}>{recordedSkills.map((skill) => <div className={styles.item} key={skill}><div className={styles.itemTop}><h3>{skill}</h3><span className={styles.pill}>On record</span></div></div>)}</div> : <p>No skills are recorded yet. Add the ones you want represented on your Talent Record.</p>}
          <div className={styles.actions}><Link className="btn btn--primary btn--small" href="/dashboard/profile">Review or edit skills</Link></div>
        </section>

        <section className={styles.card}>
          <h2>Terms detected in your resume</h2>
          {analysis ? <>
            <p>These words or phrases appeared in the latest resume analysis. They have not been confirmed by you or linked to a specific work example.</p>
            {detectedSkills.length ? <div className={styles.list}>{detectedSkills.map((skill) => <div className={styles.item} key={skill}><div className={styles.itemTop}><h3>{skill}</h3><span className={styles.pill}>{recordedKeys.has(skill.toLocaleLowerCase()) ? "Also on record" : "Review term"}</span></div></div>)}</div> : <p>No skill terms were detected. You can still add or correct skills from your Talent Record.</p>}
            <p className={styles.notice}>{typeof analysis.fileName === "string" ? `Source: ${analysis.fileName}. ` : ""}{typeof analysis.analyzedAt === "string" ? `Analyzed ${new Date(analysis.analyzedAt).toLocaleDateString()}. ` : ""}Resume mentions are not evidence of proficiency. Review the terms before relying on them.</p>
          </> : <p>No resume analysis is available yet. Add a resume from your Talent Record to see detected terms here.</p>}
          <div className={styles.actions}><Link className="btn btn--small" href="/dashboard/profile">Open Talent Record</Link><Link className="btn btn--small" href="/dashboard/resume">Resume review</Link></div>
        </section>
      </div>

      <div className={styles.grid} style={{ marginTop: 16 }}>
        <section className={styles.card}>
          <h2>Capability coverage</h2>
          <p>This is a count of skills on your record, not a rating of ability or confidence.</p>
          <div className={styles.score} style={{ ["--score" as string]: `${coverage * 3.6}deg` }}><strong>{recordedSkills.length}</strong><span>ON RECORD</span></div>
          <div className={styles.metricList}><div className={styles.metric}><span>Industry</span><strong>{candidate?.industry || "Not added"}</strong></div><div className={styles.metric}><span>Seniority</span><strong>{candidate?.seniority || "Not added"}</strong></div><div className={styles.metric}><span>Resume terms to review</span><strong>{detectedOnly.length}</strong></div></div>
        </section>
        <section className={styles.card}>
          <h2>Recorded skill areas</h2>
          <p>These groups are broad navigation aids. They do not indicate proficiency.</p>
          <div className={styles.list}>{groups.map((group) => <div className={styles.item} key={group.name}><div className={styles.itemTop}><h3>{group.name}</h3><span className={styles.pill}>{group.count} on record</span></div></div>)}</div>
        </section>
      </div>
      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>What this first slice does</h2>
        <div className={styles.checkList}>
          <div className={styles.checkItem}><span className={styles.checkIcon}>1</span><div><strong>Separates source from record</strong><span>Saved profile skills and resume-detected terms are shown as different things.</span></div></div>
          <div className={styles.checkItem}><span className={styles.checkIcon}>2</span><div><strong>Keeps uncertainty visible</strong><span>Resume extraction is a prompt for review, not a proof or automated judgment.</span></div></div>
          <div className={styles.checkItem}><span className={styles.checkIcon}>3</span><div><strong>Leaves correction with the candidate</strong><span>Use the Talent Record to correct or remove skills before relying on them.</span></div></div>
        </div>
      </section>
      <EvidenceLinks />
    </div>
  </main>;
}