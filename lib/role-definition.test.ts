import { describe, expect, it } from "vitest";
import { reviewGaps, roleDefinitionSchema, type RoleDefinition } from "./role-definition";

const definition: RoleDefinition = { title: "Operations analyst", summary: "Improve recurring reporting.", outcomes: ["Deliver a reviewed monthly reporting process."], essential: [{ requirement: "SQL reporting", evidence: "A redacted query example or an explanation of a comparable project.", rationale: "The role maintains the reporting pipeline." }], preferred: [{ requirement: "Dashboard design", evidence: "A dashboard example or discussion.", rationale: "" }], location: "", work_mode: "Remote" };
describe("role definitions", () => {
  it("keeps essentials and preferences separate with expected evidence", () => {
    const result = roleDefinitionSchema.parse(definition);
    expect(result.essential[0].rationale).toBe(definition.essential[0].rationale);
    expect(result.preferred).toEqual(definition.preferred);
    expect(reviewGaps(result)).toEqual([]);
    expect(result).not.toHaveProperty("score");
  });
  it("allows incomplete drafts but identifies submission gaps", () => {
    const draft = { ...definition, summary: "", outcomes: [], essential: [] };
    expect(roleDefinitionSchema.safeParse(draft).success).toBe(true);
    expect(reviewGaps(draft)).toHaveLength(3);
  });
  it("requires evidence and essential rationale", () => {
    expect(reviewGaps({ ...definition, essential: [{ requirement: "SQL", evidence: "", rationale: "" }] })).not.toEqual([]);
    expect(reviewGaps({ ...definition, preferred: [{ requirement: "Dashboard", evidence: "", rationale: "" }] })).not.toEqual([]);
  });
  it("rejects duplicate requirements within or across categories", () => {
    expect(roleDefinitionSchema.safeParse({ ...definition, preferred: [{ ...definition.preferred[0], requirement: " sql REPORTING " }] }).success).toBe(false);
    expect(roleDefinitionSchema.safeParse({ ...definition, essential: [definition.essential[0], definition.essential[0]] }).success).toBe(false);
  });
  it("limits collections and text before persistence", () => {
    expect(roleDefinitionSchema.safeParse({ ...definition, outcomes: Array(13).fill("Outcome") }).success).toBe(false);
    expect(roleDefinitionSchema.safeParse({ ...definition, title: "x".repeat(161) }).success).toBe(false);
    expect(roleDefinitionSchema.safeParse({ ...definition, essential: [{ ...definition.essential[0], evidence: "x".repeat(1001) }] }).success).toBe(false);
  });
  it("removes untrusted metadata from the definition payload", () => {
    const result = roleDefinitionSchema.parse({ ...definition, status: "approved", reviewed_by: "forged", created_by: "forged" });
    expect(result).not.toHaveProperty("status");
    expect(result).not.toHaveProperty("reviewed_by");
  });
});
