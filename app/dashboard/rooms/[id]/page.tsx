import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { collaborationContext } from "@/lib/collaboration-server";
import { type Room, type Proof, type Entry, roomIsActive } from "@/lib/collaboration";
import { CollaborationShell, ProofView, EntryView, ResultNotice } from "@/app/components/collaboration-view";
import { SubmitButton } from "@/app/components/submit-button";
import { appendRoomMessage, appendDossierEntry, changeRoomAccess } from "../actions";
import styles from "@/app/components/collaboration.module.css";

export default async function RoomWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ result?: string }> }) {
  const { supabase, user, role } = await collaborationContext(["candidate", "company"]);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const roomResult = await supabase.from("decision_rooms").select("*").eq("id", id).maybeSingle();
  if (roomResult.error) return <CollaborationShell title="Room unavailable" intro="Unable to load this room."><p role="alert">Refresh to try again.</p></CollaborationShell>;
  if (!roomResult.data) notFound();
  const room = roomResult.data as Room;
  const [messages, proofs, dossier, exports] = await Promise.all([
    supabase.from("room_messages").select("*").eq("room_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("proof_packages").select("*").eq("room_id", id).eq("shared", true).order("captured_at", { ascending: false }).limit(100),
    supabase.from("dossier_entries").select("*").eq("room_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("dossier_exports").select("id, actor_id, exported_at").eq("room_id", id).order("exported_at", { ascending: false }).limit(20),
  ]);
  const active = roomIsActive(room);
  const proofRows = (proofs.data ?? []) as Proof[];
  const failed = messages.error || proofs.error || dossier.error || exports.error;
  return <CollaborationShell audience={role === "company" ? "company" : "candidate"} title={room.title} intro={room.purpose}>
    <ResultNotice result={(await searchParams).result} />
    <aside className={styles.notice}>{active ? "This room is visible to you and the invited company owner." : "Access has ended. The candidate retains this record; the employer can no longer enter."} Ends {new Date(room.expires_at).toLocaleString("en-IN")}. {room.candidate_label} and {room.company_label}. The candidate chose the displayed name. Messages and judgments identify their author; append a correction if something is wrong.</aside>
    {role === "candidate" && active && <form action={changeRoomAccess} className={styles.actions}><input type="hidden" name="id" value={id} /><button name="operation" value="withdraw">Withdraw employer access now</button><Link href="/dashboard/proofs">Prepare evidence in Proof Studio</Link></form>}
    {failed ? <p role="alert">Some room information could not be loaded. Refresh before adding or exporting content.</p> : <>
      <section className={styles.card}><h2>Questions and next steps</h2><p className={styles.meta}>Latest 200 messages, newest first.</p>{(messages.data as Entry[]).length ? (messages.data as Entry[]).map(entry => <EntryView key={entry.id} entry={entry} me={user.id} />) : <p>No messages yet. Start with a question about the work or expectations.</p>}{active && <form action={appendRoomMessage} className={styles.form}><input type="hidden" name="roomId" value={id} /><label>Message type<select name="kind"><option value="question">Question</option><option value="answer">Answer</option><option value="next_step">Next step</option><option value="correction">Correction</option></select></label><label>Message shared with the other participant<textarea name="body" required maxLength={3000} /></label><SubmitButton>Post message</SubmitButton></form>}</section>
      <section className={styles.card}><h2>Candidate-shared proof</h2><p>Only the candidate’s approved snapshots appear here. A source correction withdraws the linked snapshot; the candidate can prepare a replacement.</p>{proofRows.length ? proofRows.map(proof => <ProofView key={proof.id} proof={proof} />) : <p>No proof snapshots are currently shared.</p>}</section>
      <section id="dossier" className={styles.card}><span className={styles.eyebrow}>DECISION DOSSIER</span><h2>Keep the reasoning visible.</h2><p>Evidence references, human judgments, open questions and corrections remain distinct. This record does not generate a hiring verdict. Latest 200 entries, newest first.</p>{(dossier.data as Entry[]).map(entry => <div key={entry.id}><EntryView entry={entry} me={user.id} />{entry.proof_id && <p>Source: {proofRows.find(proof => proof.id === entry.proof_id)?.title ?? "Snapshot no longer shared"}</p>}</div>)}{active && <form action={appendDossierEntry} className={styles.form}><input type="hidden" name="roomId" value={id} /><label>Entry type<select name="kind"><option value="human_judgment">Human judgment</option><option value="evidence_reference">Evidence reference</option><option value="open_question">Open question</option><option value="correction">Correction or disagreement</option><option value="next_step">Next step</option></select></label><label>Source snapshot (required only for an evidence reference)<select name="proofId"><option value="">No evidence reference</option>{proofRows.map(proof => <option key={proof.id} value={proof.id}>{proof.title}</option>)}</select></label><label>Your reasoning, correction or question<textarea name="body" required maxLength={3000} /></label><SubmitButton>Add to dossier</SubmitButton></form>}
      {active && <div className={styles.notice}><p>Export contains the full currently accessible dossier and shared snapshots. Exported copies cannot be recalled by Avenlo; recipients must respect the room’s purpose, confidentiality and deletion request.</p><a href={`/dashboard/rooms/${id}/export`}>Download dossier (JSON)</a></div>}
      <h3>Recent export requests</h3>{exports.data?.length ? <ul>{exports.data.map(item => <li key={item.id}>{item.actor_id === user.id ? "You" : "Other participant"} · {new Date(item.exported_at).toLocaleString("en-IN")}</li>)}</ul> : <p>No export requests logged.</p>}</section>
    </>}
  </CollaborationShell>;
}
