import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/app/components/brand-logo";
import { SignOutButton } from "@/app/components/sign-out-button";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

const products = [
  { number: "01", title: "Talent Record", detail: "Your experience, projects and direction.", href: "/dashboard/profile", icon: "TR", status: "Build your record" },
  { number: "02", title: "Signal Ledger", detail: "Make important claims easier to verify.", href: "/dashboard/resume", icon: "SL", status: "Add evidence" },
  { number: "03", title: "Capability Atlas", detail: "Understand what your experience demonstrates.", href: "/dashboard/skills", icon: "CA", status: "Explore capabilities" },
  { number: "04", title: "Career Scenario Lab", detail: "Compare possible next steps.", href: "/dashboard/recommendations", icon: "CS", status: "Explore direction" },
  { number: "05", title: "Opportunity Intelligence", detail: "Review opportunities with context.", href: "/dashboard/applications", icon: "OI", status: "View opportunities" },
  { number: "08", title: "Proof Studio", detail: "Turn practical work into reusable evidence.", href: "/dashboard/resume", icon: "PS", status: "Build proof" },
];

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
  const profileChecks = [Boolean(profile?.full_name), Boolean(profile?.headline), Boolean(candidate?.industry), skillCount > 0, (education?.length ?? 0) > 0, workHistory.length > 0, hasResume];
  const completion = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const completedSignals = profileChecks.filter(Boolean).length;

  return (
    <main className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.brand}><BrandLogo compact /></Link>
        <span className={styles.sideLabel}>WORKSPACE</span>
        <nav className={styles.sideNav} aria-label="Candidate workspace">
          <Link className={styles.sideActive} href="/dashboard"><span>⌂</span>Overview</Link>
          <Link href="/dashboard/profile"><span>◫</span>Talent Record</Link>
          <Link href="/dashboard/skills"><span>◇</span>Capability Atlas</Link>
          <Link href="/dashboard/resume"><span>▤</span>Evidence & resume</Link>
          <Link href="/dashboard/recommendations"><span>✳</span>Career direction</Link>
          <Link href="/dashboard/applications"><span>↗</span>Opportunities</Link>
          <Link href="/dashboard/courses"><span>＋</span>Learning</Link>
          <Link href="/pricing"><span>◎</span>Human services</Link>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.humanNote}><span className={styles.noteMark}>A</span><strong>Human judgment stays central.</strong><p>Avenlo makes the evidence clearer. People make the decisions.</p></div>
          <SignOutButton />
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div><span className={styles.breadcrumb}>YOUR WORKSPACE</span><span className={styles.breadcrumbDivider}>/</span><span>Overview</span></div>
          <div className={styles.topActions}><span className={styles.privatePill}><i /> Private workspace</span><Link href="/dashboard/profile" className="btn btn--small">Edit profile ↗</Link></div>
        </header>

        <section className={styles.welcome}>
          <div className={styles.welcomeCopy}>
            <span className={styles.eyebrow}>TALENT INTELLIGENCE, MADE PERSONAL</span>
            <h1>{firstName ? <>Good to see you, <span>{firstName}.</span></> : <>Your potential deserves <span>better context.</span></>}</h1>
            <p>Build a richer picture of what you can do, what you want next, and which opportunities are worth your attention.</p>
            <div className={styles.welcomeActions}>
              <Link className="btn btn--primary" href="/dashboard/profile">{completion < 100 ? "Continue your Talent Record" : "Review your Talent Record"} <span>→</span></Link>
              <Link className={styles.quietLink} href="/dashboard/recommendations">Explore career direction</Link>
            </div>
          </div>
          <div className={styles.progressCard}>
            <div className={styles.progressHeading}><span>YOUR TALENT RECORD</span><span className={styles.progressNumber}>{completion}<small>%</small></span></div>
            <div className={styles.progressTrack} role="progressbar" aria-label="Talent Record completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}><span style={{ width: `${completion}%` }} /></div>
            <div className={styles.progressFoot}><span>{completedSignals} of {profileChecks.length} signal groups added</span><Link href="/dashboard/profile">Improve record ↗</Link></div>
            <div className={styles.progressHint}>{completion >= 80 ? "A strong starting point. Keep evidence current as your work evolves." : "A few focused details can make your professional story clearer."}</div>
          </div>
        </section>

        <section className={styles.metrics} aria-label="Your workspace at a glance">
          <article className={styles.metricCard}><span className={styles.metricIcon}>◇</span><div><span>CAPABILITIES ADDED</span><strong>{skillCount}</strong><small>Skills currently on your record</small></div></article>
          <article className={styles.metricCard}><span className={styles.metricIcon}>▤</span><div><span>EXPERIENCE ENTRIES</span><strong>{workHistory.length}</strong><small>Roles or projects captured</small></div></article>
          <article className={styles.metricCard}><span className={styles.metricIcon}>◎</span><div><span>CAREER DIRECTION</span><strong className={styles.metricText}>{targetRoles.length ? "Defined" : "Open"}</strong><small>{targetRoles.length ? targetRoles.slice(0, 2).join(", ") : "Add roles you want to explore"}</small></div></article>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHead}><div><span className={styles.eyebrow}>YOUR INTELLIGENCE TOOLS</span><h2>A more complete picture of you.</h2><p>One connected workspace. Each product adds context to the next.</p></div><Link className={styles.quietLink} href="/dashboard/profile">View full record ↗</Link></div>
          <div className={styles.productGrid}>
            {products.map((product, i) => <Link href={product.href} className={`${styles.productCard} ${i === 0 ? styles.productFeatured : ""}`} key={product.number}>
              <div className={styles.productTop}><span className={styles.productIcon}>{product.icon}</span><span className={styles.productNumber}>{product.number}</span></div>
              <h3>{product.title}</h3><p>{product.detail}</p><span className={styles.productAction}>{product.status} <b>↗</b></span>
            </Link>)}
          </div>
        </section>

        <section className={styles.bottomGrid}>
          <article className={styles.nextCard}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>A GOOD NEXT STEP</span><h2>Strengthen the evidence.</h2></div><span className={styles.stepCount}>01 / 03</span></div>
            <p>Avenlo is most useful when your experience is supported by specific examples. Start with one project or achievement you can explain clearly.</p>
            <div className={styles.nextActions}><Link className="btn btn--primary" href="/dashboard/resume">{hasResume ? "Review your evidence" : "Add your resume"} →</Link><Link className={styles.quietLink} href="/dashboard/skills">Add capabilities</Link></div>
          </article>
          <article className={styles.principleCard}><span className={styles.eyebrow}>THE AVENLO PRINCIPLE</span><div className={styles.principleGlyph}>“</div><h2>Evidence before assumptions.</h2><p>We show what is supported, what is still uncertain, and what you can do next. Your profile is yours to review and improve.</p><Link href="/dashboard/recommendations">How recommendations work ↗</Link></article>
        </section>
        <footer className={styles.footer}><span>AVENLO · TALENT INTELLIGENCE</span><span>Built for human potential, not automated judgment.</span></footer>
      </div>
    </main>
  );
}
