import Link from "next/link";
import { collaborationContext } from "@/lib/collaboration-server";
import { collaborationTime, type Room, roomIsActive } from "@/lib/collaboration";
import { CollaborationShell, ResultNotice } from "@/app/components/collaboration-view";
import { SubmitButton } from "@/app/components/submit-button";
import { createRoom, changeRoomAccess } from "./actions";
import styles from "@/app/components/collaboration.module.css";

export default async function DecisionRooms({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { supabase, role } = await collaborationContext(["candidate", "company"]);
  const [rooms, jobs] = await Promise.all([
    supabase.from("decision_rooms").select("*").order("created_at", { ascending: false }).limit(100),
    role === "candidate" ? supabase.from("jobs").select("id, title, company_id, companies(name)").eq("status", "open").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
  ]);
  return <CollaborationShell audience={role === "company" ? "company" : "candidate"} title="Mutual Decision Room" intro="Ask questions, clarify expectations and agree on next steps with one employer. Each room names its purpose and access period.">
    <ResultNotice result={(await searchParams).result} />
    <aside className={styles.notice}>Only the candidate and the invited company owner can enter. A room lasts 30 days. Candidate withdrawal or expiry removes employer access immediately. Room access does not open the Talent Record, private notes or Signal Ledger. Shared messages and dossier notes are visible to both participants.</aside>
    {rooms.error || jobs.error ? <p role="alert">Unable to load decision rooms. Please refresh; no invitations have been changed.</p> : <>
      <section className={styles.card}><h2>Your rooms</h2><p className={styles.meta}>Latest 100 rooms. Invitations show the candidate’s chosen name and the employer’s company name.</p>{(rooms.data as Room[] ?? []).length ? (rooms.data as Room[]).map(room => <article key={room.id} className={styles.entry}><h3><Link href={`/dashboard/rooms/${room.id}`}>{room.title}</Link></h3><p>{room.purpose}</p><p className={styles.meta}>{roomIsActive(room) ? "Access active" : "Access ended"} · Ends {collaborationTime(room.expires_at)} · {room.candidate_label} and {room.company_label}</p>{role === "candidate" && <form action={changeRoomAccess} className={styles.actions}><input type="hidden" name="id" value={room.id} />{room.active && <button name="operation" value="withdraw">Withdraw employer access</button>}<button className={styles.danger} name="operation" value="delete">Delete room and shared contents</button></form>}</article>) : <p className={styles.empty}>No rooms yet. A candidate can invite a company through an open role.</p>}</section>
      {role === "candidate" && <section className={styles.card}><h2>Invite an employer</h2>{!jobs.data?.length ? <p>No open roles are available for an invitation.</p> : <form action={createRoom} className={styles.form}><label>Employer through its open role<select name="jobId" required><option value="">Choose a role and company</option>{jobs.data.map(job => <option key={job.id} value={job.id}>{job.title} · {Array.isArray(job.companies) ? job.companies[0]?.name ?? "Employer" : (job.companies as { name?: string } | null)?.name ?? "Employer"}</option>)}</select></label><label>Name to show in this room<input name="candidateLabel" required maxLength={120} /></label><label>Room title<input name="title" required maxLength={160} /></label><label>Purpose and boundaries<textarea name="purpose" required maxLength={2000} placeholder="What would you like to discuss? What should remain outside this conversation?" /></label><label className={styles.check}><input type="checkbox" name="consent" value="yes" required />I invite this company’s owner to see this room, its messages, dossier and only the proof snapshots I explicitly share, for the stated purpose.</label><SubmitButton>Create a 30-day room</SubmitButton></form>}</section>}
    </>}
  </CollaborationShell>;
}
