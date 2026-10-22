import { createHash } from "node:crypto";
import console from "node:console";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const map = JSON.parse(readFileSync(resolve(root, "supabase/migration-map.json"), "utf8"));
const hash = (path) => createHash("sha256").update(readFileSync(path, "utf8").replace(/\r\n/g, "\n")).digest("hex");
const canonical = readdirSync(resolve(root, "supabase/migrations")).filter((name) => name.endsWith(".sql")).sort();
const archived = readdirSync(resolve(root, "supabase/legacy-migrations")).filter((name) => name.endsWith(".sql")).sort();
const mapped = map.entries.map((entry) => entry.canonical);
const sources = map.entries.map((entry) => entry.source);
const versions = canonical.map((name) => name.split("_")[0]);
if (new Set(versions).size !== versions.length || versions.some((version) => !/^\d{14}$/.test(version))) {
  throw new Error("Canonical migrations require unique CLI-generated timestamp versions");
}
// New forward migrations may follow the mapped historical prefix. Old SQL must
// remain byte-equivalent after Git's platform newline normalization.
if (JSON.stringify(canonical.slice(0, mapped.length)) !== JSON.stringify(mapped) || JSON.stringify(archived) !== JSON.stringify(sources)) {
  throw new Error("Historical migration membership or ordering changed");
}
for (const entry of map.entries) {
  if (hash(resolve(root, "supabase/migrations", entry.canonical)) !== entry.sha256 || hash(resolve(root, "supabase/legacy-migrations", entry.source)) !== entry.sha256) {
    throw new Error(`Historical SQL checksum mismatch: ${entry.source}`);
  }
}
console.log(`Verified ${map.entries.length} preserved migration mappings; ${canonical.length} unique canonical versions.`);
