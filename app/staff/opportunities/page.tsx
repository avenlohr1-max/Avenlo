import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { basisLabels } from "@/lib/opportunity-context";
import { curateOpportunity } from "./actions";

export default async function OpportunityCuration({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const cookieStore = await cookies();
  if (cookieStore.get("avenlo_admin_access")?.value !== "1") redirect("/admin/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "staff" && profile?.role !== "founder") redirect("/admin/login");
  const [people, roles] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "candidate").order("full_name").limit(100),
    supabase.from("jobs").select("id, title, expires_at").eq("status", "open").order("created_at", { ascending: false }).limit(100),
  ]);
  const { result } = await searchParams;
  const openRoles = (roles.data ?? []).filter((job) => !job.expires_at || Date.parse(job.expires_at) > Date.now());
  return <main className="section section--light"><div className="container" style={{ maxWidth: 760 }}>
    <Link href="/staff">← Operations workspace</Link><h1>Curate an opportunity</h1>
    <p>Suggest an employer role for a candidate to explore. Ground your note in a listed role field. This is human judgment; the candidate decides what to do next.</p>
    <p>The candidate’s Signal Ledger, evidence links, dismissals and notes remain private. Sending a suggestion grants no employer access to their record.</p>
    {result && <p role={result === "created" ? "status" : "alert"}>{result === "created" ? "Suggestion sent to the candidate’s private workspace." : "Suggestion could not be saved. Check the fields; the role may be unavailable or already suggested."}</p>}
    {(people.error || roles.error) ? <p role="alert">Unable to load curation inputs. Please try again.</p> : !people.data?.length || !openRoles.length ? <p>Add a candidate and an open employer role before curating an opportunity.</p> : <form action={curateOpportunity} className="form">
      <label>Candidate<select name="candidateId" required defaultValue=""><option value="" disabled>Choose a candidate</option>{people.data.map((person) => <option key={person.id} value={person.id}>{person.full_name || "Unnamed candidate"} · {person.id.slice(0, 8)}</option>)}</select></label>
      <label>Employer role<select name="jobId" required defaultValue=""><option value="" disabled>Choose an open role</option>{openRoles.map((role) => <option key={role.id} value={role.id}>{role.title} · {role.id.slice(0, 8)}</option>)}</select></label>
      <label>Role information behind the suggestion<select name="basis" required>{Object.entries(basisLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Why consider this role?<textarea name="note" required maxLength={2000} rows={5} placeholder="Explain which published role details may be worth exploring. Mark assumptions and questions; avoid claims about private candidate evidence." /></label>
      <button className="btn btn--primary" type="submit">Send private suggestion</button>
    </form>}
  </div></main>;
}
