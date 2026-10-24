"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function reviewRoleBrief(form: FormData) {
  const jar = await cookies();
  if (jar.get("avenlo_admin_access")?.value !== "1") redirect("/admin/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "staff" && profile?.role !== "founder") redirect("/admin/login");
  const parsed = z.object({ id: z.guid(), revision: z.coerce.number().int().positive(), status: z.enum(["approved", "changes_requested"]), note: z.string().trim().min(1).max(2000) }).safeParse({
    id: form.get("id"), revision: form.get("revision"), status: form.get("status"), note: form.get("note"),
  });
  if (!parsed.success) redirect("/staff/roles?result=invalid");
  const { data, error } = await supabase.from("employer_role_briefs").update({ status: parsed.data.status, review_note: parsed.data.note })
    .eq("id", parsed.data.id).eq("revision", parsed.data.revision).select("id").maybeSingle();
  if (error || !data) redirect("/staff/roles?result=error");
  revalidatePath("/staff/roles"); revalidatePath("/company/roles");
  redirect("/staff/roles?result=reviewed");
}
