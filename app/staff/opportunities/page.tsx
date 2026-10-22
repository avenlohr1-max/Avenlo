import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleIsOpen, type OpportunityRole } from "@/lib/opportunity-context";
import { CurationForm } from "./curation-form";

export default async function OpportunityCuration({ searchParams }: { searchParams: Promise<{ result?: string; candidate?: string; candidateQuery?: string; roleQuery?: string }> }) {
  const cookieStore = await cookies();
  if (cookieStore.get("avenlo_admin_access")?.value !== "1") redirect("/admin/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "staff" && profile?.role !== "founder") redirect("/admin/login");
  const { result, candidate, candidateQuery, roleQuery } = await searchParams;
  const personSearch = typeof candidateQuery === "string" ? candidateQuery.trim().slice(0,120) : "";
  const roleSearch = typeof roleQuery === "string" ? roleQuery.trim().slice(0,120) : "";
  const escape = (value: string) => value.replace(/[\\%_]/g, "\\$&");
  let peopleQuery = supabase.from("profiles").select("id, full_name").eq("role", "candidate").order("full_name").order("id").limit(100);
  if (typeof candidate === "string" && /^[0-9a-f-]{36}$/i.test(candidate)) peopleQuery = peopleQuery.eq("id", candidate);
  else if (personSearch) peopleQuery = peopleQuery.ilike("full_name", "%" + escape(personSearch) + "%");
  let jobsQuery = supabase.from("jobs").select("id, title, description, skills, industry, location, work_mode, seniority, experience_years, status, expires_at").eq("status", "open").order("created_at", { ascending: false }).order("id").limit(100);
  if (roleSearch) jobsQuery = jobsQuery.ilike("title", "%" + escape(roleSearch) + "%");
  const [people, roles] = await Promise.all([peopleQuery, jobsQuery]);
  const openRoles = ((roles.data ?? []) as OpportunityRole[]).filter((job) => roleIsOpen(job));
  return <main className="section section--light"><div className="container" style={{ maxWidth: 760 }}>
    <Link href="/staff">← Operations workspace</Link><h1>Curate an opportunity</h1>
    <p>Suggest an employer role for a candidate to explore. Ground your note in a listed role field. This is human judgment; the candidate decides what to do next.</p>
    <p>The candidate’s Signal Ledger, evidence links, dismissals and notes remain private. Sending a suggestion grants no employer access to their record.</p>
    <form action="/staff/opportunities" className="form"><div className="form-grid"><label>Find candidate by name<input name="candidateQuery" maxLength={120} defaultValue={personSearch} /></label><label>Find open role by title<input name="roleQuery" maxLength={120} defaultValue={roleSearch} /></label></div><button className="btn" type="submit">Find curation inputs</button><p>Each result list shows at most 100 matches. Refine your search, or select a candidate from the <Link href="/staff/directory?role=candidate">complete directory</Link>.</p></form>
    {result && <p role={result === "created" ? "status" : "alert"}>{result === "created" ? "Suggestion sent to the candidate’s private workspace." : "Suggestion could not be saved. Check the fields; the role may be unavailable or already suggested."}</p>}
    {(people.error || roles.error) ? <p role="alert">Unable to load curation inputs. Please try again.</p> : !people.data?.length || !openRoles.length ? <p>Add a candidate and an open employer role before curating an opportunity.</p> : <CurationForm people={people.data} roles={openRoles} />}
  </div></main>;
}
