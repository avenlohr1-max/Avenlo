import Link from "next/link";
import { collaborationTime, type Proof, type Entry } from "@/lib/collaboration";
import styles from "./collaboration.module.css";

export function CollaborationShell({ title, intro, children, audience = "candidate" }: { title: string; intro: string; children: React.ReactNode; audience?: "candidate" | "company" | "staff" }) {
  return <main className={styles.page}><div className={styles.container}><nav className={styles.nav} aria-label="Collaboration tools"><Link href={audience === "staff" ? "/staff" : audience === "company" ? "/company" : "/dashboard"}>Workspace</Link>{audience !== "staff" && <Link href="/dashboard/rooms">Decision rooms</Link>}{audience === "candidate" && <Link href="/dashboard/proofs">Proof Studio</Link>}{audience !== "company" && <Link href={audience === "staff" ? "/staff/services" : "/dashboard/services"}>Human services</Link>}</nav><header><span className={styles.eyebrow}>AVENLO · HUMAN DECISIONS</span><h1>{title}</h1><p>{intro}</p></header>{children}</div></main>;
}
export function ProofView({ proof }: { proof: Proof }) {
  return <div className={styles.proof}><h3>{proof.title}</h3><p>{proof.statement}</p><dl><dt>Source</dt><dd>{proof.source_label} · {proof.source_date ?? "Date not supplied"}</dd><dt>Context</dt><dd>{proof.context}</dd><dt>Uncertainty</dt><dd>{proof.uncertainty_note}</dd><dt>Candidate edits / redactions</dt><dd>{proof.redaction_note}</dd></dl><small>Snapshot captured {collaborationTime(proof.captured_at)}. Candidate-confirmed; independent verification is not implied.</small></div>;
}
export function EntryView({ entry, me }: { entry: Entry; me: string }) {
  return <article className={styles.entry}><div><strong>{entry.kind.replaceAll("_", " ")}</strong> · {entry.author_id === me ? "You" : "Other participant"} · <time dateTime={entry.created_at}>{collaborationTime(entry.created_at)}</time></div><p>{entry.body}</p></article>;
}
export function ResultNotice({ result }: { result?: string }) { return result ? <p role={result === "saved" ? "status" : "alert"}>{result === "saved" ? "Saved. Access and sharing reflect your latest choice." : "Unable to save. Refresh and check your inputs, permissions and whether this workspace is still active."}</p> : null; }
