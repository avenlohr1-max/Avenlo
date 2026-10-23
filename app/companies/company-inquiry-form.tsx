"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import s from "../experience.module.css";

export function CompanyInquiryForm() {
  const [status,setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [error,setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/company-inquiries", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(form.entries()))});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to register your interest.");
      setStatus("sent"); formElement.reset();
    } catch (err) { setStatus("error");setError(err instanceof Error ? err.message : "Unable to register your interest."); }
  }
  return <div className={s.interestCard}><span className={s.kicker}>REGISTER YOUR INTEREST</span><h2>Let’s understand your hiring.</h2><p>This registers an inquiry. Employer workspace access is issued separately by the Avenlo team after onboarding.</p>
    {status==="sent" ? <div className="success-state" role="status"><strong>Your interest is registered.</strong><p>Our team will review your requirements and contact you about next steps. Registration does not create an employer account.</p><Link href="/" className={s.textLink}>Back to Avenlo →</Link></div> :
    <form className="form" onSubmit={submit}><div className="form-grid"><label>Company name<input name="companyName" required minLength={2} maxLength={160} autoComplete="organization" /></label><label>Your name<input name="contactName" required minLength={2} maxLength={120} autoComplete="name" /></label></div><label>Work email<input name="email" required type="email" maxLength={254} autoComplete="email" /></label><label>Your role <span className="label-optional">optional</span><input name="role" maxLength={120} autoComplete="organization-title" /></label><label>Your hiring requirements<textarea name="hiringNeed" required minLength={20} maxLength={4000} rows={5} placeholder="Tell us about the roles, location, hiring timeline and whether your needs are ongoing or for a specific search." /></label>{status==="error" && <p className="error" role="alert">{error}</p>}<button className={s.primary} type="submit" disabled={status==="sending"}>{status==="sending"?"Registering…":"Register company interest ↗"}</button><p className="form-note">We use these details to respond to your inquiry. Read our <Link href="/privacy">privacy policy</Link>. Fees and engagement terms are discussed privately during onboarding.</p></form>}</div>;
}
