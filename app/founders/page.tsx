import Link from "next/link";
import { BrandLogo } from "@/app/components/brand-logo";
import s from "../experience.module.css";
export const metadata={title:"Avenlo founders — Professional profiles"};
export default function Founders() {
 return <main className={s.experience}><header className={s.pageHero}><div><BrandLogo href="https://avenlo.in" /><span className={s.kicker}>THE PEOPLE BEHIND AVENLO</span><h1>Meet the founder.</h1><p>Professional background, perspective and ways to connect.</p></div></header><section className={s.section}><article className={s.profileCard}><div className={s.profileCover}/><div className={s.profileBody}><span className={s.avatar}>AM</span><h2>Amaan Makhdoom Ghori</h2><strong>CEO &amp; Founder · Avenlo</strong><p>Building a more intelligent, human approach to talent. Connecting structured professional evidence with considered human decisions.</p><div className={s.actions}><Link className={s.primary} href="/amaan">View professional profile ↗</Link><a className={s.textLink} href="mailto:amaan@avenlo.in">Connect by email →</a></div></div></article><div className={s.directory}><a href="https://avenlo.in">Candidate platform ↗</a><a href="https://avenlo.in/companies">Employer partnerships ↗</a></div></section></main>;
}
