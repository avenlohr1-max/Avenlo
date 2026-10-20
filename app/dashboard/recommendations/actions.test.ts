import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), profile: vi.fn(), upsert: vi.fn(), insert: vi.fn(), revalidate: vi.fn(), cookie: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: mocks.user },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }), upsert: mocks.upsert, insert: mocks.insert }),
}) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));

import { linkOpportunityEvidence, saveOpportunityDecision } from "./actions";
import { curateOpportunity } from "../../staff/opportunities/actions";

const person = "10000000-0000-0000-0000-000000000001";
const opportunity = "90000000-0000-0000-0000-000000000001";
const signal = "80000000-0000-0000-0000-000000000001";
function form(values: Record<string, string>) { const result = new FormData(); Object.entries(values).forEach(([key, value]) => result.set(key, value)); return result; }
beforeEach(() => {
  vi.resetAllMocks(); mocks.user.mockResolvedValue({ data: { user: { id: person } } });
  mocks.profile.mockResolvedValue({ data: { role: "candidate" } });
  mocks.upsert.mockResolvedValue({ error: null }); mocks.insert.mockResolvedValue({ error: null }); mocks.cookie.mockReturnValue({ value: "1" });
});

describe("opportunity actions", () => {
  it("requires authentication before mutation", async () => {
    mocks.user.mockResolvedValue({ data: { user: null } });
    await expect(saveOpportunityDecision(form({}))).rejects.toThrow("redirect:/login");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("does not let operations write candidate decisions", async () => {
    mocks.profile.mockResolvedValue({ data: { role: "staff" } });
    await expect(saveOpportunityDecision(form({}))).rejects.toThrow("redirect:/dashboard");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("derives decision ownership from the authenticated user", async () => {
    await expect(saveOpportunityDecision(form({ opportunityId: opportunity, disposition: "dismissed", note: "Question this assumption", candidateId: "victim" }))).rejects.toThrow("?result=saved");
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ candidate_id: person, opportunity_id: opportunity, disposition: "dismissed", private_note: "Question this assumption" }), { onConflict: "opportunity_id" });
  });
  it("rejects invalid decision states and IDs", async () => {
    await expect(saveOpportunityDecision(form({ opportunityId: "invalid", disposition: "hired", note: "" }))).rejects.toThrow("?result=invalid");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("derives evidence ownership from the authenticated user", async () => {
    await expect(linkOpportunityEvidence(form({ opportunityId: opportunity, signalId: signal, operation: "link", candidateId: "victim" }))).rejects.toThrow("?result=saved");
    expect(mocks.insert).toHaveBeenCalledWith({ candidate_id: person, opportunity_id: opportunity, signal_id: signal });
  });
  it("returns a failure when the database rejects unconfirmed evidence", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "private database detail" } });
    await expect(linkOpportunityEvidence(form({ opportunityId: opportunity, signalId: signal, operation: "link" }))).rejects.toThrow("?result=error");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("does not trust the admin entry cookie as authorization", async () => {
    await expect(curateOpportunity(form({}))).rejects.toThrow("redirect:/admin/login");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("requires the private admin entry for curation", async () => {
    mocks.cookie.mockReturnValue(undefined); mocks.profile.mockResolvedValue({ data: { role: "staff" } });
    await expect(curateOpportunity(form({}))).rejects.toThrow("redirect:/admin/login");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("records the actual curator without copying private candidate data", async () => {
    mocks.profile.mockResolvedValue({ data: { role: "staff" } });
    await expect(curateOpportunity(form({ candidateId: person, jobId: "60000000-0000-0000-0000-000000000001", basis: "skills", note: "Explore the employer's SQL requirement", curatorId: "forged" }))).rejects.toThrow("?result=created");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ curator_id: person, basis_field: "skills" }));
    expect(mocks.insert.mock.calls[0][0]).not.toHaveProperty("score");
  });
});
