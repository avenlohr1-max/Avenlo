import { z } from "zod";

export const criterionSchema = z.object({ requirement: z.string().trim().max(500), evidence: z.string().trim().max(1000), rationale: z.string().trim().max(1000) });
export const roleDefinitionSchema = z.object({
  title: z.string().trim().min(1).max(160), summary: z.string().trim().max(4000),
  outcomes: z.array(z.string().trim().min(1).max(500)).max(12),
  essential: z.array(criterionSchema).max(12), preferred: z.array(criterionSchema).max(12),
  location: z.string().trim().max(200), work_mode: z.string().trim().max(100),
}).superRefine((value, context) => {
  const requirements = [...value.essential, ...value.preferred].map((item) => item.requirement.trim().toLowerCase().replace(/\s+/g, " ")).filter(Boolean);
  if (new Set(requirements).size !== requirements.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "Keep each requirement in one category and remove duplicates." });
});
export type RoleDefinition = z.infer<typeof roleDefinitionSchema>;
export type RoleBrief = RoleDefinition & {
  id: string; company_id: string; status: "draft" | "submitted" | "changes_requested" | "approved";
  revision: number; review_note: string | null; reviewed_at: string | null; updated_at: string;
};

export function reviewGaps(definition: RoleDefinition): string[] {
  const result: string[] = [];
  if (!definition.title.trim()) result.push("Add a role title.");
  if (!definition.summary.trim()) result.push("Describe the role's purpose.");
  if (!definition.outcomes.length) result.push("Add at least one role outcome.");
  if (!definition.essential.length) result.push("Add at least one essential requirement.");
  definition.essential.forEach((item, index) => {
    if (!item.requirement.trim() || !item.evidence.trim() || !item.rationale.trim()) result.push(`Essential ${index + 1} needs a requirement, expected evidence and a reason it is essential.`);
  });
  definition.preferred.forEach((item, index) => {
    if (!item.requirement.trim() || !item.evidence.trim()) result.push(`Preferred ${index + 1} needs a requirement and expected evidence.`);
  });
  return result;
}
