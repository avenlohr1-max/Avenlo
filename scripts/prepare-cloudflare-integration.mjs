import { writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (process.env.AVENLO_LOCAL_INTEGRATION !== "true" || !url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
  throw new Error("Disposable loopback Supabase only");
}
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("Missing disposable service key");
writeFileSync(".dev.vars", `SUPABASE_SERVICE_ROLE_KEY=${JSON.stringify(key)}\n`, { mode: 0o600 });
