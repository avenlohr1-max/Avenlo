import { BrandLogo } from "@/app/components/brand-logo";
import s from "../experience.module.css";
export const metadata={title:"Avenlo executive team — Professional profiles"};
export default function Team() {
 return <main className={s.experience}><header className={s.pageHero}><div><BrandLogo href="https://avenlo.in"/><span className={s.kicker}>THE PEOPLE AT AVENLO</span><h1>People behind<br />the judgment.</h1><p>A space for the professional profiles of Avenlo’s executive team.</p></div></header><section className={s.section}><div className={s.notice}><strong>Executive profiles will be published here.</strong><p>For now, connect with Avenlo directly for team and partnership inquiries.</p><a className={s.textLink} href="https://avenlo.in/contact">Contact Avenlo →</a></div><div className={s.directory}><a href="https://avenlo.in/founders">Meet the founder ↗</a><a href="https://avenlo.in">Candidate platform ↗</a></div></section></main>;
}
