import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function collaborationContext(allowed: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error } = await supabase.from("profiles").select("role, status").eq("id", user.id).maybeSingle();
  if (error || !profile || profile.status === "suspended" || !allowed.includes(profile.role)) redirect("/dashboard");
  if (!["staff", "founder"].includes(profile.role) && !user.email_confirmed_at) redirect("/verify-email");
  if (["staff", "founder"].includes(profile.role) && (await cookies()).get("avenlo_admin_access")?.value !== "1") redirect("/admin/login");
  return { supabase, user, role: profile.role as string };
}
