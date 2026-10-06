import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/app/components/sign-out-button";

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
    <main className="candidate-dashboard">
      <header className="candidate-dashboard__header">
        <div className="container candidate-dashboard__header-inner">
          <Link href="/" className="dashboard-brand" aria-label="Avenlo home">
            <span className="dashboard-brand__mark" aria-hidden="true">A</span>
            <span>AVENLO</span>
          </Link>
          <nav className="candidate-dashboard__nav" aria-label="Candidate navigation">
            <Link href="/dashboard">Overview</Link>
            <Link href="/dashboard/profile">My profile</Link>
            <Link href="/dashboard/applications">Applications</Link>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <section className="candidate-dashboard__hero">
        <div className="container">
          <div className="candidate-dashboard__eyebrow">YOUR AVENLO WORKSPACE</div>
          <div className="candidate-dashboard__hero-row">
            <div>
              <h1>{profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}.` : "Welcome to Avenlo."}</h1>
              <p>Avenlo helps you strengthen your profile, understand your skills and receive relevant opportunities. You do not need to hunt through job boards — we focus on finding and recommending the right opportunities for you.</p>
            </div>
            <div className="candidate-dashboard__status">
              <span className={hasProfileSignals ? "status-dot status-dot--ready" : "status-dot"} />
              <div>
                <strong>{hasProfileSignals ? "Profile ready for matching" : "Profile needs a little more detail"}</strong>
                <span>{hasProfileSignals ? "Avenlo can use your profile for human-led recommendations." : "Complete your profile to improve the quality of recommendations."}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="candidate-dashboard__content container">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">CAREER INTELLIGENCE</span>
            <h2>Your career toolkit</h2>
          </div>
          <p>Practical guidance first. Automated signals support the Avenlo team — they do not replace human judgment.</p>
        </div>

        <div className="career-tool-grid">
          <article className="career-tool-card career-tool-card--featured">
            <div className="career-tool-card__icon">CV</div>
            <div className="career-tool-card__body">
              <span className="career-tool-card__label">RESUME CHECKER</span>
              <h3>{hasResume ? "Your resume is on file" : "Strengthen your resume"}</h3>
              <p>{hasResume ? "Your resume is securely stored. The next step is to review its quality and alignment with the direction you want to pursue." : "Upload your latest resume so Avenlo can use it as part of your career review."}</p>
              <Link className="btn btn--primary btn--small" href="/dashboard/profile">{hasResume ? "Review resume" : "Upload resume"}</Link>
            </div>
            <span className="career-tool-card__status">{hasResume ? "READY" : "ACTION NEEDED"}</span>
          </article>

          <article className="career-tool-card">
            <div className="career-tool-card__icon">SK</div>
            <div className="career-tool-card__body">
              <span className="career-tool-card__label">SKILLS CHECKER</span>
              <h3>{skillCount ? `${skillCount} skills in your profile` : "Build your skills profile"}</h3>
              <p>{skillCount ? "Keep your skills current so Avenlo can understand your strengths and identify useful development areas." : "Add your core skills so Avenlo can build a more useful picture of your strengths."}</p>
              <Link className="btn btn--small" href="/dashboard/profile">{skillCount ? "Update skills" : "Add skills"}</Link>
            </div>
          </article>

          <article className="career-tool-card">
            <div className="career-tool-card__icon">LP</div>
            <div className="career-tool-card__body">
              <span className="career-tool-card__label">COURSE ADVISER</span>
              <h3>Build your next learning step</h3>
              <p>Avenlo will use your skills, experience and career direction to guide learning recommendations instead of sending you a generic course list.</p>
              <Link className="btn btn--small" href="/dashboard/profile">Improve profile signals</Link>
            </div>
          </article>
        </div>

        <div className="dashboard-main-grid">
          <article className="dashboard-panel dashboard-panel--recommendations">
            <div className="dashboard-panel__top">
              <div>
                <span className="eyebrow">OPPORTUNITIES</span>
                <h2>Avenlo recommendations</h2>
              </div>
              <span className="panel-badge">HUMAN-LED</span>
            </div>
            <div className="recommendation-empty">
              <div className="recommendation-empty__orb" aria-hidden="true">A</div>
              <div>
                <h3>No recommendations yet</h3>
                <p>Once your profile has enough signal, the Avenlo team can surface opportunities that fit your experience and preferences. We will bring the opportunities to you — there is no job-board browsing step.</p>
                <Link className="btn btn--primary btn--small" href="/dashboard/profile">Complete my profile</Link>
              </div>
            </div>
          </article>

          <aside className="dashboard-panel dashboard-panel--progress">
            <span className="eyebrow">PROFILE SIGNAL</span>
            <h2>Make your profile easier to match</h2>
            <div className="signal-list">
              <div><span className={profile?.full_name ? "signal-check signal-check--done" : "signal-check"}>✓</span><span>Basic identity</span><strong>{profile?.full_name ? "Done" : "Add"}</strong></div>
              <div><span className={hasResume ? "signal-check signal-check--done" : "signal-check"}>✓</span><span>Resume</span><strong>{hasResume ? "Done" : "Add"}</strong></div>
              <div><span className={skillCount ? "signal-check signal-check--done" : "signal-check"}>✓</span><span>Skills</span><strong>{skillCount ? `${skillCount}` : "Add"}</strong></div>
              <div><span className={candidate?.industry ? "signal-check signal-check--done" : "signal-check"}>✓</span><span>Career context</span><strong>{candidate?.industry ? "Done" : "Add"}</strong></div>
            </div>
            <Link className="text-link" href="/dashboard/profile">Edit profile →</Link>
          </aside>
        </div>

        <div className="dashboard-bottom-grid">
          <article className="dashboard-panel">
            <span className="eyebrow">APPLICATIONS</span>
            <h2>Track your progress</h2>
            <p>See applications and updates in one place when Avenlo moves an opportunity forward.</p>
            <Link className="btn btn--small" href="/dashboard/applications">View applications</Link>
          </article>
          <article className="dashboard-panel dashboard-panel--dark">
            <span className="eyebrow eyebrow--light">THE AVENLO PRINCIPLE</span>
            <h2>Technology supports the decision. People make it.</h2>
            <p>Your profile and automated signals help us work faster, while human judgment stays at the centre of every recommendation.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
