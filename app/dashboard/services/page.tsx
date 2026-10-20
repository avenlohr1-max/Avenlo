import Link from "next/link";
import { collaborationContext } from "@/lib/collaboration-server";
import { collaborationTime, type ServiceCase, type Entry, serviceLabels } from "@/lib/collaboration";
import { CollaborationShell, ResultNotice } from "@/app/components/collaboration-view";
import { ServiceCases } from "@/app/components/service-cases";
import { SubmitButton } from "@/app/components/submit-button";
import { requestIntelligenceService } from "./actions";
import styles from "@/app/components/collaboration.module.css";

export default async function HumanServices({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { supabase, user } = await collaborationContext(["candidate"]);
  const cases = await supabase.from("intelligence_cases").select("*").eq("candidate_id", user.id).order("created_at", { ascending: false }).limit(100);
  const ids = (cases.data ?? []).map(item => item.id);
  const notes = ids.length ? await supabase.from("intelligence_case_notes").select("*").in("case_id", ids).order("created_at", { ascending: false }).limit(500) : { data: [], error: null };
  const events = await supabase.from("collaboration_events").select("id, resource_type, operation, occurred_at, state").eq("candidate_id", user.id).order("occurred_at", { ascending: false }).limit(50);
  return <CollaborationShell title="Human Intelligence Services" intro="Ask an Avenlo professional to help with a specific career, evidence or decision question. You choose the scope and can withdraw access.">
    <ResultNotice result={(await searchParams).result} />
    <aside className={styles.notice}>A request shares its scope and case notes with the Avenlo service team for triage. After assignment, access is limited to the assigned staff member; escalated cases can also be read by a founder. Your private ledger, proof drafts and employer rooms remain separate. Access expires after 30 days. Do not include identity documents, passwords or confidential employer material.</aside>
    <section className={styles.card}><h2>Request a scoped review</h2><p>Submitting a request creates no charge or subscription. Staff will confirm eligibility, the deliverable, timing and any paid terms before paid work starts. Existing paid services use their published <Link href="/pricing">pricing</Link>, <Link href="/terms">terms</Link> and <Link href="/refunds">refund policy</Link>. No job, interview or hiring outcome is guaranteed.</p><form action={requestIntelligenceService} className={styles.form}><label>Service<select name="service">{Object.entries(serviceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Question, intended outcome and boundaries<textarea name="scope" required maxLength={3000} /></label><label className={styles.check}><input type="checkbox" name="consent" value="yes" required />I authorize the Avenlo service team to use this request and its shared case notes only for the stated service. I understand the access period and can withdraw or delete the case.</label><SubmitButton>Send service request</SubmitButton></form></section>
    {cases.error || notes.error ? <p role="alert">Unable to load your service cases. Refresh before making changes.</p> : <><p className={styles.meta}>Latest 100 cases and 500 case notes, newest first.</p><ServiceCases cases={(cases.data ?? []) as ServiceCase[]} notes={(notes.data ?? []) as (Entry & { case_id: string })[]} me={user.id} /></>}
    <section className={styles.card}><h2>Your recent access history</h2>{events.error ? <p role="alert">Unable to load access history.</p> : <ul>{events.data?.map(event => <li key={event.id}>{event.resource_type.replaceAll("_", " ")} · {event.operation} · {collaborationTime(event.occurred_at)} · {Object.entries(event.state ?? {}).map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join(" · ")}</li>)}</ul>}</section>
  </CollaborationShell>;
}

