import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type RoleBrief } from "@/lib/role-definition";
import { z } from "zod";
import { RoleBriefView } from "@/app/components/role-brief-view";
import { reviewRoleBrief } from "./actions";

export default async function RoleReview({ searchParams }: { searchParams: Promise<{ result?: string; history?: string }> }) {
  const jar = await cookies();
  if (jar.get("avenlo_admin_access")?.value !== "1") redirect("/admin/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "staff" && profile?.role !== "founder") redirect("/admin/login");
  const { data, error } = await supabase.from("employer_role_briefs").select("*, companies(name)").in("status", ["submitted", "approved"]).order("updated_at", { ascending: true }).limit(50);
  const { result, history: historyId } = await searchParams;
  const validHistory = z.string().uuid().safeParse(historyId);
  const history = validHistory.success ? await supabase.from("employer_role_brief_history").select("revision, changed_at, after_data").eq("brief_id", validHistory.data).order("revision", { ascending: false }).limit(20) : { data: [], error: null };
  const rows = (data ?? []) as (RoleBrief & { companies: { name: string } | { name: string }[] | null })[];
  return <main className="section section--light"><div className="container" style={{ maxWidth: 980 }}><Link href="/staff">← Operations workspace</Link><h1>Role definition review</h1>
    <p>Check that outcomes are clear, essentials are justified, preferred capabilities stay optional, and expected evidence supports human review. Record the reason for your decision against the current revision.</p>
    <p>Approval applies to the employer definition. It does not score candidates or publish a job.</p>
    {result && <p role={result === "reviewed" ? "status" : "alert"}>{result === "reviewed" ? "Review recorded against this revision." : "Unable to record the review. Reload the latest revision and provide a review note."}</p>}
    {historyId && <section><h2>Selected brief revision history</h2>{history.error ? <p role="alert">Unable to load revision history.</p> : (history.data ?? []).map((entry) => <details key={entry.revision}><summary>Revision {entry.revision} · {new Date(entry.changed_at).toLocaleString("en-IN")}</summary><RoleBriefView definition={entry.after_data as RoleBrief} /><p>State: {(entry.after_data as RoleBrief).status.replaceAll("_", " ")}</p>{(entry.after_data as RoleBrief).review_note && <p>Review note: {(entry.after_data as RoleBrief).review_note}</p>}</details>)}</section>}
    {error ? <p role="alert">Unable to load the review queue.</p> : !rows.length ? <p>No submitted or approved briefs in the review queue.</p> : rows.map((brief) => <article key={brief.id} style={{ border: "1px solid #bccbdd", borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <p>{(Array.isArray(brief.companies) ? brief.companies[0] : brief.companies)?.name ?? "Employer"} · Revision {brief.revision} · {brief.status.replaceAll("_", " ")}</p>
      <RoleBriefView definition={brief} />{brief.review_note && <p>Previous review note: {brief.review_note}</p>}
      <Link href={`/staff/roles?history=${brief.id}`}>Review revision history</Link>
      <form action={reviewRoleBrief} className="form"><input type="hidden" name="id" value={brief.id} /><input type="hidden" name="revision" value={brief.revision} /><label>Review note<textarea name="note" rows={3} required maxLength={2000} /></label><div className="actions">{brief.status === "submitted" && <button className="btn btn--primary" name="status" value="approved" type="submit">Approve this revision</button>}<button className="btn" name="status" value="changes_requested" type="submit">Request changes</button></div></form>
    </article>)}
  </div></main>;
}
