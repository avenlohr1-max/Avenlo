import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../tools.module.css";

const tracks = [
  { title: "Product analytics foundation", category: "Product & strategy", skills: ["sql", "analytics", "product"], format: "Short course + project", outcome: "Turn product questions into measurable decisions." },
  { title: "Modern web engineering", category: "Engineering & data", skills: ["react", "javascript", "typescript", "next"], format: "Project-based learning", outcome: "Strengthen production engineering depth and portfolio evidence." },
  { title: "Data analysis for business", category: "Business & operations", skills: ["excel", "sql", "data", "finance"], format: "Course + applied exercises", outcome: "Build stronger evidence for analytical and operations roles." },
  { title: "UX research & product design", category: "Design & creative", skills: ["ux", "ui", "figma", "research"], format: "Workshop + case study", outcome: "Build research and design evidence around real user problems." },
];

export default async function CourseAdviserPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const [{ data: skills }, { data: candidate }, { data: profile }] = await Promise.all([supabase.from("candidate_skills").select("skill").eq("user_id", user.id), supabase.from("candidate_profiles").select("industry, seniority, experience_years, preferences").eq("user_id", user.id).maybeSingle(), supabase.from("profiles").select("headline").eq("id", user.id).maybeSingle()]);
  const names = (skills ?? []).map((item) => item.skill.toLowerCase());
  const ranked = tracks.map((track) => ({ ...track, match: track.skills.filter((skill) => names.some((name) => name.includes(skill))).length })).sort((a, b) => b.match - a.match);
  const recommended = ranked[0];
  const reason = recommended?.match ? `This path connects to ${recommended.match} skill signal${recommended.match === 1 ? "" : "s"} already on your profile, so it can build on what you know rather than starting from zero.` : "Your profile does not have enough skill signal yet, so the first recommendation is to add your core skills before choosing a learning path.";
  return <main className={styles.page}><nav className={styles.nav}><Link href="/dashboard"><span className="brand-lockup brand-lockup--compact"><span className="brand-copy"><span className="brand-wordmark">AVENLO</span></span></span></Link><div className={styles.navLinks}><Link href="/dashboard">Overview</Link><Link href="/dashboard/resume">Resume</Link><Link href="/dashboard/skills">Skills</Link><Link href="/dashboard/profile">Profile</Link></div></nav>
    <div className={styles.container}><Link className={styles.back} href="/dashboard">← Back to dashboard</Link><header className={styles.header}><div><span className={styles.eyebrow}>COURSE ADVISER</span><h1>Build the next useful skill.</h1><p>Learning guidance should follow your career direction. Avenlo uses your existing skill signals and context to prioritise a small number of relevant paths.</p></div></header>
      <section className={styles.card}><span className={styles.pill}>TOP GUIDANCE</span><h2 style={{ marginTop: 14 }}>{recommended?.title ?? "Complete your skills profile first"}</h2><p>{reason}</p>{recommended ? <div className={styles.grid} style={{ marginTop: 18 }}><div><div className={styles.metric}><span>Format</span><strong>{recommended.format}</strong></div><div className={styles.metric}><span>Current fit</span><strong>{recommended.match} matching signals</strong></div></div><div><div className={styles.notice}><strong>{recommended.outcome}</strong><br />This is guidance to help your Avenlo career review, not a sponsored course recommendation.</div></div></div> : null}</section>
      <div className={styles.list}>{ranked.map((track) => <article className={styles.item} key={track.title}><div className={styles.itemTop}><div><h3>{track.title}</h3><p>{track.outcome}</p></div><span className={styles.pill}>{track.match} signal{track.match === 1 ? "" : "s"}</span></div><div className={styles.progressRow}><div className={styles.progressRowTop}><span>{track.category}</span><span>{Math.min(100, track.match * 25)}%</span></div><div className={styles.bar}><span style={{ width: `${Math.min(100, track.match * 25)}%` }} /></div></div></article>)}</div>
      <section className={styles.card} style={{ marginTop: 16 }}><h2>Make the advice more specific</h2><p>{profile?.headline ? `Your current headline is “${profile.headline}”.` : "Add a professional headline."} {candidate?.industry ? `Your industry is ${candidate.industry}.` : "Add an industry."} {candidate?.seniority ? `Your seniority is ${candidate.seniority}.` : "Add seniority."}</p><div className={styles.actions}><Link className="btn btn--primary btn--small" href="/dashboard/profile">Improve profile signals</Link><Link className="btn btn--small" href="/dashboard/recommendations">See recommendation workflow</Link></div></section>
    </div></main>;
}
