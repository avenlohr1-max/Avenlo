import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { productCatalog } from "@/lib/product-catalog";
import s from "../experience.module.css";
export const metadata = { title: "Ten connected products for your career — Avenlo" };
const instructions = [
  "Add experience, education and preferences. Review your information and choose your sharing settings.",
  "Add a statement, record its source and context, then confirm or correct it.",
  "Compare recorded skills with resume mentions and connect confirmed work evidence.",
  "Compare up to three roles. Add assumptions, questions and relevant confirmed signals.",
  "Read the suggestion and its reason. Save or dismiss it and keep private questions.",
  "Register employer interest. After onboarding, define outcomes and criteria and submit a role for review.",
  "Create a room for an available employer role, state its purpose and explicitly invite the employer.",
  "Select a confirmed source, prepare and redact a draft, then preview and approve sharing.",
  "Inside a room, add evidence references, judgments and corrections. Export the visible record when needed.",
  "Describe the help you need, approve its scope and follow the assigned operator’s progress and outcome.",
];
export default function Products() {
  return <main className={s.experience}><SiteHeader /><header className={s.pageHero}><div><span className={s.kicker}>THE AVENLO PRODUCT SUITE</span><h1>Your experience.<br />Connected to your next step.</h1><p>Ten tools to understand your background, explore possibilities and make considered decisions together. Start with your record and use the tools that fit your journey.</p><div className={s.actions}><Link className={s.primary} href="/join">Create your free account ↗</Link><Link className={s.textLink} href="/pricing">View candidate plans →</Link></div></div></header><section className={s.section}>{productCatalog.map((p,i) => <article className={s.productDetail} id={`product-${p.number}`} key={p.number}><span>{p.number}</span><div><h2>{p.name}</h2><small>{p.group}</small></div><div><p>{p.description}</p><p><strong>How to use it: </strong>{instructions[i]}</p><Link className={s.textLink} href={p.href}>{p.number === "06" ? "Register employer interest" : "Open this workspace"} →</Link></div></article>)}<p className={s.notice}>Your evidence and choices support human decisions. Avenlo does not promise interviews, offers or employment. Product availability and advisory service scope are shown in your account and applicable service terms.</p></section><SiteFooter /></main>;
}
