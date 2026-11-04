import { readFileSync } from "node:fs";
import console from "node:console";

const report = JSON.parse(readFileSync("dist/server/vinext-prerender.json", "utf8"));
const errors = report.routes.filter(route => route.status === "error");
const rendered = report.routes.filter(route => route.status === "rendered").map(route => route.route);
const required = ["/", "/products", "/pricing", "/contact", "/privacy", "/terms", "/refunds"];
const privatePrefixes = ["/dashboard", "/company", "/staff", "/admin", "/api"];
const leaked = rendered.filter(route => privatePrefixes.some(prefix => route === prefix || route.startsWith(prefix + "/")));
const missing = required.filter(route => !rendered.includes(route));
if (errors.length || leaked.length || missing.length) {
  throw new Error(`Static build rejected: ${JSON.stringify({ errors, leaked, missing })}`);
}
console.log(`Verified ${rendered.length} public/static routes; account, operations and API routes excluded.`);
