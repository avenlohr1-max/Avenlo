import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { companyTenant, portalForHost } from "@/lib/portal-routing";

const within = (path:string,prefix:string) => path===prefix || path.startsWith(prefix+"/");
const noStore = (response:NextResponse) => {response.headers.set("Cache-Control","private, no-store");return response;};
export async function proxy(request: NextRequest) {
  const {portal,slug} = portalForHost(request.nextUrl.hostname);
  const path = request.nextUrl.pathname;
  if (portal==="unknown") return new NextResponse("Workspace not found.",{status:404});
  const tenantId = portal==="tenant" ? companyTenant(slug!) : null;
  if (portal==="tenant" && !tenantId) return new NextResponse("Workspace unavailable. Contact your Avenlo representative.",{status:404,headers:{"Cache-Control":"private, no-store"}});

  // Public professional profiles are separate from the internal operations surfaces.
  if (portal==="founders" || portal==="team") {
    if (path==="/") {
      const destination=request.nextUrl.clone();destination.pathname=portal==="founders"?"/founders":"/team";
      return NextResponse.rewrite(destination);
    }
    const allowed = portal==="founders" ? ["/founders","/amaan"] : ["/team"];
    if (!allowed.some(p=>within(path,p))) {
      if (within(path,"/api") || request.method!=="GET") return new NextResponse("Not found.",{status:404});
      const destination=new URL(path+request.nextUrl.search,"https://avenlo.in");
      return NextResponse.redirect(destination);
    }
    return NextResponse.next();
  }

  const operations = portal==="staff" || portal==="admin";
  const employer = portal==="companies" || portal==="tenant";
  if (employer && path==="/dashboard" && request.method==="GET") {
    return NextResponse.redirect(new URL("/company",request.url));
  }
  if (employer && request.method==="GET" && ["/products","/pricing","/join","/contact","/privacy","/terms","/refunds","/about","/founders","/team"].some(p=>within(path,p))) {
    return NextResponse.redirect(new URL(path+request.nextUrl.search,"https://avenlo.in"));
  }
  if (portal==="candidate" && process.env.AVENLO_PORTALS_ENABLED==="true") {
    let origin:string|undefined;
    if (within(path,"/company")) origin="https://companies.avenlo.in";
    if (within(path,"/staff")) origin="https://staff.avenlo.in";
    if (within(path,"/admin")) origin="https://admin.avenlo.in";
    if (origin) return NextResponse.redirect(new URL(path+request.nextUrl.search,origin),307);
  }
  let effectivePath=path;
  if (path==="/") {
    if (operations) effectivePath=portal==="admin"?"/admin":"/staff";
    if (employer) effectivePath=portal==="tenant"?"/company":"/companies";
  }
  const authPaths=["/login","/forgot-password","/auth","/verify-email","/account-suspended"];
  if (employer && !["/companies","/company","/dashboard/rooms","/api/company-inquiries",...authPaths].some(p=>within(effectivePath,p))) {
    return new NextResponse("Not found.",{status:404});
  }
  if (operations && !["/staff","/admin","/api/admin","/auth","/account-suspended"].some(p=>within(effectivePath,p))) {
    return new NextResponse("Not found.",{status:404});
  }
  if (portal==="staff" && within(effectivePath,"/admin") && effectivePath!=="/admin/login") {
    return new NextResponse("Founder access required.",{status:403});
  }
  const protectedRoute=["/dashboard","/company","/staff","/admin"].some(p=>within(effectivePath,p)) && effectivePath!=="/admin/login";
  const destination=request.nextUrl.clone();destination.pathname=effectivePath;
  let response=effectivePath===path ? NextResponse.next({request}) : NextResponse.rewrite(destination);
  if (!protectedRoute) return response;

  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return noStore(new NextResponse("Workspace configuration unavailable.",{status:503}));
  const supabase=createServerClient(url,key,{cookies:{
    getAll:()=>request.cookies.getAll(),
    setAll:(cookies)=>{
      cookies.forEach(({name,value})=>request.cookies.set(name,value));
      response=effectivePath===path ? NextResponse.next({request}) : NextResponse.rewrite(destination);
      cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    },
  }});
  const {data:{user}}=await supabase.auth.getUser();
  function redirectTo(target:string) {
    const redirect=NextResponse.redirect(new URL(target,request.url));
    response.cookies.getAll().forEach(cookie=>redirect.cookies.set(cookie));
    return noStore(redirect);
  }
  if (!user) return redirectTo(operations || within(effectivePath,"/staff") || within(effectivePath,"/admin") ? "/admin/login" : "/login");
  const {data:profile}=await supabase.from("profiles").select("status, role").eq("id",user.id).maybeSingle();
  if (!profile || profile.status==="suspended") return redirectTo("/account-suspended");
  if (!["staff","founder"].includes(profile.role) && !user.email_confirmed_at) return redirectTo("/verify-email");
  if ((portal==="admin" || effectivePath==="/admin") && profile.role!=="founder") return noStore(new NextResponse("Founder access required.",{status:403}));
  if ((operations || within(effectivePath,"/staff")) && !["staff","founder"].includes(profile.role)) return noStore(new NextResponse("Internal access required.",{status:403}));
  if ((employer && protectedRoute) || within(effectivePath,"/company")) {
    if (profile.role!=="company") return noStore(new NextResponse("An onboarded employer account is required.",{status:403}));
    if (tenantId) {
      const {data:companies}=await supabase.from("companies").select("id").eq("owner_id",user.id).limit(2);
      // Existing workspaces use a single-owner/single-company model. Fail closed
      // for multi-company owners until every query has explicit tenant context.
      if (companies?.length!==1 || companies[0].id!==tenantId) return noStore(new NextResponse("This account is not assigned to this company workspace.",{status:403}));
    }
  }
  if (within(effectivePath,"/dashboard") && !["candidate","company"].includes(profile.role)) return noStore(new NextResponse("Candidate or invited room access required.",{status:403}));
  return noStore(response);
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"]};
