import Link from "next/link";
import { collaborationContext } from "@/lib/collaboration-server";
import { type ServiceCase, type Entry } from "@/lib/collaboration";
import { CollaborationShell, ResultNotice } from "@/app/components/collaboration-view";
import { ServiceCases } from "@/app/components/service-cases";
import styles from "@/app/components/collaboration.module.css";

export default async function ServiceQueue({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { supabase, user } = await collaborationContext(["staff", "founder"]);
  const cases = await supabase.from("intelligence_cases").select("*").eq("consent", true).gt("expires_at", new Date().toISOString()).order("created_at").limit(100);
  const ids = (cases.data ?? []).map(item => item.id);
  const notes = ids.length ? await supabase.from("intelligence_case_notes").select("*").in("case_id", ids).order("created_at", { ascending: false }).limit(500) : { data: [], error: null };
  return <CollaborationShell title="Human service cases" intro="Accept a consented request, agree on the deliverable and keep progress and corrections visible to the candidate."><Link href="/staff">← Operations workspace</Link><ResultNotice result={(await searchParams).result} /><aside className={styles.notice}>Review conflicts, scope, competence and paid-service eligibility before accepting work. Access to private candidate records is not included. Request a redacted case note from the candidate when more context is necessary. Escalate conflicts or complaints to a founder; candidates can withdraw your access at any time.</aside>{cases.error || notes.error ? <p role="alert">Unable to load cases. Refresh to retry.</p> : <><p className={styles.meta}>First 100 available cases, oldest first, and latest 500 case notes. Assignment restricts other staff; founders can review escalations.</p><ServiceCases cases={(cases.data ?? []) as ServiceCase[]} notes={(notes.data ?? []) as (Entry & { case_id: string })[]} me={user.id} staff /></>}</CollaborationShell>;
}
