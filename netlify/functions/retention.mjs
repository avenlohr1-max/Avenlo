import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import console from "node:console";

// Netlify scheduled functions cannot be invoked through a public HTTP URL.
export default async function retention() {
  if (process.env.AVENLO_RETENTION_ENABLED !== "true") {
    console.info("Retention schedule held until approved migration and readback.");
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Retention service configuration missing.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("run_approved_retention", { p_execute: true });
  if (error) throw new Error("Retention failed; inspect the private database logs.");
  console.info("Approved retention completed", data);
}
