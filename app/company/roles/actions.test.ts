import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), profile: vi.fn(), company: vi.fn(), result: vi.fn(), update: vi.fn(), insert: vi.fn(), mutationEq: vi.fn(), cookie: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: mocks.user },
  from: (table: string) => {
    if (table === "profiles" || table === "companies") {
      const query = { select: () => query, eq: () => query, maybeSingle: table === "profiles" ? mocks.profile : mocks.company };
      return query;
    }
    const mutation = { eq: (...args: unknown[]) => { mocks.mutationEq(...args); return mutation; }, select: () => mutation, maybeSingle: mocks.result, single: mocks.result };
    return { update: (...args: unknown[]) => { mocks.update(...args); return mutation; }, insert: (...args: unknown[]) => { mocks.insert(...args); return mutation; } };
  },
}) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
import { saveRoleBrief } from "./actions";
import { reviewRoleBrief } from "../../staff/roles/actions";

const id = "a0000000-0000-0000-0000-000000000001";
const companyId = "50000000-0000-0000-0000-000000000001";
const definition = { title: "Analyst", summary: "Reporting", outcomes: ["Reliable reporting"], essential: [{ requirement: "SQL", evidence: "Project discussion", rationale: "Maintains reporting" }], preferred: [], location: "", work_mode: "" };
function form(values: Record<string, string>) { const result = new FormData(); Object.entries(values).forEach(([key, value]) => result.set(key, value)); return result; }
beforeEach(() => {
  vi.resetAllMocks(); mocks.user.mockResolvedValue({ data: { user: { id: "20000000-0000-0000-0000-000000000001" } } });
  mocks.profile.mockResolvedValue({ data: { role: "company" } }); mocks.company.mockResolvedValue({ data: { id: companyId } });
  mocks.result.mockResolvedValue({ data: { id }, error: null }); mocks.cookie.mockReturnValue({ value: "1" });
});
describe("role studio actions", () => {
  it("requires employer authentication", async () => {
    mocks.user.mockResolvedValue({ data: { user: null } });
    await expect(saveRoleBrief(form({}))).rejects.toThrow("redirect:/login");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects candidate role-definition writes", async () => {
    mocks.profile.mockResolvedValue({ data: { role: "candidate" } });
    await expect(saveRoleBrief(form({}))).rejects.toThrow("redirect:/dashboard");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("does not accept an employer self-approval request", async () => {
    await expect(saveRoleBrief(form({ companyId, status: "approved", definition: JSON.stringify(definition) }))).rejects.toThrow("result=invalid");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("checks company ownership before persisting a definition", async () => {
    mocks.company.mockResolvedValue({ data: null });
    await expect(saveRoleBrief(form({ companyId, status: "draft", definition: JSON.stringify(definition) }))).rejects.toThrow("result=error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects incomplete submitted definitions", async () => {
    await expect(saveRoleBrief(form({ companyId, status: "submitted", definition: JSON.stringify({ ...definition, essential: [] }) }))).rejects.toThrow("result=invalid");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects a stale edit rather than reporting success", async () => {
    mocks.result.mockResolvedValue({ data: null, error: null });
    await expect(saveRoleBrief(form({ companyId, id, revision: "2", status: "draft", definition: JSON.stringify(definition) }))).rejects.toThrow("result=error");
    expect(mocks.mutationEq).toHaveBeenCalledWith("revision", 2);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("does not accept the private-entry cookie as reviewer authority", async () => {
    await expect(reviewRoleBrief(form({ id, revision: "2", status: "approved", note: "Approve" }))).rejects.toThrow("redirect:/admin/login");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("requires a review note and binds staff review to the current revision", async () => {
    mocks.profile.mockResolvedValue({ data: { role: "staff" } });
    await expect(reviewRoleBrief(form({ id, revision: "2", status: "approved", note: "" }))).rejects.toThrow("result=invalid");
    expect(mocks.update).not.toHaveBeenCalled();
    await expect(reviewRoleBrief(form({ id, revision: "2", status: "approved", note: "Evidence expectations reviewed" }))).rejects.toThrow("result=reviewed");
    expect(mocks.mutationEq).toHaveBeenCalledWith("revision", 2);
    expect(mocks.update).toHaveBeenCalledWith({ status: "approved", review_note: "Evidence expectations reviewed" });
  });
});
