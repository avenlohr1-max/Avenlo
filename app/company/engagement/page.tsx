import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import s from "@/app/experience.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Private engagement terms — Avenlo",robots:{index:false,follow:false}};
export default async function Engagement() {
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if (!user) redirect("/login");
 const {data:profile}=await db.from("profiles").select("role,status").eq("id",user.id).maybeSingle();
 if (profile?.role!=="company" || profile.status==="suspended") redirect("/login");
 return <main className={s.experience}><header className={s.pageHero}><div><Link className={s.textLink} href="/company">← Company workspace</Link><span className={s.kicker}>PRIVATE EMPLOYER ENGAGEMENT</span><h1>A clear relationship.<br />A shared understanding.</h1><p>Your fee schedule and signed agreement are shared privately by the Avenlo team. Employer rates are not published on the website.</p></div></header><section className={s.section}><div className={s.threeColumns}><article className={s.feature}><span>PAYMENT</span><h2>Within 60 days</h2><p>Employer payment is due within 60 days of placement. Unpaid amounts after that deadline are referred for formal collections and legal review under the signed agreement. The agreement identifies the placement date and applicable invoice details.</p></article><article className={s.feature}><span>REPLACEMENT</span><h2>A 90-day window</h2><p>If the placed candidate leaves within 90 days of placement, Avenlo provides one replacement search at no additional placement fee. The engagement agreement records the placement date and replacement process.</p></article><article className={s.feature}><span>AFTER THE WINDOW</span><h2>A new engagement</h2><p>There is no free replacement after 90 days. Contact your Avenlo representative to agree the scope and private terms for a new search.</p></article></div><p className={s.notice}>A replacement search is not an automatic cash refund or a guaranteed replacement hire. Your assigned Avenlo representative handles requests and confirms the recorded placement date. This page does not calculate an invoice or initiate legal action.</p><a className={s.textLink} href="mailto:companies@avenlo.in">Contact the Avenlo team →</a></section></main>;
}
