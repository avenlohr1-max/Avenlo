"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import s from "../experience.module.css";

export default function Companies() {
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
  return <main className={s.experience}><SiteHeader /><section className={s.tinted}><div className={s.interestGrid}>
    <div><span className={s.kicker}>EMPLOYER PARTNERSHIPS · BY INVITATION</span><h1>A better hire begins<br />with understanding<br />the work.</h1><p>Tell us about your company and hiring needs. Our team will connect with you, understand the requirement and personally onboard your company if there is a fit.</p><p>Every introduction combines structured evidence, human review and candidate consent.</p><div className={s.tags}><span>Human-led onboarding</span><span>Private commercial terms</span><span>Considered introductions</span></div><p className={s.micro}>Already onboarded? Use the workspace link in your invitation, or <Link href="/login">sign in</Link>.</p></div>
    <div className={s.interestCard}><span className={s.kicker}>REGISTER YOUR INTEREST</span><h2>Let’s understand your hiring.</h2><p>This registers an inquiry. Employer workspace access is issued separately by the Avenlo team after onboarding.</p>
    {status==="sent" ? <div className="success-state" role="status"><strong>Your interest is registered.</strong><p>Our team will review your requirements and contact you about next steps. Registration does not create an employer account.</p><Link href="/" className={s.textLink}>Back to Avenlo →</Link></div> :
    <form className="form" onSubmit={submit}><div className="form-grid"><label>Company name<input name="companyName" required minLength={2} maxLength={160} autoComplete="organization" /></label><label>Your name<input name="contactName" required minLength={2} maxLength={120} autoComplete="name" /></label></div><label>Work email<input name="email" required type="email" maxLength={254} autoComplete="email" /></label><label>Your role <span className="label-optional">optional</span><input name="role" maxLength={120} autoComplete="organization-title" /></label><label>Your hiring requirements<textarea name="hiringNeed" required minLength={20} maxLength={4000} rows={5} placeholder="Tell us about the roles, location, hiring timeline and whether your needs are ongoing or for a specific search." /></label>{status==="error" && <p className="error" role="alert">{error}</p>}<button className={s.primary} type="submit" disabled={status==="sending"}>{status==="sending"?"Registering…":"Register company interest ↗"}</button><p className="form-note">We use these details to respond to your inquiry. Read our <Link href="/privacy">privacy policy</Link>. Fees and engagement terms are discussed privately during onboarding.</p></form>}</div>
  </div></section>
  <section className={s.section}><span className={s.kicker}>A PERSONAL ONBOARDING PROCESS</span><h2>From first conversation<br />to the right introduction.</h2><ol className={s.steps}><li><strong>Register interest</strong><p>Share who you are and what your team needs.</p></li><li><strong>Speak with Avenlo</strong><p>We review the company, hiring authority and requirements.</p></li><li><strong>Agree the engagement</strong><p>Receive your role classification and commercial terms privately.</p></li><li><strong>Enter your workspace</strong><p>Your invitation provides access to reviewed roles and candidate conversations.</p></li></ol></section>
  <section className={s.tinted}><div className={s.section}><div className={s.splitHeading}><div><span className={s.kicker}>WORKSPACES THAT FIT THE RELATIONSHIP</span><h2>A focused search.<br />Or a lasting partnership.</h2></div><p>Our team assigns the right workspace during onboarding. Neither route provides open employer registration.</p></div><div className={s.productGrid}><article className={s.productCard}><span>SHORT-TERM ENGAGEMENTS</span><h3>A shared company portal</h3><p>Invited employers use the companies portal for a specific hiring engagement.</p></article><article className={s.productCard}><span>LONG-TERM · ACTIVE HIRING</span><h3>Your dedicated company address</h3><p>Contracted partners with active hiring receive an assigned company workspace and dedicated subdomain.</p></article></div></div></section>
  <section className={s.section}><div className={s.faq}><span className={s.kicker}>BEFORE WE CONNECT</span><h2>A few things to know.</h2><details><summary>How does employer access work?</summary><p>Register interest first. Avenlo contacts you, verifies the company and hiring authority, agrees engagement terms and issues access. Registering interest does not activate an account.</p></details><details><summary>Where can I see the fee structure?</summary><p>Employer fees are confidential. The Avenlo team shares your applicable schedule and agreement privately during onboarding.</p></details><details><summary>Who makes the hiring decision?</summary><p>Your company makes the hiring decision. Avenlo organizes evidence, reviews introductions and supports the conversation with candidate consent.</p></details></div></section><SiteFooter /></main>;
}
