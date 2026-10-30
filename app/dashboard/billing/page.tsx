import Link from "next/link";
import { collaborationContext } from "@/lib/collaboration-server";
import { invoiceMoney } from "@/lib/payments/invoice";
import { paymentTime } from "@/lib/payments/upi";
import { BrandLogo } from "@/app/components/brand-logo";
import s from "./invoice.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Billing history — Avenlo", robots: { index: false, follow: false } };
export default async function Billing() {
  const { supabase,user,role } = await collaborationContext(["candidate","founder"]);
  const query = supabase.from("candidate_service_orders").select("id,price,currency,payment_status,created_at").order("created_at",{ascending:false}).limit(50);
  const { data,error } = await (role === "candidate" ? query.eq("candidate_id",user.id) : query);
  return <main className={s.page}><div className={s.paper}><BrandLogo /><Link href={role === "founder" ? "/admin" : "/dashboard"}>← Workspace</Link><h1>Billing history</h1><p>Your last 50 orders and invoices. Payment confirmation is automatic; you do not need to enter a UTR.</p>{error ? <p role="alert">Billing history is temporarily unavailable. Contact support@avenlo.in. Do not pay again.</p> : !data?.length ? <p>No orders yet.</p> : <ul className={s.history}>{data.map(order => <li key={order.id}><Link href={`/dashboard/billing/${order.id}`}><strong>{invoiceMoney(Math.round(Number(order.price)*100),order.currency)}</strong><span>{order.payment_status} · {paymentTime(order.created_at)}</span><span>View invoice / confirmation →</span></Link></li>)}</ul>}</div></main>;
}
