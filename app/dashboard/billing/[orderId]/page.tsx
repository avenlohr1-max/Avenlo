import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { collaborationContext } from "@/lib/collaboration-server";
import { invoiceAmountWords, invoiceMoney, invoiceSnapshotSchema } from "@/lib/payments/invoice";
import { paymentTime } from "@/lib/payments/upi";
import { BrandLogo } from "@/app/components/brand-logo";
import { PrintInvoice, PendingInvoice } from "../controls";
import s from "../invoice.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your invoice — Avenlo", robots: { index: false, follow: false } };

export default async function Invoice({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!z.guid().safeParse(orderId).success) notFound();
  const { supabase, user, role } = await collaborationContext(["candidate", "founder"]);
  const billingPath = role === "founder" ? "/admin/billing" : "/dashboard/billing";
  const orderQuery = supabase.from("candidate_service_orders").select("id,candidate_id,payment_status,status,created_at").eq("id",orderId);
  const { data: order, error: orderError } = await (role === "candidate" ? orderQuery.eq("candidate_id",user.id) : orderQuery).maybeSingle();
  if (orderError) throw new Error("Billing is temporarily unavailable. Please retry; do not pay again.");
  if (!order) notFound();
  const { data: invoice, error } = await supabase.from("avenlo_invoices").select("*").eq("service_order_id",orderId).maybeSingle();
  if (error) throw new Error("Invoice retrieval failed. Please retry; do not pay again.");
  if (!invoice) return <main className={s.page}><div className={s.paper}><BrandLogo /><h1>Confirming your payment.</h1><p>Order {order.id}</p>{order.payment_status === "pending" && order.status === "payment_pending" ? <PendingInvoice /> : <p>Contact support@avenlo.in for the payment or invoice status. Do not pay again.</p>}<Link href={billingPath}>Your billing history</Link></div></main>;
  const parsed = invoiceSnapshotSchema.safeParse(invoice.snapshot);
  if (!parsed.success || parsed.data.amountPaise !== invoice.amount_paise || parsed.data.currency !== invoice.currency) throw new Error("Invoice data needs review. Contact support@avenlo.in.");
  const data = parsed.data;
  const total = invoiceMoney(invoice.amount_paise,invoice.currency);
  return <main className={s.page}><nav className={s.tools}><Link href={billingPath}>← Billing history</Link><PrintInvoice /></nav>
    {order.payment_status !== "successful" ? <p className={s.tools}>This is the original invoice. Current payment status: {order.payment_status}. Contact support about any refund or adjustment.</p> : null}
    <article className={s.paper}>
      <header className={s.header}><BrandLogo href={null} /><div><h1>Invoice</h1><p>Original for recipient</p></div></header>
      <p className={s.tagline}>Talent intelligence, clearly delivered.</p>
      <dl className={s.meta}><div><dt>Invoice number</dt><dd>{invoice.invoice_number}</dd></div><div><dt>Issued on</dt><dd>{paymentTime(invoice.issued_at)}</dd></div><div><dt>Financial year</dt><dd>{invoice.financial_year}-{String(invoice.financial_year+1).slice(-2)}</dd></div><div><dt>Currency</dt><dd>{invoice.currency}</dd></div></dl>
      <section className={s.parties}><div><h2>From / supplier</h2><h3>{data.issuer.name}</h3><p>{data.issuer.address}</p><p>{data.issuer.email}</p></div><div><h2>Bill to / recipient</h2><h3>{data.billing.name}</h3><p>{data.billing.address}<br />{data.billing.city}, {data.billing.state} {data.billing.postalCode}<br />{data.billing.country}</p><p>{data.billing.email}</p></div></section>
      <section className={s.band}><div><b>Order reference</b><span>{order.id}</span></div><div><b>Service period</b><span>{data.termMonths} months from activation</span></div></section>
      <h2 className={s.sectionTitle}>Service details</h2>
      <table className={s.lines}><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody><tr><td><strong>{data.plan}</strong><ul>{data.items.map(item => <li key={item}>{item}</li>)}</ul></td><td>1</td><td>{total}</td><td><strong>{total}</strong></td></tr></tbody></table>
      <section className={s.totals}><div><h2>Amount in words</h2><p>{invoiceAmountWords(invoice.amount_paise,invoice.currency)}</p><h2>Payment status</h2><p className={s.paid}>Paid via Razorpay</p></div><dl><div><dt>Service value</dt><dd>{total}</dd></div><div><dt>Discount</dt><dd>{invoiceMoney(0,invoice.currency)}</dd></div><div className={s.grand}><dt>Invoice total</dt><dd>{total}</dd></div><div><dt>Balance due</dt><dd>{invoiceMoney(0,invoice.currency)}</dd></div></dl></section>
      <section className={s.band}><div><b>Payment reference</b><span>{invoice.provider_payment_id}</span></div><div><b>Purchase terms</b><span>Accepted {paymentTime(data.acceptedAt)}<br />Version {data.policyVersion}</span></div></section>
      <footer className={s.footer}><span>avenlo.in · {data.issuer.email}</span><span>Electronic invoice</span></footer>
    </article>
  </main>;
}
