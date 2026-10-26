/** Display expiry only; a saved UPI QR cannot revoke a bank transfer. */
export function checkoutSecondsRemaining(expiresAt: string, now = Date.now()) {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now) / 1000)) : 0;
}

/** Interpret the operator's bank-credit entry in IST, never the server timezone. */
export function bankCreditTimeUtc(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value)) return null;
  const wallTime = new Date(`${value}:00Z`);
  if (!Number.isFinite(wallTime.getTime()) || wallTime.toISOString().slice(0, 16) !== value) return null;
  return new Date(wallTime.getTime() - 330 * 60 * 1000).toISOString();
}
