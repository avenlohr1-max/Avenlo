export type OpportunitySignal = {
  id: string; statement: string; source_label: string; source_type: string;
  source_date: string | null; context: string; uncertainty_note: string;
  verification_status: string;
};
export type OpportunityRole = {
  id: string; title: string; description: string; skills: string[] | null;
  industry: string | null; location: string | null; work_mode: string | null;
  seniority: string | null; experience_years: number | null;
  status: string; expires_at: string | null;
};

export const basisLabels: Record<string, string> = {
  title: "Role title", skills: "Listed skills", industry: "Industry", location: "Location",
  work_mode: "Work mode", seniority: "Seniority", experience_years: "Experience requested",
};

export function roleBasis(role: OpportunityRole | null, field: string): string {
  if (!role || !Object.prototype.hasOwnProperty.call(basisLabels, field)) return "Employer information unavailable";
  const value = role[field as keyof OpportunityRole];
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not specified by employer";
  if (value === null || value === "") return "Not specified by employer";
  return field === "experience_years" ? `${value} years` : String(value);
}

export function roleIsOpen(role: OpportunityRole | null, now = Date.now()): boolean {
  return Boolean(role && role.status === "open" && (!role.expires_at || Date.parse(role.expires_at) > now));
}

export function confirmedOpportunityEvidence(signals: OpportunitySignal[], linkedIds: string[]) {
  const selected = new Set(linkedIds);
  return signals.filter((signal) => selected.has(signal.id) && signal.verification_status === "candidate_confirmed");
}
