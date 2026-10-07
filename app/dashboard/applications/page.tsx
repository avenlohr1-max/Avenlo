"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Application = {
  id: string;
  status: string;
  match_score: number | null;
  created_at: string;
  job_title: string;
  company_name: string;
};

const statusCopy: Record<string, { label: string; detail: string }> = {
  submitted: { label: "Shared with Avenlo", detail: "Your opportunity is in the Avenlo review workflow." },
  reviewing: { label: "Under review", detail: "The team is reviewing the opportunity and your fit." },
  shortlisted: { label: "Shortlisted", detail: "This opportunity has progressed to the next stage." },
  rejected: { label: "Closed", detail: "This opportunity is no longer active in your workflow." },
  hired: { label: "Hired", detail: "This opportunity reached a successful outcome." },
};

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.assign("/login");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role !== "candidate") {
        window.location.assign("/dashboard");
        return;
      }

      const { data: rows, error: applicationsError } = await supabase
        .from("applications")
        .select("id, status, match_score, created_at, jobs!inner(title, companies!inner(name, owner_id))")
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false });

      if (applicationsError) {
        setError("Unable to load your opportunities.");
        setLoading(false);
        return;
      }

      const mapped = (rows ?? []).map((row) => {
        const jobs = row.jobs as { title?: string; companies?: { name?: string } | { name?: string }[] } | { title?: string; companies?: { name?: string } }[];
        const job = Array.isArray(jobs) ? jobs[0] : jobs;
        const companies = job?.companies;
        const company = Array.isArray(companies) ? companies[0] : companies;

        return {
          id: row.id,
          status: row.status,
          match_score: row.match_score,
          created_at: row.created_at,
          job_title: job?.title ?? "Role",
          company_name: company?.name ?? "Company",
        };
      });

      setApplications(mapped);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) return <main className="page"><div className="container hero"><p className="muted">Loading your opportunities…</p></div></main>;

  return (
    <main className="page">
      <nav className="nav container">
        <span className="brand">AVENLO</span>
        <div className="actions">
          <Link className="btn" href="/dashboard">Dashboard</Link>
          <Link className="btn" href="/dashboard/recommendations">Recommendations</Link>
          <Link className="btn" href="/dashboard/profile">My profile</Link>
        </div>
      </nav>

      <section className="hero container" style={{ maxWidth: 1000 }}>
        <span className="eyebrow">MY OPPORTUNITIES</span>
        <h1>Know what is moving.</h1>
        <p>Avenlo handles the search and recommendation process for you. This space shows opportunities that have actually been put forward and the latest stage in the human review workflow.</p>

        {error ? <p className="error" role="alert">{error}</p> : null}

        <div className="grid">
          {applications.map((application) => {
            const stage = statusCopy[application.status] ?? {
              label: application.status.replace("_", " "),
              detail: "This opportunity is in the Avenlo workflow.",
            };

            return (
              <article className="card" key={application.id}>
                <span className="eyebrow">{stage.label}</span>
                <h2>{application.job_title}</h2>
                <p className="muted">{application.company_name}</p>
                <p>{stage.detail}</p>
                <div className="grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 20 }}>
                  <div>
                    <span className="eyebrow">ADDED</span>
                    <strong>{new Date(application.created_at).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="eyebrow">MATCH SIGNAL</span>
                    <strong>{application.match_score == null ? "Awaiting review" : application.match_score + "%"}</strong>
                  </div>
                </div>
              </article>
            );
          })}
          {!applications.length && !error ? (
            <div className="card">
              <span className="eyebrow">NO ACTIVE OPPORTUNITIES</span>
              <h2>Keep your signal current.</h2>
              <p className="muted">There are no opportunities to track yet. Avenlo will surface relevant opportunities when there is a meaningful fit.</p>
              <div className="actions">
                <Link className="btn primary" href="/dashboard/profile">Review my profile</Link>
                <Link className="btn" href="/dashboard/recommendations">See recommendations</Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
