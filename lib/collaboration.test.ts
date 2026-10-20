import { describe, expect, it } from "vitest";
import { roomSchema, proofSchema, dossierSchema, serviceSchema, roomIsActive, exportDossier, type Room, type Proof, type Entry } from "./collaboration";
const id = "b0000000-0000-0000-0000-000000000001";
const room: Room = { id, candidate_id: "candidate", company_id: "company", candidate_label: "Candidate", company_label: "Company", title: "Discussion", purpose: "Clarify role", active: true, created_at: "2026-10-01T00:00:00Z", expires_at: "2026-11-01T00:00:00Z" };
const proof: Proof = { id: "proof", candidate_id: "candidate", room_id: id, signal_id: "private-ledger-id", title: "Reporting", statement: "Built reports", source_label: "Project", source_date: null, context: "Redacted team context", uncertainty_note: "Self reported", redaction_note: "Client removed", shared: true, captured_at: "2026-10-02T00:00:00Z" };
describe("collaboration boundaries", () => {
  it("requires explicit invitation and service consent", () => {
    expect(roomSchema.safeParse({ jobId: id, title: "Room", purpose: "Purpose" }).success).toBe(false);
    expect(serviceSchema.safeParse({ service: "career_review", scope: "Help" }).success).toBe(false);
    expect(serviceSchema.safeParse({ service: "career_review", scope: "Help", consent: "yes" }).success).toBe(true);
    expect(roomSchema.safeParse({ jobId: id, candidateLabel: "My chosen name", title: "Room", purpose: "Purpose", consent: "yes" }).success).toBe(true);
  });
  it("requires context, uncertainty and an explicit redaction account", () => {
    const value = { signalId: id, sourceRevision: 1, roomId: "", title: "Proof", statement: "Statement", source_label: "Source", source_date: "", context: "Context", uncertainty_note: "Unknown", redaction_note: "None" };
    expect(proofSchema.safeParse(value).success).toBe(true);
    for (const field of ["context", "uncertainty_note", "redaction_note"]) expect(proofSchema.safeParse({ ...value, [field]: " " }).success).toBe(false);
    expect(proofSchema.safeParse({ ...value, source_date: "bad-date" }).success).toBe(false);
    expect(proofSchema.safeParse({ ...value, sourceRevision: 0 }).success).toBe(false);
  });
  it("separates human judgments from evidence references", () => {
    expect(dossierSchema.safeParse({ roomId: id, kind: "evidence_reference", body: "Source", proofId: "" }).success).toBe(false);
    expect(dossierSchema.safeParse({ roomId: id, kind: "human_judgment", body: "Opinion", proofId: id }).success).toBe(false);
    expect(dossierSchema.safeParse({ roomId: id, kind: "correction", body: "Disagree", proofId: "" }).success).toBe(true);
    expect(dossierSchema.safeParse({ roomId: id, kind: "automated_verdict", body: "Hire", proofId: "" }).success).toBe(false);
  });
  it("ends recipient access at withdrawal, expiry and invalid expiry", () => {
    const now = Date.parse("2026-10-21T00:00:00Z");
    expect(roomIsActive(room, now)).toBe(true);
    expect(roomIsActive({ ...room, active: false }, now)).toBe(false);
    expect(roomIsActive({ ...room, expires_at: new Date(now).toISOString() }, now)).toBe(false);
    expect(roomIsActive({ ...room, expires_at: "invalid" }, now)).toBe(false);
  });
  it("exports only approved room snapshots without private ledger identifiers", () => {
    const entries: Entry[] = [
      { id: "1", author_id: "candidate", kind: "evidence_reference", proof_id: "proof", body: "Review this", created_at: "now" },
      { id: "2", author_id: "company", kind: "evidence_reference", proof_id: "withdrawn", body: "Hidden source content", created_at: "now" },
      { id: "3", author_id: "company", kind: "human_judgment", proof_id: null, body: "Needs discussion", created_at: "now" },
    ];
    const exported = exportDossier(room, entries, [proof, { ...proof, id: "withdrawn", shared: false }, { ...proof, id: "foreign", room_id: "different" }]);
    expect(exported.entries.map(item => item.id)).toEqual(["1", "3"]);
    expect(exported.entries[0]).toMatchObject({ author: "Candidate", author_type: "candidate" });
    expect(exported.entries[0]).not.toHaveProperty("author_id");
    expect(exported.proof_snapshots).toHaveLength(1);
    expect(exported.proof_snapshots[0]).toMatchObject({ context: proof.context, uncertainty_note: proof.uncertainty_note, redaction_note: proof.redaction_note });
    expect(JSON.stringify(exported)).not.toContain("private-ledger-id");
    expect(exported.notice).toContain("No automated employment decision");
  });
});
