"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteEmployer(form: FormData) {
  if ((await cookies()).get("avenlo_admin_access")?.value!=="1") redirect("/admin/login");
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if (!user) redirect("/admin/login");
  const {data:operator}=await db.from("profiles").select("role,status").eq("id",user.id).maybeSingle();
  if (operator?.role!=="founder" || operator.status==="suspended") redirect("/staff");
  const parsed=z.object({
    company:z.string().trim().min(2).max(160),name:z.string().trim().min(2).max(120),
    email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),
    verified:z.literal("yes"),terms:z.literal("yes"),
  }).safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) redirect("/staff/employers?result=invalid");
  const admin=createAdminClient();
  const existing=await admin.from("profiles").select("id").eq("email",parsed.data.email).maybeSingle();
  if (existing.error || existing.data) redirect("/staff/employers?result=existing");
  const invitation=await admin.auth.admin.inviteUserByEmail(parsed.data.email,{
    data:{full_name:parsed.data.name},
    redirectTo:"https://companies.avenlo.in/auth/reset-password",
  });
  if (invitation.error || !invitation.data.user) redirect("/staff/employers?result=invite-failed");
  const id=invitation.data.user.id;
  const promoted=await admin.from("profiles").update({role:"company",status:"active"}).eq("id",id);
  if (promoted.error) redirect("/staff/employers?result=review-required");
  const company=await admin.from("companies").insert({owner_id:id,name:parsed.data.company}).select("id").single();
  if (company.error) redirect("/staff/employers?result=review-required");
  const audit=await admin.from("audit_logs").insert({actor_id:user.id,action:"employer.invited_after_review",entity_type:"company",entity_id:company.data.id,metadata:{hiring_authority_checked:true,private_terms_accepted:true}});
  if (audit.error) redirect("/staff/employers?result=review-required");
  redirect("/staff/employers?result=invited");
}
