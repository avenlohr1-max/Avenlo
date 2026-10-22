import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/app/components/submit-button";
import { inviteEmployer } from "./actions";
import s from "@/app/experience.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Employer onboarding — Avenlo",robots:{index:false,follow:false}};
export default async function Employers({searchParams}:{searchParams:Promise<{result?:string}>}) {
 if ((await cookies()).get("avenlo_admin_access")?.value!=="1") redirect("/admin/login");
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if (!user) redirect("/admin/login");
 const {data:operator}=await db.from("profiles").select("role,status").eq("id",user.id).maybeSingle();
 if (!operator || operator.status==="suspended" || !["staff","founder"].includes(operator.role)) redirect("/admin/login");
 const inquiries=await db.from("company_inquiries").select("id,company_name,contact_name,email,hiring_need,created_at").order("created_at",{ascending:false}).limit(50);
 const {result}=await searchParams;
 const messages:Record<string,string>={invited:"Invitation sent and the reviewed company account created.",invalid:"Complete all fields and confirm the two onboarding checks.",existing:"That account already exists or could not be checked. Review it privately before changing its access.", "invite-failed":"Invitation could not be sent. Check the account and delivery configuration before retrying.","review-required":"An invitation may have been sent, but onboarding needs review. Inspect the account before retrying."};
 return <main className={s.experience}><header className={s.pageHero}><div><Link href="/staff" className={s.textLink}>← Operations workspace</Link><span className={s.kicker}>INVITATION-ONLY EMPLOYERS</span><h1>Review first.<br />Invite with purpose.</h1><p>Company interest does not grant access. Verify the hiring authority and agree commercial terms privately before creating an employer account.</p></div></header><section className={s.section}>{result&&<p role={result==="invited"?"status":"alert"} className={s.notice}>{messages[result]||"Review the onboarding result."}</p>}
 {operator.role==="founder"&&<form action={inviteEmployer} className="form" style={{maxWidth:700}}><h2>Invite a reviewed employer</h2><label>Company name<input name="company" required minLength={2} maxLength={160}/></label><label>Contact name<input name="name" required minLength={2} maxLength={120}/></label><label>Work email<input name="email" required type="email" maxLength={254}/></label><label><span><input type="checkbox" name="verified" value="yes" required style={{width:"auto"}}/> I verified the company and this contact’s hiring authority.</span></label><label><span><input type="checkbox" name="terms" value="yes" required style={{width:"auto"}}/> The company accepted its private commercial agreement.</span></label><p>The next action sends an invitation email and enables employer access. Existing accounts require separate review; this form will not promote an existing candidate.</p><SubmitButton>Send employer invitation</SubmitButton></form>}
 <h2>Latest company interest</h2>{inquiries.error?<p role="alert">Could not load inquiries. Try again.</p>:<div className={s.tableScroll}><table><caption>Latest 50 inquiries; registering interest does not activate access</caption><thead><tr><th scope="col">Company/contact</th><th scope="col">Requirement</th><th scope="col">Received</th></tr></thead><tbody>{inquiries.data?.map(inquiry=><tr key={inquiry.id}><td><strong>{inquiry.company_name}</strong><br/>{inquiry.contact_name}<br/>{inquiry.email}</td><td style={{whiteSpace:"pre-wrap"}}>{inquiry.hiring_need}</td><td>{new Date(inquiry.created_at).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</td></tr>)}</tbody></table>{!inquiries.data?.length&&<p>No company inquiries yet.</p>}</div>}
 <Link className={s.textLink} href="/staff/directory?kind=companies">Search all onboarded companies →</Link></section></main>;
}
