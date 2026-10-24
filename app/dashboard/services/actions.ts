"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { collaborationContext } from "@/lib/collaboration-server";
import { serviceSchema } from "@/lib/collaboration";

export async function requestIntelligenceService(form: FormData) {
  const { supabase, user } = await collaborationContext(["candidate"]);
  const parsed = serviceSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/services?result=invalid");
  const { error } = await supabase.from("intelligence_cases").insert({ candidate_id: user.id, service: parsed.data.service, scope: parsed.data.scope, consent: true });
  revalidatePath("/dashboard/services"); redirect(`/dashboard/services?result=${error ? "error" : "saved"}`);
}
export async function withdrawService(form: FormData) {
  const { supabase, user } = await collaborationContext(["candidate"]);
  const parsed = z.object({ id: z.guid(), operation: z.enum(["withdraw", "delete"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/services?result=invalid");
  const query = parsed.data.operation === "delete" ? supabase.from("intelligence_cases").delete() : supabase.from("intelligence_cases").update({ consent: false, status: "closed" });
  const { data, error } = await query.eq("id", parsed.data.id).eq("candidate_id", user.id).select("id").maybeSingle();
  revalidatePath("/dashboard/services"); redirect(`/dashboard/services?result=${error || !data ? "error" : "saved"}`);
}
export async function appendCaseNote(form: FormData) {
  const { supabase, user, role } = await collaborationContext(["candidate", "staff", "founder"]);
  const destination = role === "candidate" ? "/dashboard/services" : "/staff/services";
  const parsed = z.object({ caseId: z.guid(), kind: z.enum(["scope", "progress", "correction", "escalation", "completion"]), body: z.string().trim().min(1).max(3000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`${destination}?result=invalid`);
  const { error } = await supabase.from("intelligence_case_notes").insert({ case_id: parsed.data.caseId, author_id: user.id, kind: parsed.data.kind, body: parsed.data.body });
  revalidatePath(destination); redirect(`${destination}?result=${error ? "error" : "saved"}`);
}
export async function manageServiceCase(form: FormData) {
  const { supabase, user } = await collaborationContext(["staff", "founder"]);
  const parsed = z.object({ id: z.guid(), status: z.enum(["in_progress", "escalated", "completed", "closed"]), note: z.string().trim().min(1).max(3000), declaration: z.literal("yes") }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/staff/services?result=invalid");
  const { id, status, note } = parsed.data;
  const { data, error } = await supabase.from("intelligence_cases").update({ assigned_staff: user.id, status, staff_declaration: "I have reviewed the scope, can perform this work, and have disclosed conflicts in the case notes.", resolution_note: note }).eq("id", id).select("id").maybeSingle();
  if (error || !data) redirect("/staff/services?result=error");
  revalidatePath("/staff/services"); revalidatePath("/dashboard/services"); redirect("/staff/services?result=saved");
}
