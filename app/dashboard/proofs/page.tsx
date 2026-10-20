import Link from "next/link";
import { collaborationContext } from "@/lib/collaboration-server";
import { type Room, type Proof, roomIsActive } from "@/lib/collaboration";
import { CollaborationShell, ProofView, ResultNotice } from "@/app/components/collaboration-view";
import { SubmitButton } from "@/app/components/submit-button";
import { prepareProof, changeProofSharing } from "./actions";
import styles from "@/app/components/collaboration.module.css";

type Signal = { id: string; revision: number; statement: string; source_label: string; source_date: string | null; context: string; uncertainty_note: string };
export default async function ProofStudio({ searchParams }: { searchParams: Promise<{ signal?: string; preview?: string; result?: string }> }) {
  const { supabase, user } = await collaborationContext(["candidate"]);
  const { signal: selectedId, preview, result } = await searchParams;
  const [signals, packages, rooms] = await Promise.all([
    supabase.from("candidate_signals").select("id, revision, statement, source_label, source_date, context, uncertainty_note").eq("candidate_id", user.id).eq("verification_status", "candidate_confirmed").order("updated_at", { ascending: false }).limit(200),
    supabase.from("proof_packages").select("*").eq("candidate_id", user.id).order("captured_at", { ascending: false }).limit(100),
    supabase.from("decision_rooms").select("*").eq("candidate_id", user.id).eq("active", true).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(100),
  ]);
  const signalRows = (signals.data ?? []) as Signal[];
  const proofRows = (packages.data ?? []) as Proof[];
  const roomRows = (rooms.data ?? []) as Room[];
  const selected = signalRows.find(signal => signal.id === selectedId);
  const previewProof = proofRows.find(proof => proof.id === preview);
  return <CollaborationShell title="Proof Studio" intro="Choose a confirmed source, remove details you do not want to disclose, then preview the exact snapshot before sharing it with a named decision room.">
    <ResultNotice result={result} />
    <aside className={styles.notice}>A snapshot starts private. Sharing applies to one room and its company owner. Source context, uncertainty and redactions stay visible. Correcting a source withdraws its snapshots automatically; prepare a fresh snapshot before sharing the correction. Delete a snapshot to remove its linked dossier evidence references.</aside>
    {signals.error || packages.error || rooms.error ? <p role="alert">Unable to load Proof Studio. Refresh to try again.</p> : <>
      {preview && !previewProof && <p role="alert">That preview is unavailable in your latest 100 snapshots.</p>}
      {previewProof && <section className={styles.card}><h2>Review exactly what will be shared</h2><ProofView proof={previewProof} /><p>Recipient: {roomRows.find(room => room.id === previewProof.room_id)?.title ?? "No active recipient room"} · {roomRows.find(room => room.id === previewProof.room_id)?.company_label ?? "none"}</p><p>This snapshot is {previewProof.shared ? "currently shared" : "private"}. If it needs edits, delete it and prepare a corrected snapshot.</p>{previewProof.room_id && roomRows.some(room => room.id === previewProof.room_id && roomIsActive(room)) && !previewProof.shared && <form action={changeProofSharing} className={styles.actions}><input type="hidden" name="id" value={previewProof.id} /><button name="operation" value="share">Approve this exact snapshot and share with this room</button></form>}</section>}
      <section className={styles.card}><h2>1. Choose a confirmed source</h2><p>Latest 200 confirmed signals. <Link href="/dashboard/signals">Review or correct your Signal Ledger</Link>.</p>{signalRows.length ? <ul>{signalRows.map(signal => <li key={signal.id}><Link href={`/dashboard/proofs?signal=${signal.id}`}>{signal.statement}</Link></li>)}</ul> : <p>Confirm evidence in your Signal Ledger before preparing a snapshot.</p>}</section>
      {selected && <section className={styles.card}><h2>2. Prepare and redact your snapshot</h2><p>These fields start from your source. Remove confidential details, describe any redactions, and keep enough context to avoid misleading the recipient.</p><form key={selected.id} action={prepareProof} className={styles.form}><input type="hidden" name="signalId" value={selected.id} /><input type="hidden" name="sourceRevision" value={selected.revision} /><label>Snapshot title<input name="title" required maxLength={160} /></label><label>Statement<textarea name="statement" defaultValue={selected.statement} required maxLength={2000} /></label><label>Source label<input name="source_label" defaultValue={selected.source_label} required maxLength={200} /></label><label>Source date (optional)<input name="source_date" type="date" defaultValue={selected.source_date ?? ""} /></label><label>Context<textarea name="context" defaultValue={selected.context} required maxLength={3000} /></label><label>Uncertainty and limitations<textarea name="uncertainty_note" defaultValue={selected.uncertainty_note} required maxLength={1500} /></label><label>What was redacted or edited? (write “None” if unchanged)<textarea name="redaction_note" required maxLength={1000} /></label><label>Intended recipient room<select name="roomId"><option value="">Private snapshot, no recipient</option>{roomRows.map(room => <option key={room.id} value={room.id}>{room.title} · {room.company_label}</option>)}</select></label><SubmitButton>Save private snapshot and preview</SubmitButton></form></section>}
      <section className={styles.card}><h2>Your latest 100 snapshots</h2>{proofRows.length ? proofRows.map(proof => <article key={proof.id} className={styles.entry}><h3><Link href={`/dashboard/proofs?preview=${proof.id}`}>{proof.title}</Link></h3><p>{proof.shared ? "Shared subject to active room access" : "Private / withdrawn"} · {roomRows.find(room => room.id === proof.room_id)?.title ?? "No active recipient"}</p><form action={changeProofSharing} className={styles.actions}><input type="hidden" name="id" value={proof.id} />{proof.shared && <button name="operation" value="withdraw">Withdraw this snapshot</button>}<button className={styles.danger} name="operation" value="delete">Delete snapshot and its dossier references</button></form></article>) : <p>No snapshots yet.</p>}</section>
    </>}
  </CollaborationShell>;
}
