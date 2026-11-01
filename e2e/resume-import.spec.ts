import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

test("actual PDF and DOCX imports extract text and persist candidate analysis", async ({ page }) => {
  test.skip(process.env.AVENLO_LOCAL_INTEGRATION !== "true", "Disposable loopback backend only");
  test.setTimeout(120_000);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(["localhost", "127.0.0.1"]).toContain(new URL(url).hostname);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("avenlo-e2e-parser@example.test");
  await page.getByLabel("Password", { exact: true }).fill(process.env.AVENLO_E2E_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const extension of ["pdf", "docx"]) {
    const response = await page.request.post("/api/candidate/resume", {
      multipart: { file: {
        name: `synthetic.${extension}`,
        mimeType: extension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: readFileSync(`test-results/resume-fixtures/synthetic.${extension}`),
      } },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.analysis.parserNote).toBeUndefined();
    expect(body.analysis.wordCount).toBeGreaterThan(20);
    expect(body.analysis.detectedSkills).toContain("SQL");
    expect(body.analysis.contact.email).toBe(true);
    const stored = await admin.from("candidate_profiles").select("resume_path, preferences").eq("user_id", process.env.AVENLO_E2E_PARSER_ID!).single();
    expect(stored.error).toBeNull();
    expect(stored.data!.resume_path.endsWith(`resume.${extension}`)).toBe(true);
    expect(stored.data!.preferences.resume_analysis.wordCount).toBe(body.analysis.wordCount);
  }
});
