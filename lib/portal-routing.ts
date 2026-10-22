export type Portal = "candidate" | "companies" | "staff" | "admin" | "founders" | "team" | "tenant" | "unknown" | "development";
const reserved: Record<string,Portal> = {companies:"companies",staff:"staff",admin:"admin",founders:"founders",team:"team"};
export function portalForHost(host: string): {portal:Portal;slug?:string} {
  const name = host.toLowerCase().replace(/:\d+$/, "");
  if (name === "avenlo.in" || name === "www.avenlo.in") return {portal:"candidate"};
  if (name === "localhost" || name === "127.0.0.1" || name.endsWith(".vercel.app") || name.endsWith(".netlify.app")) return {portal:"development"};
  if (!name.endsWith(".avenlo.in")) return {portal:"unknown"};
  const slug = name.slice(0,-".avenlo.in".length);
  if (Object.hasOwn(reserved,slug)) return {portal:reserved[slug]};
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) return {portal:"unknown"};
  return {portal:"tenant",slug};
}
export function companyTenant(slug:string): string | null {
  // Provisioned by the release operator after a signed contract and active-hiring check.
  // Host names never create membership, discover companies by name or bypass RLS.
  try {
    const config: unknown = JSON.parse(process.env.AVENLO_COMPANY_TENANTS || "{}");
    if (!config || typeof config !== "object" || !Object.hasOwn(config,slug)) return null;
    const entry = (config as Record<string,unknown>)[slug];
    if (!entry || typeof entry !== "object") return null;
    const value = entry as Record<string,unknown>;
    return value.contractActive === true && value.activeHiring === true &&
      typeof value.companyId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.companyId)
      ? value.companyId : null;
  } catch { return null; }
}
