"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function curateOpportunity(form: FormData) {
  const cookieStore = await cookies();
  if (cookieStore.get("avenlo_admin_access")?.value !== "1") redirect("/admin/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "staff" && profile?.role !== "founder") redirect("/admin/login");
  const parsed = z.object({ candidateId: z.string().uuid(), jobId: z.string().uuid(), basis: z.enum(["title", "skills", "industry", "location", "work_mode", "seniority", "experience_years"]), note: z.string().trim().min(1).max(2000) }).safeParse({
    candidateId: form.get("candidateId"), jobId: form.get("jobId"), basis: form.get("basis"), note: form.get("note"),
  });
  if (!parsed.success) redirect("/staff/opportunities?result=invalid");
  const { error } = await supabase.from("candidate_opportunities").insert({
    candidate_id: parsed.data.candidateId, job_id: parsed.data.jobId, curator_id: user.id,
    basis_field: parsed.data.basis, curator_note: parsed.data.note,
  });
  if (error) redirect("/staff/opportunities?result=error");
  revalidatePath("/dashboard/recommendations"); revalidatePath("/staff/opportunities");
  redirect("/staff/opportunities?result=created");
}
