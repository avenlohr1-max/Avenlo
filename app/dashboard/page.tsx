import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/app/components/brand-logo";
import { SignOutButton } from "@/app/components/sign-out-button";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: candidate }, { data: skills }, { data: education }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, status, headline, location").eq("id", user.id).maybeSingle(),
    supabase.from("candidate_profiles").select("resume_path, experience_years, seniority, work_mode, industry, preferences").eq("user_id", user.id).maybeSingle(),
    supabase.from("candidate_skills").select("skill").eq("user_id", user.id).order("skill"),
    supabase.from("candidate_education").select("id, institution, degree, field_of_study, start_year, end_year, currently_studying").eq("user_id", user.id).order("start_year", { ascending: false }),
  ]);

  if (profile?.role === "company") redirect("/company");
  if (profile?.role === "staff" || profile?.role === "founder") redirect("/staff");

  const skillCount = skills?.length ?? 0;
  const hasResume = Boolean(candidate?.resume_path);
  const workHistory = Array.isArray(candidate?.preferences?.work_history) ? candidate.preferences.work_history : [];
  const targetRoles = Array.isArray(candidate?.preferences?.target_roles) ? candidate.preferences.target_roles : [];
  const profileChecks = [
    Boolean(profile?.full_name), Boolean(profile?.headline), Boolean(candidate?.industry), skillCount > 0,
    (education?.length ?? 0) > 0, workHistory.length > 0, hasResume,
  ];
  const completion = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);
  const ready = completion >= 80;

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <BrandLogo compact />
          <nav className={styles.nav} aria-label="Candidate navigation">
            <Link className={styles.activeNav} href="/dashboard">Overview</Link>
            <Link href="/dashboard/profile">My profile</Link>
            <Link href="/dashboard/recommendations">Recommendations</Link>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>YOUR AVENLO WORKSPACE</div>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.welcomeLine}><span className={styles.liveDot} /> Candidate workspace</div>
              <h1>{profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}.` : "Welcome to Avenlo."}</h1>
              <p>Build a stronger career signal once. Avenlo uses it to understand your strengths, recommend learning and surface relevant opportunities for you.</p>
              <div className={styles.heroActions}>
                <Link className="btn btn--primary" href="/dashboard/profile">{completion < 100 ? "Complete my profile" : "Review my profile"}</Link>
                <Link className="btn" href="/dashboard/recommendations">See how recommendations work</Link>
              </div>
            </div>
            <div className={styles.readiness}>
              <div className={styles.readinessTop}><span>PROFILE READINESS</span><strong>{completion}%</strong></div>
              <div className={styles.progress}><span style={{ width: `${completion}%` }} /></div>
              <p>{ready ? "Your profile has enough signal for meaningful Avenlo recommendations." : "A few more details will make Avenlo's recommendations more useful."}</p>
              <Link href="/dashboard/profile">{ready ? "Review your profile →" : "Finish your profile →"}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>CAREER INTELLIGENCE</span><h2>Your career toolkit</h2></div>
          <p>Three practical tools help you improve the signal Avenlo uses. Automated checks support the team; human judgement stays at the centre.</p>
        </div>

        <div className={styles.toolGrid}>
          <Link href="/dashboard/resume" className={`${styles.tool} ${styles.toolFeatured}`}>
            <span className={styles.toolIcon}>CV</span><span className={styles.toolLabel}>RESUME CHECKER</span>
            <h3>{hasResume ? "Review your resume signal" : "Upload and check your resume"}</h3>
            <p>{hasResume ? "See a readiness score and the profile signals that can make your resume easier to match." : "Upload your latest CV and run Avenlo's first-pass readiness check."}</p>
            <span className={styles.toolLink}>{hasResume ? "Run checker →" : "Upload resume →"}</span>
          </Link>
          <Link href="/dashboard/skills" className={styles.tool}>
            <span className={styles.toolIcon}>SK</span><span className={styles.toolLabel}>SKILLS CHECKER</span>
            <h3>{skillCount ? `${skillCount} skills on file` : "Understand your skill profile"}</h3>
            <p>See your strengths, skill coverage and the areas worth developing next for your target direction.</p>
            <span className={styles.toolLink}>Check my skills →</span>
          </Link>
          <Link href="/dashboard/courses" className={styles.tool}>
            <span className={styles.toolIcon}>LP</span><span className={styles.toolLabel}>COURSE ADVISER</span>
            <h3>Build your next learning step</h3>
            <p>Get focused learning paths based on your current skills, experience and career direction — not a generic course list.</p>
            <span className={styles.toolLink}>Get learning guidance →</span>
          </Link>
        </div>

        <div className={styles.mainGrid}>
          <article className={styles.panel}>
            <div className={styles.panelTop}><div><span className={styles.eyebrow}>RECOMMENDATIONS</span><h2>We bring opportunities to you.</h2></div><span className={styles.badge}>NO JOB BOARD</span></div>
            <div className={styles.recommendationBox}>
              <div className={styles.recommendationIcon}>A</div>
              <div><h3>Avenlo works behind the scenes.</h3><p>We use your profile, resume and skills to identify relevant opportunities. You do not need to browse jobs or manage applications here.</p><div className={styles.chips}><span>Understand</span><span>Recommend</span><span>Connect</span></div></div>
            </div>
            <Link className={styles.textLink} href="/dashboard/recommendations">Explore the recommendation workflow →</Link>
          </article>
          <aside className={styles.panel}>
            <span className={styles.eyebrow}>PROFILE SIGNAL</span><h2>What Avenlo knows</h2>
            <div className={styles.signalList}>
              <Signal label="Basic profile" done={Boolean(profile?.full_name && profile?.headline)} />
              <Signal label="Resume" done={hasResume} />
              <Signal label="Skills" done={skillCount > 0} value={skillCount ? `${skillCount}` : "Add"} />
              <Signal label="Education" done={(education?.length ?? 0) > 0} value={education?.length ? `${education.length}` : "Add"} />
              <Signal label="Experience" done={workHistory.length > 0} value={workHistory.length ? `${workHistory.length} roles` : "Add"} />
              <Signal label="Career direction" done={Boolean(candidate?.industry || targetRoles.length)} />
            </div>
            <Link className={styles.textLink} href="/dashboard/profile">Edit profile →</Link>
          </aside>
        </div>

        <div className={styles.nextGrid}>
          <article className={styles.panel}><span className={styles.eyebrow}>WHAT HAPPENS NEXT</span><h2>One profile. A better next step.</h2><div className={styles.stepList}><Step number="01" title="Understand" copy="Avenlo reviews your experience, skills, education and career direction." /><Step number="02" title="Recommend" copy="We surface relevant opportunities and learning actions instead of asking you to search." /><Step number="03" title="Connect" copy="When there is a strong fit, the Avenlo team guides the next step with you." /></div></article>
          <article className={`${styles.panel} ${styles.dark}`}><span className={styles.eyebrow}>THE AVENLO PRINCIPLE</span><h2>Technology supports the decision. People make it.</h2><p>Your data helps Avenlo work faster. Human judgement remains responsible for the recommendation and the relationship.</p><Link className={styles.darkLink} href="/dashboard/recommendations">Learn how matching works →</Link></article>
        </div>
      </section>
    </main>
  );
}

function Signal({ label, done, value }: { label: string; done: boolean; value?: string }) {
  return <div className={styles.signalRow}><span className={`${styles.check} ${done ? styles.checkDone : ""}`}>{done ? "✓" : "·"}</span><span>{label}</span><strong>{value ?? (done ? "Done" : "Add")}</strong></div>;
}
function Step({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className={styles.step}><span>{number}</span><div><strong>{title}</strong><p>{copy}</p></div></div>;
}
