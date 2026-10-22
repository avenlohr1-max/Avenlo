import Link from "next/link";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { productCatalog } from "@/lib/product-catalog";
import s from "./experience.module.css";

export default function Home() {
  return <main className={s.experience}>
    <SiteHeader />
    <section className={s.hero}><div className={s.heroInner}>
      <div><span className={s.kicker}>YOUR EXPERIENCE. YOUR NEXT CHAPTER.</span>
        <h1>More than a résumé.<br /><em>A clearer way forward.</em></h1>
        <p className={s.lede}>Understand your strengths, explore what comes next and bring real evidence to career conversations. Avenlo gives you the tools—and people—to move with clarity.</p>
        <div className={s.actions}><Link href="/join" className={s.primary}>Build your free Talent Record ↗</Link><Link href="/products" className={s.textLink}>Explore the ten products →</Link></div>
        <p className={s.micro}>Start free · Private by default · Sharing stays in your control</p>
      </div>
      <div className={s.workspace} aria-label="Illustrative candidate workspace with example information">
        <div className={s.workspaceTop}><span className={s.statusDot} /> YOUR AVENLO WORKSPACE <span>EXAMPLE</span></div>
        <div className={s.record}><span className={s.avatar}>A</span><div><small>YOUR TALENT RECORD</small><h2>A story with substance.</h2><p>Experience · Evidence · Direction</p></div><span className={s.private}>Private</span></div>
        <div className={s.exampleSignal}><span>01 / UNDERSTAND</span><h3>See the strengths behind your experience.</h3><div className={s.tags}><span>Professional record</span><span>Confirmed sources</span><span>Work examples</span></div></div>
        <div className={s.workspaceGrid}><article><span className={s.cardGlyph}>↗</span><h3>Your next move</h3><p>Explore a direction.<br />Keep the questions visible.</p></article><article><span className={s.cardGlyph}>◎</span><h3>Your conversation</h3><p>Choose your evidence.<br />Decide what to share.</p></article></div>
        <div className={s.workspaceBottom}><span className={s.statusDot} /> Technology brings structure. People bring judgment.</div>
      </div>
    </div></section>
    <div className={s.promiseBar}><span>PRIVATE PROFESSIONAL RECORD</span><span>TRACEABLE EVIDENCE</span><span>HUMAN REVIEW</span><span>YOUR DECISION</span></div>
    <section className={s.section} id="why-avenlo"><div className={s.sectionIntro}><span className={s.kicker}>BUILT AROUND YOU</span><h2>Your career has context.<br />Your tools should too.</h2><p>A job title rarely tells the whole story. Start with what you have done, understand the evidence behind it and decide where you want to go.</p></div><div className={s.threeColumns}>{[
      ["01", "Understand your experience", "Bring your record, skills and supporting examples into one place you can review and correct."],
      ["02", "Explore with perspective", "Compare career directions and opportunities with assumptions and questions in view."],
      ["03", "Have a better conversation", "Share selected proof, ask meaningful questions and keep the reasoning behind a decision."],
    ].map(([n,title,text]) => <article className={s.feature} key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className={s.tinted} id="products"><div className={s.section}><div className={s.splitHeading}><div><span className={s.kicker}>ONE CONNECTED PLATFORM</span><h2>Ten products.<br />One professional journey.</h2></div><p>Use the tools that fit your next step. Your record, evidence and conversations stay connected.</p></div><div className={s.productGrid}>{productCatalog.map(p => <Link href={`/products#product-${p.number}`} className={s.productCard} key={p.number}><span>{p.number} / {p.group}</span><h3>{p.name} <b aria-hidden="true">↗</b></h3><p>{p.description}</p></Link>)}</div></div></section>
    <section className={s.section} id="how-it-works"><div className={s.splitHeading}><div><span className={s.kicker}>A SIMPLE PLACE TO START</span><h2>From your experience<br />to your next conversation.</h2></div><Link className={s.textLink} href="/join">Create your free account →</Link></div><ol className={s.steps}><li><strong>Create your record</strong><p>Add your background, preferences and experience.</p></li><li><strong>Review your signals</strong><p>Correct information and connect work examples.</p></li><li><strong>Explore possibilities</strong><p>Compare directions and relevant opportunities.</p></li><li><strong>Choose what to share</strong><p>Join a focused conversation when the opportunity is right.</p></li></ol></section>
    <section className={s.callout}><div><span className={s.kicker}>START WITH CLARITY</span><h2>Your next chapter starts<br />with understanding this one.</h2><p>Begin with a free profile. Explore six-month human support plans when you need more guidance.</p><div className={s.actions}><Link className={s.primary} href="/join">Start free ↗</Link><Link className={s.textLink} href="/pricing">Compare candidate plans →</Link></div></div><aside><span>HIRING FOR YOUR TEAM?</span><h3>A considered introduction starts with a conversation.</h3><p>Employer access is by invitation. Register interest and our team will discuss your requirements and onboard your company.</p><Link href="/companies">Register company interest →</Link></aside></section>
    <SiteFooter />
  </main>;
}
