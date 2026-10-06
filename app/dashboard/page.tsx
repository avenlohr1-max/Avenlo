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

  const [{ data: profile }, { data: candidate }, { data: skills }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, status").eq("id", user.id).maybeSingle(),
    supabase.from("candidate_profiles").select("resume_path, experience_years, seniority, work_mode, industry").eq("user_id", user.id).maybeSingle(),
    supabase.from("candidate_skills").select("skill").eq("user_id", user.id).order("skill"),
  ]);

  if (profile?.role === "company") redirect("/company");
  if (profile?.role === "staff" || profile?.role === "founder") redirect("/staff");

  const skillCount = skills?.length ?? 0;
  const hasResume = Boolean(candidate?.resume_path);
  const hasProfileSignals = Boolean(
    profile?.full_name &&
      candidate?.experience_years != null &&
      candidate?.seniority &&
      candidate?.industry &&
      skillCount > 0,
  );

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <BrandLogo compact />
          <nav className={styles.nav} aria-label="Candidate navigation">
            <Link href="/dashboard">Overview</Link>
            <Link href="/dashboard/profile">My profile</Link>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>YOUR AVENLO WORKSPACE</div>
          <div className={styles.heroRow}>
            <div>
              <h1>{profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}.` : "Welcome to Avenlo."}</h1>
              <p>Avenlo helps you strengthen your profile, understand your skills and receive relevant opportunities. You do not need to hunt through job boards — we focus on finding and recommending the right opportunities for you.</p>
            </div>
            <div className={styles.status}>
              <span className={`${styles.statusDot} ${hasProfileSignals ? styles.statusDotReady : ""}`} />
              <div>
                <strong>{hasProfileSignals ? "Profile ready for matching" : "Profile needs a little more detail"}</strong>
                <span>{hasProfileSignals ? "Avenlo can use your profile for human-led recommendations." : "Complete your profile to improve the quality of recommendations."}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>CAREER INTELLIGENCE</span>
            <h2>Your career toolkit</h2>
          </div>
          <p>Practical guidance first. Automated signals support the Avenlo team — they do not replace human judgment.</p>
        </div>

        <div className={styles.toolGrid}>
          <article className={`${styles.tool} ${styles.toolFeatured}`}>
            <div className={styles.icon}>CV</div>
            <div>
              <span className={styles.toolLabel}>RESUME CHECKER</span>
              <h3>{hasResume ? "Your resume is on file" : "Strengthen your resume"}</h3>
              <p>{hasResume ? "Your resume is securely stored. Review it with Avenlo to improve clarity, evidence and role alignment." : "Upload your latest resume so Avenlo can use it as part of your career review."}</p>
            </div>
            <div className={styles.toolButton}><Link className="btn btn--primary btn--small" href="/dashboard/profile">{hasResume ? "Review resume" : "Upload resume"}</Link></div>
            <span className={styles.toolStatus}>{hasResume ? "READY" : "ACTION NEEDED"}</span>
          </article>

          <article className={styles.tool}>
            <div className={styles.icon}>SK</div>
            <div>
              <span className={styles.toolLabel}>SKILLS CHECKER</span>
              <h3>{skillCount ? `${skillCount} skills in your profile` : "Build your skills profile"}</h3>
              <p>{skillCount ? "Keep your skills current so Avenlo can understand your strengths and identify useful development areas." : "Add your core skills so Avenlo can build a more useful picture of your strengths."}</p>
            </div>
            <div className={styles.toolButton}><Link className="btn btn--small" href="/dashboard/profile">{skillCount ? "Update skills" : "Add skills"}</Link></div>
          </article>

          <article className={styles.tool}>
            <div className={styles.icon}>LP</div>
            <div>
              <span className={styles.toolLabel}>COURSE ADVISER</span>
              <h3>Build your next learning step</h3>
              <p>Avenlo will use your skills, experience and career direction to guide learning recommendations instead of sending you a generic course list.</p>
            </div>
            <div className={styles.toolButton}><Link className="btn btn--small" href="/dashboard/profile">Improve profile signals</Link></div>
          </article>
        </div>

        <div className={styles.mainGrid}>
          <article className={styles.panel}>
            <div className={styles.panelTop}>
              <div><span className={styles.eyebrow}>OPPORTUNITIES</span><h2>Avenlo recommendations</h2></div>
              <span className={styles.badge}>HUMAN-LED</span>
            </div>
            <div className={styles.empty}>
              <div className={styles.emptyOrb} aria-hidden="true">A</div>
              <div>
                <h3>We bring the opportunities to you</h3>
                <p>Once your profile has enough signal, the Avenlo team can surface opportunities that fit your experience and preferences. There is no job-board browsing step.</p>
                <Link className="btn btn--primary btn--small" href="/dashboard/profile">Complete my profile</Link>
              </div>
            </div>
          </article>

          <aside className={styles.panel}>
            <span className={styles.eyebrow}>PROFILE SIGNAL</span>
            <h2>Make your profile easier to match</h2>
            <div className={styles.signalList}>
              <div className={styles.signalRow}><span className={`${styles.check} ${profile?.full_name ? styles.checkDone : ""}`}>✓</span><span>Basic identity</span><strong>{profile?.full_name ? "Done" : "Add"}</strong></div>
              <div className={styles.signalRow}><span className={`${styles.check} ${hasResume ? styles.checkDone : ""}`}>✓</span><span>Resume</span><strong>{hasResume ? "Done" : "Add"}</strong></div>
              <div className={styles.signalRow}><span className={`${styles.check} ${skillCount ? styles.checkDone : ""}`}>✓</span><span>Skills</span><strong>{skillCount ? `${skillCount}` : "Add"}</strong></div>
              <div className={styles.signalRow}><span className={`${styles.check} ${candidate?.industry ? styles.checkDone : ""}`}>✓</span><span>Career context</span><strong>{candidate?.industry ? "Done" : "Add"}</strong></div>
            </div>
            <Link className={styles.link} href="/dashboard/profile">Edit profile →</Link>
          </aside>
        </div>

        <div className={styles.bottomGrid}>
          <article className={`${styles.panel} ${styles.bottomPanel}`}>
            <span className={styles.eyebrow}>WHAT HAPPENS NEXT</span>
            <h2>Avenlo works behind the scenes.</h2>
            <div className={styles.stepList}>
              <div className={styles.step}><span>01</span><div><strong>Understand</strong><p>We review your profile, resume, skills and career direction.</p></div></div>
              <div className={styles.step}><span>02</span><div><strong>Recommend</strong><p>We identify relevant opportunities and learning actions for you.</p></div></div>
              <div className={styles.step}><span>03</span><div><strong>Connect</strong><p>When there is a strong fit, Avenlo guides the next step with you.</p></div></div>
            </div>
          </article>
          <article className={`${styles.panel} ${styles.bottomPanel} ${styles.dark}`}>
            <span className={styles.eyebrow}>THE AVENLO PRINCIPLE</span>
            <h2>Technology supports the decision. People make it.</h2>
            <p>Your profile and automated signals help us work faster, while human judgment stays at the centre of every recommendation.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
