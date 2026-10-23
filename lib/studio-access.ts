import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function canUseContentStudio(): Promise<boolean> {
  if ((await cookies()).get("avenlo_admin_access")?.value !== "1") return false;
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return false;
  const { data: profile } = await db.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  return !!profile && profile.status !== "suspended" && ["staff", "founder"].includes(profile.role);
}
