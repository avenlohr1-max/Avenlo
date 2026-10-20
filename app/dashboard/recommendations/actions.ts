"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const destination = "/dashboard/recommendations";
async function candidateContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "candidate") redirect("/dashboard");
  return { supabase, user };
}

export async function saveOpportunityDecision(form: FormData) {
  const { supabase, user } = await candidateContext();
  const parsed = z.object({ opportunityId: z.string().uuid(), disposition: z.enum(["considering", "saved", "dismissed"]), note: z.string().trim().max(2000) }).safeParse({
    opportunityId: form.get("opportunityId"), disposition: form.get("disposition"), note: form.get("note") ?? "",
  });
  if (!parsed.success) redirect(`${destination}?result=invalid`);
  const { error } = await supabase.from("candidate_opportunity_decisions").upsert({
    opportunity_id: parsed.data.opportunityId, candidate_id: user.id,
    disposition: parsed.data.disposition, private_note: parsed.data.note, updated_at: new Date().toISOString(),
  }, { onConflict: "opportunity_id" });
  if (error) redirect(`${destination}?result=error`);
  revalidatePath(destination);
  redirect(`${destination}?result=saved`);
}

export async function linkOpportunityEvidence(form: FormData) {
  const { supabase, user } = await candidateContext();
  const parsed = z.object({ opportunityId: z.string().uuid(), signalId: z.string().uuid(), operation: z.enum(["link", "remove"]) }).safeParse({
    opportunityId: form.get("opportunityId"), signalId: form.get("signalId"), operation: form.get("operation"),
  });
  if (!parsed.success) redirect(`${destination}?result=invalid`);
  const { opportunityId, signalId, operation } = parsed.data;
  const result = operation === "remove"
    ? await supabase.from("candidate_opportunity_evidence").delete().eq("opportunity_id", opportunityId).eq("signal_id", signalId).eq("candidate_id", user.id)
    : await supabase.from("candidate_opportunity_evidence").insert({ opportunity_id: opportunityId, signal_id: signalId, candidate_id: user.id });
  if (result.error) redirect(`${destination}?result=error`);
  revalidatePath(destination);
  redirect(`${destination}?result=saved`);
}
