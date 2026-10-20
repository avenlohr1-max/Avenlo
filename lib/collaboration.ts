import { z } from "zod";

export const roomSchema = z.object({ jobId: z.string().uuid(), candidateLabel: z.string().trim().min(1).max(120), title: z.string().trim().min(1).max(160), purpose: z.string().trim().min(1).max(2000), consent: z.literal("yes") });
export const proofSchema = z.object({
  signalId: z.string().uuid(), sourceRevision: z.coerce.number().int().positive(), roomId: z.union([z.string().uuid(), z.literal("")]),
  title: z.string().trim().min(1).max(160), statement: z.string().trim().min(1).max(2000),
  source_label: z.string().trim().min(1).max(200), source_date: z.union([z.string().date(), z.literal("")]),
  context: z.string().trim().min(1).max(3000), uncertainty_note: z.string().trim().min(1).max(1500),
  redaction_note: z.string().trim().min(1).max(1000),
});
export const messageSchema = z.object({ roomId: z.string().uuid(), kind: z.enum(["question", "answer", "next_step", "correction"]), body: z.string().trim().min(1).max(3000) });
export const dossierSchema = z.object({ roomId: z.string().uuid(), kind: z.enum(["evidence_reference", "human_judgment", "correction", "open_question", "next_step"]), body: z.string().trim().min(1).max(3000), proofId: z.union([z.string().uuid(), z.literal("")]) }).refine(value => (value.kind === "evidence_reference") === Boolean(value.proofId), "Only evidence references require a shared proof snapshot.");
export const serviceSchema = z.object({ service: z.enum(["career_review", "evidence_review", "decision_support"]), scope: z.string().trim().min(1).max(3000), consent: z.literal("yes") });
export const serviceLabels: Record<string, string> = { career_review: "Career review", evidence_review: "Evidence review", decision_support: "Decision support" };
export const proofFields = "id, candidate_id, room_id, title, statement, source_label, source_date, context, uncertainty_note, redaction_note, shared, captured_at";
export type Room = { id: string; candidate_id: string; company_id: string; candidate_label: string; company_label: string; title: string; purpose: string; active: boolean; expires_at: string; created_at: string };
export type Proof = { id: string; candidate_id: string; room_id: string | null; signal_id?: string; title: string; statement: string; source_label: string; source_date: string | null; context: string; uncertainty_note: string; redaction_note: string; shared: boolean; captured_at: string };
export type Entry = { id: string; author_id: string; kind: string; body: string; created_at: string; proof_id?: string | null };
export type ServiceCase = { id: string; candidate_id: string; service: string; scope: string; consent: boolean; assigned_staff: string | null; status: string; expires_at: string; created_at: string };
export function roomIsActive(room: Pick<Room, "active" | "expires_at">, now = Date.now()) { return room.active && new Date(room.expires_at).getTime() > now; }
export function exportDossier(room: Room, entries: Entry[], proofs: Proof[]) {
  const visibleProofs = proofs.filter(p => p.shared && p.room_id === room.id);
  const ids = new Set(visibleProofs.map(p => p.id));
  return {
    format: "avenlo-decision-dossier-v1", exported_at: new Date().toISOString(),
    notice: "Human discussion and candidate-approved snapshots. No automated employment decision. Snapshots may later be corrected or withdrawn; check the live room. Keep this copy secure and delete it when its agreed purpose ends.",
    room: { id: room.id, title: room.title, purpose: room.purpose, candidate: room.candidate_label, company: room.company_label, expires_at: room.expires_at },
    entries: entries.filter(e => !e.proof_id || ids.has(e.proof_id)).map(({ id, kind, body, proof_id, created_at, author_id }) => ({ id, kind, body, proof_id, created_at, author: author_id === room.candidate_id ? room.candidate_label : room.company_label, author_type: author_id === room.candidate_id ? "candidate" : "company" })),
    proof_snapshots: visibleProofs.map(({ id, title, statement, source_label, source_date, context, uncertainty_note, redaction_note, captured_at }) => ({ id, title, statement, source_label, source_date, context, uncertainty_note, redaction_note, captured_at })),
  };
}
