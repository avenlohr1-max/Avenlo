import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccount } from "./delete-account";

export const metadata = { title: "Account settings — Avenlo" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "candidate") redirect("/dashboard");
  return <main className="section section--light"><div className="container" style={{ maxWidth: 720 }}>
    <Link href="/dashboard/profile">← Back to your Talent Record</Link>
    <h1>Account settings</h1>
    <DeleteAccount enabled={process.env.ENABLE_CANDIDATE_ACCOUNT_ERASURE === "true"} />
  </div></main>;
}
