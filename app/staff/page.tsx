import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/app/components/brand-logo";
import { JobModeration } from "./job-moderation";
import { ApplicationReview } from "./application-review";
import { ProfileStatusControl } from "./profile-status-control";
import { ReportStatusControl } from "./report-status-control";
import { SignOutButton } from "@/app/components/sign-out-button";

type CompanyRelation = { name?: string } | Array<{ name?: string }> | null;

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "blue" | "green" | "amber" }) {
  return (
    <div className={`ops-stat ops-stat--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default async function StaffWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: current } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (current?.role !== "staff" && current?.role !== "founder") redirect("/dashboard");

  const [{ data: users }, { data: candidates }, { data: companies }, { data: jobs }, { data: applications }, { data: reports }, { data: auditLogs }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role, status, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("id, full_name, headline, location, status").eq("role", "candidate").order("created_at", { ascending: false }).limit(50),
    supabase.from("companies").select("id, name, industry, location, owner_id, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("jobs").select("id, title, status, company_id, expires_at, companies(name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("applications").select("id, candidate_id, job_id, status, match_score, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("moderation_reports").select("id, reporter_id, target_type, target_id, reason, status, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("audit_logs").select("id, actor_id, action, entity_type, entity_id, metadata, created_at").order("created_at", { ascending: false }).limit(50),
  ]);

  const reportCount = reports?.length ?? 0;
  const activeUsers = users?.filter((profile) => profile.status === "active").length ?? 0;
  const openJobs = jobs?.filter((job) => job.status === "open").length ?? 0;
  const pendingApplications = applications?.filter((application) => application.status === "submitted" || application.status === "pending").length ?? 0;
  const displayName = current?.full_name || user.email?.split("@")[0] || "Founder";

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div className="ops-header__inner">
          <BrandLogo href="/" compact />

          <div className="ops-header__right">
            <div className="ops-user">
              <span className="ops-user__dot" />
              <span>{displayName}</span>
              <b>{current?.role === "founder" ? "Founder" : "Staff"}</b>
            </div>
            <Link className="ops-header__link" href="/dashboard">Candidate view</Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className="ops-hero">
        <div className="ops-container">
          <div className="ops-breadcrumb"><span>AVENLO OPERATIONS</span><i>/</i><span>PRIVATE WORKSPACE</span></div>
          <div className="ops-hero__row">
            <div>
              <p className="ops-kicker">FOUNDER & ADMIN CONTROL CENTER</p>
              <h1>Operate the talent intelligence layer.</h1>
              <p className="ops-hero__lede">A focused workspace for reviewing people, companies, roles, applications, moderation and security signals — with human judgement at the center.</p>
            </div>
            <div className="ops-hero__badge">
              <span className="ops-hero__badge-dot" />
              <div><strong>System ready</strong><small>Protected operations workspace</small></div>
            </div>
          </div>

          <div className="ops-stats">
            <Stat label="Total users" value={users?.length ?? 0} tone="blue" />
            <Stat label="Active users" value={activeUsers} tone="green" />
            <Stat label="Open roles" value={openJobs} />
            <Stat label="Pending applications" value={pendingApplications} tone="amber" />
            <Stat label="Reports" value={reportCount} />
          </div>
        </div>
      </section>

      <section className="ops-content ops-container">
        <div className="ops-section-head">
          <div><p className="ops-kicker">PEOPLE</p><h2>Users & candidates</h2></div>
          <p>Review account status and candidate context without leaving operations.</p>
        </div>

        <div className="ops-panel">
          <div className="ops-panel__head"><div><strong>All users</strong><span>{users?.length ?? 0} records</span></div><span className="ops-status-chip">Live</span></div>
          <div className="ops-table-wrap">
            <div className="ops-table ops-table--users">
              <div className="ops-table__row ops-table__row--head"><span>User</span><span>Role</span><span>Status</span><span>Created</span><span>Action</span></div>
              {(users ?? []).slice(0, 12).map((profile) => (
                <div className="ops-table__row" key={profile.id}>
                  <div className="ops-person"><span className="ops-avatar">{(profile.full_name || "U").slice(0, 1).toUpperCase()}</span><div><strong>{profile.full_name || "Unnamed user"}</strong><small>{profile.email || "No email stored"}</small></div></div>
                  <span className="ops-role">{profile.role}</span>
                  <span className={`ops-pill ops-pill--${profile.status}`}>{profile.status}</span>
                  <span className="ops-date">{new Date(profile.created_at).toLocaleDateString()}</span>
                  <ProfileStatusControl userId={profile.id} status={profile.status as "draft" | "active" | "suspended" | "archived"} />
                </div>
              ))}
              {!users?.length ? <div className="ops-empty">No users yet.</div> : null}
            </div>
          </div>
        </div>

        <div className="ops-grid ops-grid--two">
          <div className="ops-panel">
            <div className="ops-panel__head"><div><strong>Candidates</strong><span>{candidates?.length ?? 0} profiles</span></div></div>
            <div className="ops-list">
              {(candidates ?? []).slice(0, 6).map((candidate) => (
                <article className="ops-list-item" key={candidate.id}>
                  <span className="ops-avatar">{(candidate.full_name || "C").slice(0, 1).toUpperCase()}</span>
                  <div><strong>{candidate.full_name || "Unnamed candidate"}</strong><p>{candidate.headline || "No headline"}</p><small>{candidate.location || "Location not provided"}</small></div>
                  <span className={`ops-pill ops-pill--${candidate.status}`}>{candidate.status}</span>
                </article>
              ))}
              {!candidates?.length ? <div className="ops-empty">No candidates yet.</div> : null}
            </div>
          </div>

          <div className="ops-panel">
            <div className="ops-panel__head"><div><strong>Companies</strong><span>{companies?.length ?? 0} accounts</span></div></div>
            <div className="ops-list">
              {(companies ?? []).slice(0, 6).map((company) => (
                <article className="ops-list-item" key={company.id}>
                  <span className="ops-company-mark">{company.name.slice(0, 1).toUpperCase()}</span>
                  <div><strong>{company.name}</strong><p>{company.industry || "Company"}</p><small>{company.location || "Location not provided"}</small></div>
                </article>
              ))}
              {!companies?.length ? <div className="ops-empty">No companies yet.</div> : null}
            </div>
          </div>
        </div>

        <div className="ops-section-head ops-section-head--spaced">
          <div><p className="ops-kicker">MATCHING OPERATIONS</p><h2>Roles & applications</h2></div>
          <p>Keep role quality and human review in one place.</p>
        </div>

        <div className="ops-grid ops-grid--two">
          <div className="ops-panel">
            <div className="ops-panel__head"><div><strong>Open roles</strong><span>{jobs?.length ?? 0} roles</span></div></div>
            <div className="ops-list">
              {(jobs ?? []).slice(0, 6).map((job) => {
                const companiesRelation = job.companies as CompanyRelation;
                const companyName = Array.isArray(companiesRelation) ? companiesRelation[0]?.name : companiesRelation?.name;
                return <article className="ops-list-item ops-list-item--action" key={job.id}>
                  <span className="ops-icon">↗</span>
                  <div><strong>{job.title}</strong><p>{companyName || "Company"}</p>{job.expires_at ? <small>Expires {new Date(job.expires_at).toLocaleDateString()}</small> : null}</div>
                  <div className="ops-item-action"><span className={`ops-pill ops-pill--${job.status}`}>{job.status}</span><JobModeration jobId={job.id} status={job.status} /></div>
                </article>;
              })}
              {!jobs?.length ? <div className="ops-empty">No jobs yet.</div> : null}
            </div>
          </div>

          <div className="ops-panel">
            <div className="ops-panel__head"><div><strong>Applications & matching</strong><span>{applications?.length ?? 0} records</span></div></div>
            <div className="ops-list">
              {(applications ?? []).slice(0, 6).map((application) => <article className="ops-list-item ops-list-item--action" key={application.id}>
                <span className="ops-score">{application.match_score == null ? "—" : `${application.match_score}%`}</span>
                <div><strong>{application.match_score == null ? "Awaiting review" : "Match signal"}</strong><p>Candidate {application.candidate_id.slice(0, 8)} · Role {application.job_id.slice(0, 8)}</p><small>{new Date(application.created_at).toLocaleDateString()}</small></div>
                <div className="ops-item-action"><span className={`ops-pill ops-pill--${application.status}`}>{application.status}</span><ApplicationReview applicationId={application.id} matchScore={application.match_score} /></div>
              </article>)}
              {!applications?.length ? <div className="ops-empty">No applications yet.</div> : null}
            </div>
          </div>
        </div>

        <div className="ops-section-head ops-section-head--spaced">
          <div><p className="ops-kicker">TRUST & SAFETY</p><h2>Moderation & security</h2></div>
          <p>Surface the signals that need attention, without the clutter.</p>
        </div>

        <div className="ops-grid ops-grid--two">
          <div className="ops-panel">
            <div className="ops-panel__head"><div><strong>Moderation reports</strong><span>{reportCount} reports</span></div><span className="ops-status-chip">Review</span></div>
            <div className="ops-list">
              {(reports ?? []).slice(0, 6).map((report) => <article className="ops-list-item ops-list-item--action" key={report.id}>
                <span className="ops-alert-icon">!</span>
                <div><strong>{report.reason}</strong><p>{report.target_type} · {report.target_id.slice(0, 10)}</p><small>{new Date(report.created_at).toLocaleDateString()}</small></div>
                <ReportStatusControl reportId={report.id} status={report.status as "open" | "reviewing" | "resolved" | "dismissed"} />
              </article>)}
              {!reports?.length ? <div className="ops-empty ops-empty--success"><span>✓</span><div><strong>All clear</strong><small>No moderation reports yet.</small></div></div> : null}
            </div>
          </div>

          <div className="ops-panel">
            <div className="ops-panel__head"><div><strong>Audit & security events</strong><span>{auditLogs?.length ?? 0} events</span></div></div>
            <div className="ops-list">
              {(auditLogs ?? []).slice(0, 6).map((event) => <article className="ops-list-item" key={event.id}>
                <span className="ops-icon ops-icon--muted">•</span>
                <div><strong>{event.action}</strong><p>{event.entity_type} · {event.entity_id || "No entity"}</p><small>{new Date(event.created_at).toLocaleString()}</small></div>
              </article>)}
              {!auditLogs?.length ? <div className="ops-empty">No audit events yet.</div> : null}
            </div>
          </div>
        </div>
      </section>

      <footer className="ops-footer"><div className="ops-container"><span>AVENLO OPERATIONS</span><span>Technology supports the decision. People make it.</span></div></footer>
    </main>
  );
}
