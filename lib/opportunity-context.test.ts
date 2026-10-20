import { describe, expect, it } from "vitest";
import { confirmedOpportunityEvidence, roleBasis, roleIsOpen, type OpportunityRole, type OpportunitySignal } from "./opportunity-context";

const role: OpportunityRole = { id: "role", title: "Analyst", description: "Employer description", skills: ["SQL"], industry: null, location: null, work_mode: "Remote", seniority: null, experience_years: 0, status: "open", expires_at: null };
const signal: OpportunitySignal = { id: "confirmed", statement: "Corrected statement", source_label: "Candidate project", source_type: "work_sample", source_date: null, context: "Context", uncertainty_note: "Still unverified externally", verification_status: "candidate_confirmed" };

describe("opportunity context", () => {
  it("uses current confirmed evidence and preserves provenance and uncertainty", () => {
    expect(confirmedOpportunityEvidence([signal], [signal.id])).toEqual([signal]);
  });
  it("excludes unselected, disputed and unreviewed resume signals", () => {
    const other = { ...signal, id: "unselected" };
    const resume = { ...signal, id: "resume", source_type: "resume", verification_status: "needs_review" };
    const disputed = { ...signal, id: "disputed", verification_status: "disputed" };
    expect(confirmedOpportunityEvidence([signal, other, resume, disputed], [signal.id, resume.id, disputed.id])).toEqual([signal]);
  });
  it("stops presenting evidence after candidate confirmation is withdrawn", () => {
    expect(confirmedOpportunityEvidence([{ ...signal, verification_status: "needs_review" }], [signal.id])).toEqual([]);
  });
  it("does not treat missing evidence as proof or infer proficiency", () => {
    expect(confirmedOpportunityEvidence([], ["missing"])).toEqual([]);
    expect(confirmedOpportunityEvidence([signal], [signal.id])[0]).not.toHaveProperty("score");
  });
  it("shows missing employer information and preserves zero experience", () => {
    expect(roleBasis(role, "experience_years")).toBe("0 years");
    expect(roleBasis(role, "skills")).toBe("SQL");
    expect(roleBasis(role, "industry")).toBe("Not specified by employer");
    expect(roleBasis({ ...role, skills: [] }, "skills")).toBe("Not specified by employer");
  });
  it.each(["score", "__proto__", "toString"])("rejects unsupported source field %s", (field) => {
    expect(roleBasis(role, field)).toBe("Employer information unavailable");
  });
  it("only offers next steps for open unexpired roles", () => {
    const now = Date.parse("2026-10-21T00:00:00Z");
    expect(roleIsOpen(role, now)).toBe(true);
    expect(roleIsOpen(null, now)).toBe(false);
    expect(roleIsOpen({ ...role, status: "closed" }, now)).toBe(false);
    expect(roleIsOpen({ ...role, expires_at: "2026-10-20T00:00:00Z" }, now)).toBe(false);
    expect(roleIsOpen({ ...role, expires_at: "invalid" }, now)).toBe(false);
    expect(roleIsOpen({ ...role, expires_at: "2026-10-22T00:00:00Z" }, now)).toBe(true);
  });
});
