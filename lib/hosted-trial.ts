export function trialRequestPolicy(path: string, method: string): "public" | "blocked" | "authenticated" {
  if (["/join", "/auth", "/forgot-password", "/verify-email"].some(prefix => path === prefix || path.startsWith(prefix + "/"))) return "blocked";
  if (path.startsWith("/api/") || !["GET", "HEAD"].includes(method)) return "authenticated";
  return "public";
}

export function trialUserAllowed(userId: string, configuredIds: string | undefined): boolean {
  const ids = (configuredIds || "").split(",").map(id => id.trim());
  return /^[0-9a-f-]{36}$/i.test(userId) && ids.includes(userId);
}
