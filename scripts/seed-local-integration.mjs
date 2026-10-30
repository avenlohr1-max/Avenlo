import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import console from "node:console";
import { setTimeout } from "node:timers/promises";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (process.env.AVENLO_LOCAL_INTEGRATION !== "true" || !url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) throw new Error("Disposable loopback Supabase only");
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
for (let attempt = 0; attempt < 20; attempt++) {
  const ready = await admin.from("profiles").select("id").limit(1);
  if (!ready.error) break;
  if (attempt === 19) throw ready.error;
  await setTimeout(500);
}
const password = `${randomUUID()}Aa!9`;
const env = { AVENLO_E2E_PASSWORD: password };
for (const role of ["candidate", "company", "staff", "founder", "billing"]) {
  const email = `avenlo-e2e-${role}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Synthetic ${role}`, account_type: role === "company" ? "company" : "candidate" } });
  if (error || !data.user) throw error ?? new Error("Missing synthetic user");
  const update = await admin.from("profiles").update({ role: role === "billing" ? "candidate" : role, status: "active" }).eq("id", data.user.id);
  if (update.error) throw update.error;
  env[`AVENLO_E2E_${role.toUpperCase()}_ID`] = data.user.id;
}
const { data: company, error: companyError } = await admin.from("companies").insert({ owner_id: env.AVENLO_E2E_COMPANY_ID, name: "Synthetic CI Company" }).select("id").single();
if (companyError) throw companyError;
const { data: job, error: jobError } = await admin.from("jobs").insert({ company_id: company.id, created_by: env.AVENLO_E2E_COMPANY_ID, title: "Synthetic reporting role", description: "Discuss reporting outcomes", status: "open" }).select("id").single();
if (jobError) throw jobError;
env.AVENLO_E2E_JOB_ID = job.id;
const signal = await admin.from("candidate_signals").insert({ candidate_id: env.AVENLO_E2E_CANDIDATE_ID, signal_type: "experience", statement: "Built a reporting process", source_type: "candidate", source_label: "Synthetic project", context: "Disposable test evidence", uncertainty_note: "Self reported; no independent verification", verification_status: "candidate_confirmed" }).select("id").single();
if (signal.error) throw signal.error;
env.AVENLO_E2E_SIGNAL_ID = signal.data.id;
if (!process.env.GITHUB_ENV) throw new Error("Expected disposable GitHub Actions environment");
for (const [name, value] of Object.entries(env)) {
  if (name.includes("PASSWORD")) process.stdout.write(`::add-mask::${value}\n`);
  appendFileSync(process.env.GITHUB_ENV, `${name}=${value}\n`);
}
console.log("Created three disposable role accounts, one company, one role and one signal.");
