import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), profile: vi.fn(), orders: vi.fn(), verify: vi.fn(),
  revoke: vi.fn(), list: vi.fn(), remove: vi.fn(), deleteUser: vi.fn(), clear: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser, signOut: mocks.clear },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }),
}) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({
  auth: { admin: { signOut: mocks.revoke, deleteUser: mocks.deleteUser } },
  from: () => ({ select: () => ({ eq: mocks.orders }) }),
  storage: { from: () => ({ list: mocks.list, remove: mocks.remove }) },
}) }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { signInWithPassword: mocks.verify } }) }));

import { DELETE } from "./route";

const id = "10000000-0000-0000-0000-000000000001";
function request(body: unknown = { confirmation: "DELETE", password: "current-password" }, origin = "https://avenlo.test") {
  return new Request("https://avenlo.test/api/candidate/account", {
    method: "DELETE", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ENABLE_CANDIDATE_ACCOUNT_ERASURE", "true");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://avenlo.test");
  mocks.getUser.mockResolvedValue({ data: { user: { id, email: "candidate@example.test" } }, error: null });
  mocks.profile.mockResolvedValue({ data: { role: "candidate" }, error: null });
  mocks.orders.mockResolvedValue({ count: 0, error: null });
  mocks.verify.mockResolvedValue({ data: { user: { id }, session: { access_token: "verification-session" } }, error: null });
  mocks.revoke.mockResolvedValue({ error: null });
  mocks.list.mockResolvedValue({ data: [{ id: "object-id", name: "resume.pdf" }], error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.deleteUser.mockResolvedValue({ error: null });
  mocks.clear.mockResolvedValue({ error: null });
});

describe("candidate account erasure", () => {
  it("stays disabled unless explicitly enabled", async () => {
    vi.stubEnv("ENABLE_CANDIDATE_ACCOUNT_ERASURE", "false");
    expect((await DELETE(request())).status).toBe(503);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it.each(["https://other.test", "null", ""])("rejects origin %s before using credentials", async (origin) => {
    expect((await DELETE(request(undefined, origin))).status).toBe(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("uses the canonical public origin behind an internal Next server hostname", async () => {
    const internalRequest = new Request("http://localhost:3000/api/candidate/account", { method: "DELETE", headers: { origin: "https://avenlo.test", "content-type": "application/json" }, body: JSON.stringify({ confirmation: "DELETE", password: "current-password" }) });
    expect((await DELETE(internalRequest)).status).toBe(200);
    expect(mocks.deleteUser).toHaveBeenCalledWith(id, false);
  });

  it("fails closed on invalid site configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-url");
    expect((await DELETE(request())).status).toBe(503);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it.each([null, {}, { confirmation: "delete", password: "password" }, { confirmation: "DELETE", password: "" }, { confirmation: "DELETE", password: 123 }])("requires explicit confirmation and a password: %j", async (body) => {
    expect((await DELETE(request(body))).status).toBe(400);
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await DELETE(new Request("https://avenlo.test/api/candidate/account", { method: "DELETE", headers: { origin: "https://avenlo.test", "content-type": "application/json" }, body: "{" }));
    expect(response.status).toBe(400);
  });

  it("requires a validated session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await DELETE(request())).status).toBe(401);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it.each(["company", "staff", "founder"])("does not erase a %s account", async (role) => {
    mocks.profile.mockResolvedValue({ data: { role }, error: null });
    expect((await DELETE(request())).status).toBe(403);
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("requires support review for any service order", async () => {
    mocks.orders.mockResolvedValue({ count: 1, error: null });
    expect((await DELETE(request())).status).toBe(409);
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("fails closed when service records cannot be checked", async () => {
    mocks.orders.mockResolvedValue({ count: null, error: new Error("unavailable") });
    expect((await DELETE(request())).status).toBe(503);
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("refuses an incorrect password before revocation or deletion", async () => {
    mocks.verify.mockResolvedValue({ data: { user: null, session: null }, error: new Error("incorrect-password") });
    expect((await DELETE(request())).status).toBe(403);
    expect(mocks.revoke).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("rejects a verifier identity mismatch and clears that session", async () => {
    mocks.verify.mockResolvedValue({ data: { user: { id: "another-user" }, session: { access_token: "unexpected-session" } }, error: null });
    expect((await DELETE(request())).status).toBe(403);
    expect(mocks.revoke).toHaveBeenCalledWith("unexpected-session", "local");
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("stops before document cleanup if sessions cannot be revoked", async () => {
    mocks.revoke.mockResolvedValue({ error: new Error("auth-unavailable") });
    expect((await DELETE(request())).status).toBe(503);
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("uses the authenticated identity and deletes files before the Auth user", async () => {
    const response = await DELETE(request({ confirmation: "DELETE", password: "current-password", user_id: "victim", resume_path: "victim/resume.pdf" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });
    expect(mocks.verify).toHaveBeenCalledWith({ email: "candidate@example.test", password: "current-password" });
    expect(mocks.revoke).toHaveBeenCalledWith("verification-session", "global");
    expect(mocks.list).toHaveBeenCalledWith(id, expect.objectContaining({ offset: 0 }));
    expect(mocks.remove).toHaveBeenCalledWith([`${id}/resume.pdf`]);
    expect(mocks.deleteUser).toHaveBeenCalledWith(id, false);
    expect(mocks.revoke.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
    expect(mocks.remove.mock.invocationCallOrder[0]).toBeLessThan(mocks.deleteUser.mock.invocationCallOrder[0]);
    expect(mocks.clear).toHaveBeenCalledWith({ scope: "local" });
  });

  it("finds old formats and nested files before mutating the object list", async () => {
    mocks.list.mockResolvedValueOnce({ data: [{ id: "pdf", name: "resume.pdf" }, { id: null, name: "legacy" }], error: null })
      .mockResolvedValueOnce({ data: [{ id: "docx", name: "resume.docx" }], error: null });
    expect((await DELETE(request())).status).toBe(200);
    expect(mocks.list).toHaveBeenNthCalledWith(2, `${id}/legacy`, expect.anything());
    expect(mocks.remove).toHaveBeenCalledWith([`${id}/resume.pdf`, `${id}/legacy/resume.docx`]);
  });

  it("paginates object discovery and batches removals", async () => {
    mocks.list.mockResolvedValueOnce({ data: Array.from({ length: 100 }, (_, index) => ({ id: `object-${index}`, name: `old-${index}.pdf` })), error: null })
      .mockResolvedValueOnce({ data: [{ id: "last", name: "resume.docx" }], error: null });
    expect((await DELETE(request())).status).toBe(200);
    expect(mocks.list).toHaveBeenNthCalledWith(2, id, expect.objectContaining({ offset: 100 }));
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    expect(mocks.remove.mock.calls[0][0]).toHaveLength(100);
    expect(mocks.remove.mock.calls[1][0]).toEqual([`${id}/resume.docx`]);
  });

  it.each(["list", "remove"] as const)("does not delete Auth after a Storage %s failure", async (stage) => {
    mocks[stage].mockResolvedValue({ data: null, error: new Error("storage-unavailable") });
    const response = await DELETE(request());
    expect(response.status).toBe(503);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(await response.text()).toContain("some resume files may have been removed");
  });

  it("refuses malformed object paths", async () => {
    mocks.list.mockResolvedValue({ data: [{ id: "unexpected", name: "../other-account.pdf" }], error: null });
    expect((await DELETE(request())).status).toBe(503);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("reports Auth deletion failure without claiming success", async () => {
    mocks.deleteUser.mockResolvedValue({ error: new Error("foreign-key") });
    const response = await DELETE(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('"deleted":true');
    expect(mocks.clear).not.toHaveBeenCalled();
  });
});
