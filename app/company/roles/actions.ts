"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reviewGaps, roleDefinitionSchema } from "@/lib/role-definition";
import { collaborationContext } from "@/lib/collaboration-server";

export async function proposeJobFromBrief(form: FormData) {
  const { supabase, user } = await collaborationContext(["company"]);
  const parsed = z.object({ id: z.guid(), revision: z.coerce.number().int().positive() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/company/roles?result=invalid");
  const { data: brief, error: lookupError } = await supabase.from("employer_role_briefs").select("*").eq("id", parsed.data.id).eq("revision", parsed.data.revision).eq("status", "approved").maybeSingle();
  if (lookupError || !brief) redirect("/company/roles?result=error");
  const { data: company } = await supabase.from("companies").select("id").eq("id", brief.company_id).eq("owner_id", user.id).maybeSingle();
  if (!company) redirect("/company/roles?result=error");
  const { error } = await supabase.from("jobs").insert({ company_id: company.id, created_by: user.id, title: brief.title, description: brief.summary, location: brief.location, work_mode: brief.work_mode, role_brief_id: brief.id, role_brief_revision: brief.revision, status: "pending_review" });
  if (error) redirect("/company/roles?result=error");
  revalidatePath("/company"); revalidatePath("/staff"); redirect("/company");
}

export async function saveRoleBrief(form: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "company") redirect("/dashboard");
  const identity = z.object({ companyId: z.guid(), id: z.guid().optional(), revision: z.coerce.number().int().positive().optional(), status: z.enum(["draft", "submitted"]) }).safeParse({
    companyId: form.get("companyId"), id: form.get("id") || undefined, revision: form.get("revision") || undefined, status: form.get("status"),
  });
  if (!identity.success) redirect("/company/roles?result=invalid");
  const target = identity.data.id ? `/company/roles?edit=${identity.data.id}&` : "/company/roles?";
  let raw: unknown;
  try { raw = JSON.parse(String(form.get("definition"))); } catch { redirect(`${target}result=invalid`); }
  const parsed = roleDefinitionSchema.safeParse(raw);
  if (!parsed.success || (identity.data.status === "submitted" && reviewGaps(parsed.data).length)) redirect(`${target}result=invalid`);
  const { data: company } = await supabase.from("companies").select("id").eq("id", identity.data.companyId).eq("owner_id", user.id).maybeSingle();
  if (!company) redirect(`${target}result=error`);
  const payload = { ...parsed.data, company_id: company.id, status: identity.data.status };
  const result = identity.data.id
    ? await supabase.from("employer_role_briefs").update(payload).eq("id", identity.data.id).eq("revision", identity.data.revision ?? 0).select("id").maybeSingle()
    : await supabase.from("employer_role_briefs").insert({ ...payload, created_by: user.id }).select("id").single();
  if (result.error || !result.data) redirect(`${target}result=error`);
  revalidatePath("/company/roles"); revalidatePath("/staff/roles");
  redirect(`/company/roles?edit=${result.data.id}&result=saved`);
}
