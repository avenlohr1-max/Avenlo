import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileStatusControl } from "../profile-status-control";
import s from "@/app/experience.module.css";

export const dynamic="force-dynamic";
export const metadata={title:"People and company directory — Avenlo operations",robots:{index:false,follow:false}};
type Params={q?:string;field?:string;role?:string;kind?:string;page?:string};
const pageSize=50;
export default async function Directory({searchParams}:{searchParams:Promise<Params>}) {
  if ((await cookies()).get("avenlo_admin_access")?.value!=="1") redirect("/admin/login");
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if (!user) redirect("/admin/login");
  const {data:operator}=await db.from("profiles").select("role,status").eq("id",user.id).maybeSingle();
  if (!operator || operator.status==="suspended" || !["staff","founder"].includes(operator.role)) redirect("/admin/login");
  const params=await searchParams;
  const q=typeof params.q==="string"?params.q.trim().slice(0,120):"";
  const field=params.field==="email"?"email":"full_name";
  const role=typeof params.role==="string" && ["candidate","company","staff","founder"].includes(params.role)?params.role:"";
  const kind=params.kind==="companies"?"companies":"people";
  const page=typeof params.page==="string" && /^[1-9]\d{0,4}$/.test(params.page)?Number(params.page):1;
  const escaped=q.replace(/[\\%_]/g,"\\$&");
  let peopleQuery=db.from("profiles").select("id,full_name,email,role,status,created_at",{count:"exact"}).order("created_at",{ascending:false}).order("id",{ascending:false});
  if(q) peopleQuery=peopleQuery.ilike(field,"%"+escaped+"%");
  if(role) peopleQuery=peopleQuery.eq("role",role);
  let companyQuery=db.from("companies").select("id,name,industry,location,created_at",{count:"exact"}).order("created_at",{ascending:false}).order("id",{ascending:false});
  if(q) companyQuery=companyQuery.ilike("name","%"+escaped+"%");
  const people=kind==="people"?await peopleQuery.range((page-1)*pageSize,page*pageSize-1):null;
  const companies=kind==="companies"?await companyQuery.range((page-1)*pageSize,page*pageSize-1):null;
  const result=people??companies;
  const count=result?.count??0;
  function pageHref(next:number) {
    const p=new URLSearchParams({kind,q,field,role,page:String(next)});
    return "/staff/directory?"+p.toString();
  }
  return <main className={s.experience}><header className={s.pageHero}><div><Link className={s.textLink} href="/staff">← Operations workspace</Link><span className={s.kicker}>PRIVATE DIRECTORY</span><h1>Find the person.<br />Understand the company.</h1><p>Search and page through the complete authorized directory. Results are limited to 50 records per page.</p></div></header><section className={s.section}>
  <nav className={s.directory} aria-label="Directory type"><Link href="/staff/directory?kind=people" aria-current={kind==="people"?"page":undefined}>People</Link><Link href="/staff/directory?kind=companies" aria-current={kind==="companies"?"page":undefined}>Companies</Link></nav>
  <form action="/staff/directory" className="form" style={{maxWidth:760,marginTop:24}}><input type="hidden" name="kind" value={kind}/><div className="form-grid"><label>{kind==="companies"?"Company name":"Search"}<input name="q" maxLength={120} defaultValue={q} placeholder={kind==="companies"?"Company name":"Name or email"}/></label>{kind==="people" && <label>Search field<select name="field" defaultValue={field}><option value="full_name">Name</option><option value="email">Email</option></select></label>}</div>{kind==="people" && <label>Account role<select name="role" defaultValue={role}><option value="">All roles</option><option value="candidate">Candidates</option><option value="company">Employers</option><option value="staff">Staff</option><option value="founder">Founders</option></select></label>}<div className={s.actions}><button className="btn btn--primary" type="submit">Search directory</button><Link className={s.textLink} href={"/staff/directory?kind="+kind}>Clear filters</Link></div></form>
  {result?.error?<p role="alert">The directory could not be loaded. Try again; no account has been changed.</p>:<><p className={s.micro}>{count} matching {kind==="people"?"accounts":"companies"} · Page {page}{count>0?" of "+Math.ceil(count/pageSize):""}</p><div className={s.tableScroll}><table><caption>{kind==="people"?"Authorized people directory":"Authorized company directory"}</caption><thead><tr>{(kind==="people"?["Person","Role","Status","Created","Action"]:["Company","Industry","Location","Created"]).map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{people?.data?.map(person=><tr key={person.id}><td><strong>{person.full_name||"Unnamed account"}</strong><br/>{person.email}{person.role==="candidate"&&<><br/><Link href={"/staff/opportunities?candidate="+person.id}>Curate an opportunity →</Link></>}</td><td>{person.role}</td><td>{person.status}</td><td>{new Date(person.created_at).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</td><td><ProfileStatusControl userId={person.id} status={person.status as "draft"|"active"|"suspended"|"archived"}/></td></tr>)}{companies?.data?.map(company=><tr key={company.id}><td>{company.name}</td><td>{company.industry||"—"}</td><td>{company.location||"—"}</td><td>{new Date(company.created_at).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</td></tr>)}</tbody></table></div>{count===0&&<p>No results match these filters.</p>}<nav aria-label="Directory pagination" className={s.actions}>{page>1&&<Link className={s.textLink} href={pageHref(page-1)}>← Previous page</Link>}{page*pageSize<count&&<Link className={s.textLink} href={pageHref(page+1)}>Next page →</Link>}</nav></>}
  </section></main>;
}
