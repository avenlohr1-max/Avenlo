import type { Metadata } from "next";
import Link from "next/link";
import styles from "./coming-soon.module.css";

export const metadata: Metadata = {
  title: "Avenlo — Coming November 2026",
  description: "A new approach to talent intelligence. Understand talent, explore possibility, and make more informed human decisions.",
};

const audiences = [
  { number: "01", title: "For People", text: "Understand your capabilities, make sense of your evidence, and explore career paths that could fit who you are becoming." },
  { number: "02", title: "For Companies", text: "Define work more clearly, evaluate evidence with context, and make better-informed talent decisions." },
  { number: "03", title: "For Both", text: "Create a shared picture of capability, opportunity, and fit—without pretending an algorithm can make the human decision." },
];

const products = [
  "Talent Record",
  "Signal Ledger",
  "Capability Atlas",
  "Career Scenario Lab",
  "Opportunity Intelligence",
  "Role Intelligence Studio",
  "Mutual Decision Room",
  "Proof Studio",
  "Decision Dossier",
  "Human Intelligence Services",
];

const earlyAccess = "mailto:support@avenlo.in?subject=Avenlo%20early%20access";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.logo} href="/" aria-label="Avenlo home">
            <span className={styles.mark} aria-hidden="true">A</span>
            <span><span className={styles.wordmark}>AVENLO</span><span className={styles.tagline}>Talent intelligence. Human decisions.</span></span>
          </Link>
          <div className={styles.headerRight}>
            <a className={styles.headerLink} href="#vision">Our vision</a>
            <a className={styles.button + " " + styles.primary} href={earlyAccess}>Get Early Access <span aria-hidden="true">↗</span></a>
          </div>
        </header>
      </div>

      <section className={styles.hero}>
        <div className={styles.container + " " + styles.heroGrid}>
          <div>
            <span className={styles.eyebrow}><span className={styles.dot} /> A new chapter in talent intelligence</span>
            <h1>Understand talent. <em>Unlock human potential.</em></h1>
            <p className={styles.lede}>We’re building a new approach to talent intelligence—helping people understand their capabilities, explore possible futures, and make informed career decisions, while helping companies define work clearly and evaluate evidence with context.</p>
            <div className={styles.actions}>
              <a className={styles.button + " " + styles.primary} href={earlyAccess}>Get Early Access <span aria-hidden="true">↗</span></a>
              <a className={styles.button} href="#vision">Explore Our Vision <span aria-hidden="true">↓</span></a>
            </div>
            <p className={styles.launchNote}><strong>Targeting November 2026.</strong> Timing is subject to product readiness. We’ll share updates as the experience takes shape.</p>
          </div>
          <div className={styles.visual} aria-label="Abstract illustration of connected talent intelligence signals">
            <div className={styles.halo} />
            <div className={styles.ring} />
            <div className={styles.ringTwo} />
            <div className={styles.core} aria-hidden="true">A</div>
            <div className={styles.floatCard + " " + styles.floatOne}><span className={styles.floatIcon}>↗</span><span className={styles.floatText}><strong>Capability</strong><span>understood in context</span></span></div>
            <div className={styles.floatCard + " " + styles.floatTwo}><span className={styles.floatIcon}>◎</span><span className={styles.floatText}><strong>Evidence</strong><span>clearer, not louder</span></span></div>
            <div className={styles.floatCard + " " + styles.floatThree}><span className={styles.floatIcon}>✳</span><span className={styles.floatText}><strong>Possibility</strong><span>more paths to explore</span></span></div>
          </div>
        </div>
      </section>

      <section className={styles.principle}>
        <div className={styles.container + " " + styles.principleInner}>
          <span>Evidence can inform a decision.</span>
          <span>Human judgment remains at the center.</span>
        </div>
      </section>

      <section className={styles.section} id="vision">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <div><span className={styles.eyebrow}>ONE PLATFORM · THREE PERSPECTIVES</span><h2>Better talent decisions begin with a clearer picture.</h2></div>
            <p>Talent is more than a job title or a score. Avenlo is being designed to connect evidence, capability, possibility, and decision-making—while making uncertainty visible.</p>
          </div>
          <div className={styles.audiences}>
            {audiences.map((audience) => <article className={styles.audienceCard} key={audience.number}><span className={styles.cardIndex}>{audience.number}</span><h3>{audience.title}</h3><p>{audience.text}</p></article>)}
          </div>
        </div>
      </section>

      <section className={styles.section + " " + styles.sectionTint} id="products">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <div><span className={styles.eyebrow}>THE AVENLO SUITE</span><h2>Ten connected ideas. One human-centered direction.</h2></div>
            <p>These experiences are in development. Their scope and availability may evolve as we validate what is most useful.</p>
          </div>
          <div className={styles.productGrid}>
            {products.map((product, index) => <article className={styles.productCard} key={product}><span className={styles.productNum}>{String(index + 1).padStart(2, "0")}</span><h3>{product}</h3><span className={styles.status}>In development</span></article>)}
          </div>
          <p className={styles.visionNote}>The suite is being built around a simple loop: evidence → capability → scenario → decision → new evidence. AI can clarify signals and options; people remain responsible for decisions.</p>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaPanel}>
            <span className={styles.eyebrow} style={{color:"#b9d0ff"}}>FOLLOW THE BUILD</span>
            <h2>Help shape a more thoughtful future for talent.</h2>
            <p>Interested in what we’re creating? Reach out to express interest in early access. We’ll share product updates as the launch gets closer.</p>
            <div className={styles.actions}>
              <a className={styles.button + " " + styles.primary} href={earlyAccess}>Get Early Access <span aria-hidden="true">↗</span></a>
              <a className={styles.button} href="mailto:support@avenlo.in?subject=Avenlo%20product%20vision">Ask us about the vision</a>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div><Link className={styles.logo} href="/" aria-label="Avenlo home"><span className={styles.mark} aria-hidden="true">A</span><span><span className={styles.wordmark}>AVENLO</span><span className={styles.tagline}>Talent intelligence. Human decisions.</span></span></Link><p className={styles.footerPhrase}>Intelligence for human potential.</p></div>
            <nav className={styles.footerLinks} aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link><a href="mailto:support@avenlo.in">support@avenlo.in</a><Link href="/login">Existing user sign in</Link></nav>
          </div>
          <div className={styles.footerBottom}><span>© {new Date().getFullYear()} Avenlo. All rights reserved.</span><span>Planned for November 2026 · subject to product readiness.</span></div>
        </div>
      </footer>
    </main>
  );
}
