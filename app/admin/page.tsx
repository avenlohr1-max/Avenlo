import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/app/components/sign-out-button";
import { BrandLogo } from "@/app/components/brand-logo";
import s from "../experience.module.css";
export const metadata={title:"Founder administration — Avenlo",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Administration() {
  if ((await cookies()).get("avenlo_admin_access")?.value!=="1") redirect("/admin/login");
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const {data:profile}=await supabase.from("profiles").select("role,status").eq("id",user.id).maybeSingle();
  if (profile?.role!=="founder" || profile.status==="suspended") redirect("/admin/login");
  return <main className={s.experience}><header className={s.pageHero}><div><BrandLogo /><span className={s.kicker}>FOUNDER ADMINISTRATION</span><h1>Accountability starts here.</h1><p>Founder-only entry to platform oversight. Operational access continues to use database roles and row-level permissions.</p><SignOutButton /></div></header><section className={s.section}><div className={s.productGrid}>{[["Operations overview","Profiles, companies, inquiries and moderation.","/staff"],["Role review","Review definitions before publication.","/staff/roles"],["Opportunity review","Prepare human-reviewed suggestions.","/staff/opportunities"],["Service oversight","Review service delivery and escalations.","/staff/services"]].map(([title,description,href])=><Link key={href} href={href} className={s.productCard}><h2>{title}</h2><p>{description}</p></Link>)}</div></section></main>;
}
