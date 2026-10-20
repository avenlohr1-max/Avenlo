import { type ServiceCase, type Entry, serviceLabels } from "@/lib/collaboration";
import { EntryView } from "./collaboration-view";
import { SubmitButton } from "./submit-button";
import { appendCaseNote, withdrawService, manageServiceCase } from "@/app/dashboard/services/actions";
import styles from "./collaboration.module.css";

export function ServiceCases({ cases, notes, me, staff = false }: { cases: (ServiceCase & { resolution_note?: string; staff_declaration?: string })[]; notes: (Entry & { case_id: string })[]; me: string; staff?: boolean }) {
  return <>{!cases.length && <p className={styles.empty}>No service cases are available.</p>}{cases.map(item => {
    const active = item.consent && new Date(item.expires_at).getTime() > Date.now() && !["closed", "completed"].includes(item.status);
    return <article key={item.id} className={styles.card}><h2>{serviceLabels[item.service]}</h2><p>{item.scope}</p><p className={styles.meta}>Reference {item.id} · {item.status.replaceAll("_", " ")} · Access {item.consent ? "consented until" : "withdrawn; original expiry"} {new Date(item.expires_at).toLocaleString("en-IN")} · {item.assigned_staff ? "Staff member assigned" : "Awaiting staff assignment"}</p>
      {item.staff_declaration && <p>Staff declaration: {item.staff_declaration}</p>}{item.resolution_note && <aside className={styles.notice}>Latest staff scope / outcome note: {item.resolution_note}</aside>}
      {!staff && <form action={withdrawService} className={styles.actions}><input type="hidden" name="id" value={item.id} />{item.consent && <button name="operation" value="withdraw">Withdraw staff access and close</button>}<button className={styles.danger} name="operation" value="delete">Delete case and notes</button></form>}
      <details><summary>Shared case notes and corrections</summary>{notes.filter(note => note.case_id === item.id).map(note => <EntryView key={note.id} entry={note} me={me} />)}<p className={styles.meta}>Notes are visible to you and the authorized staff member. No private staff assessment is kept in this case.</p></details>
      {active && <form action={appendCaseNote} className={styles.form}><input type="hidden" name="caseId" value={item.id} /><label>Note type<select name="kind"><option value="scope">Scope clarification</option><option value="progress">Progress</option><option value="correction">Correction</option><option value="escalation">Escalation or conflict</option><option value="completion">Completion feedback</option></select></label><label>Shared note<textarea name="body" required maxLength={3000} /></label><SubmitButton>Add case note</SubmitButton></form>}
      {staff && active && <form action={manageServiceCase} className={styles.form} style={{ marginTop: 24 }}><input type="hidden" name="id" value={item.id} /><label>Case progress<select name="status"><option value="in_progress">Accept and work on case</option><option value="escalated">Escalate to founder review</option><option value="completed">Complete</option><option value="closed">Close</option></select></label><label>Scope, outcome, escalation or closure reason<textarea name="note" required maxLength={3000} /></label><label className={styles.check}><input type="checkbox" name="declaration" value="yes" required />I reviewed the scope, can perform this work, and have disclosed conflicts in the case notes. I will request only the information needed for this service.</label><SubmitButton>Assign to me and update case</SubmitButton></form>}
    </article>;
  })}</>;
}
