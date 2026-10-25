import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("operations portal public recovery routes", () => {
  for (const host of ["staff.avenlo.in", "admin.avenlo.in"]) {
    it(`serves password recovery on ${host}`, async () => {
      const response = await proxy(new NextRequest(`https://${host}/forgot-password`));
      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  }
  it("keeps the founder workspace unavailable through the staff host", async () => {
    const response = await proxy(new NextRequest("https://staff.avenlo.in/admin"));
    expect(response.status).toBe(403);
  });
  it("keeps unknown hosts unavailable", async () => {
    const response = await proxy(new NextRequest("https://unrelated.example/forgot-password"));
    expect(response.status).toBe(404);
  });
});
