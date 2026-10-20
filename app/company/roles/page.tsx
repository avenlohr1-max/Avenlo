import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type RoleBrief } from "@/lib/role-definition";
import { RoleBriefView } from "@/app/components/role-brief-view";
import { RoleEditor } from "./role-editor";

type History = { revision: number; changed_at: string; after_data: RoleBrief };
export default async function RoleStudio({ searchParams }: { searchParams: Promise<{ edit?: string; result?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "company") redirect("/dashboard");
  const [companies, briefs] = await Promise.all([
    supabase.from("companies").select("id, name").eq("owner_id", user.id).order("created_at"),
    supabase.from("employer_role_briefs").select("*").order("updated_at", { ascending: false }).limit(50),
  ]);
  const { edit, result } = await searchParams;
  const rows = (briefs.data ?? []) as RoleBrief[];
  const selected = rows.find((row) => row.id === edit);
  const history = selected ? await supabase.from("employer_role_brief_history").select("revision, changed_at, after_data").eq("brief_id", selected.id).order("revision", { ascending: false }).limit(20) : { data: [], error: null };
  const failed = companies.error || briefs.error || history.error;
  return <main className="section section--light"><div className="container" style={{ maxWidth: 980 }}>
    <Link href="/company">← Company workspace</Link><span className="eyebrow" style={{ display: "block", marginTop: 24 }}>ROLE INTELLIGENCE STUDIO</span><h1>Define the work and the evidence it needs.</h1>
    <p>Describe outcomes, distinguish essential requirements from preferred capabilities, and explain the evidence expected for each. Avenlo reviews the definition with you.</p>
    <p>Brief approval records a human review of this definition. Publishing a job remains a separate moderated workflow in your company workspace.</p>
    {result && <p role={result === "saved" ? "status" : "alert"}>{result === "saved" ? "Role brief saved with a new revision." : "Unable to save. Check field limits, review requirements and duplicates, or reload if someone reviewed this revision while you were editing."}</p>}
    {failed ? <p role="alert">Unable to load Role Intelligence Studio. Please refresh and try again.</p> : !companies.data?.length ? <p>Create a company profile in your <Link href="/company">company workspace</Link> first.</p> : <>
      <section><h2>Your latest role briefs</h2>{rows.length ? <ul>{rows.map((row) => <li key={row.id}><Link href={`/company/roles?edit=${row.id}`}>{row.title}</Link> · Revision {row.revision} · {row.status.replaceAll("_", " ")}</li>)}</ul> : <p>No briefs yet. Start your first definition below.</p>}<Link className="btn" href="/company/roles">Start a new brief</Link></section>
      {edit && !selected ? <p role="alert">This brief is unavailable in the latest 50 records. Choose a brief from your list.</p> : <section style={{ marginTop: 32 }}><h2>{selected ? `Edit ${selected.title}` : "New role brief"}</h2>{selected?.review_note && <aside><h3>Review feedback</h3><p>{selected.review_note}</p><p>{selected.reviewed_at ? new Date(selected.reviewed_at).toLocaleString("en-IN") : ""}</p></aside>}<RoleEditor key={`${selected?.id ?? "new"}-${selected?.revision ?? 0}`} companies={companies.data} brief={selected} /></section>}
      {selected && <section style={{ marginTop: 32 }}><h2>Revision history</h2><p>The latest 20 revisions record the submitted definition, corrections and review feedback.</p>{((history.data ?? []) as History[]).map((entry) => <details key={entry.revision} style={{ marginBottom: 16 }}><summary>Revision {entry.revision} · {entry.after_data.status.replaceAll("_", " ")} · {new Date(entry.changed_at).toLocaleString("en-IN")}</summary><RoleBriefView definition={entry.after_data} />{entry.after_data.review_note && <p>Review note: {entry.after_data.review_note}</p>}</details>)}</section>}
    </>}
  </div></main>;
}
