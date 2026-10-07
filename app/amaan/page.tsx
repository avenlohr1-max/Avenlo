'use client';

import { useState } from "react";
import Link from "next/link";
import styles from "./amaan.module.css";

const contact = {
  fullName: "Amaan Makhdoom Ghori",
  role: "CEO & Founder",
  company: "Avenlo",
  direct: "+91 70361 92138",
  avenlo: "+91 80746 46755",
  email: "amaan@avenlo.in",
  website: "https://www.avenlo.in",
};

function BrandMark() {
  return (
    <svg className={styles.mark} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="amaan-blue" x1="7" y1="7" x2="35" y2="40" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2563eb" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
        <linearGradient id="amaan-green" x1="27" y1="12" x2="40" y2="39" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#22c55e" /><stop offset="1" stopColor="#10b981" /></linearGradient>
      </defs>
      <path d="M6 39 22.7 8.5c1.1-2 4-2 5.1 0L42 39h-8.1L25.2 19.8 15 39H6Z" fill="url(#amaan-blue)" />
      <path d="m25.1 28.3 5.2-9.4L39.8 39H31l-5.9-10.7Z" fill="url(#amaan-green)" />
      <path d="M18.3 31.5h10.5l3.1 5.6H15.2l3.1-5.6Z" fill="#0f172a" opacity=".9" />
    </svg>
  );
}

export default function AmaanProfile() {
  const [saved, setSaved] = useState(false);

  function saveContact() {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:Makhdoom Ghori;Amaan;;;",
      "FN:" + contact.fullName,
      "ORG:" + contact.company,
      "TITLE:" + contact.role,
      "TEL;TYPE=CELL,VOICE:" + contact.direct,
      "TEL;TYPE=WORK,VOICE:" + contact.avenlo,
      "EMAIL;TYPE=INTERNET:" + contact.email,
      "URL:" + contact.website,
      "END:VCARD",
    ].join("\r\n");

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Amaan-Makhdoom-Ghori.vcf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true"><span className={styles.arcOne} /><span className={styles.arcTwo} /><span className={styles.arcThree} /></div>

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Avenlo home"><BrandMark /><span><strong>AVENLO</strong><small>Talent intelligence. Human decisions.</small></span></Link>
        <Link href="/" className={styles.headerLink}>Visit Avenlo</Link>
      </header>

      <section className={styles.hero} aria-labelledby="amaan-title">
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>AVENLO · FOUNDER PROFILE</div>
          <p className={styles.introLine}>Avenlo opened a door to its founder.</p>
          <h1 id="amaan-title">{contact.fullName}</h1>
          <p className={styles.role}>{contact.role}, Avenlo</p>
          <p className={styles.positioning}>Building a more intelligent, human approach to talent.</p>
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="button" onClick={saveContact}><span aria-hidden="true">＋</span>{saved ? "Contact card ready" : "Save Contact"}</button>
            <a className={styles.secondaryButton} href={"mailto:" + contact.email + "?subject=Connecting%20with%20Amaan%20Ghori"}>Connect with Amaan</a>
          </div>
          <p className={styles.microcopy}>Save Amaan directly to your phone, or start a conversation by email.</p>
        </div>

        <div className={styles.portraitFrame} aria-label="Avenlo founder identity mark">
          <div className={styles.portraitHalo} />
          <div className={styles.portraitCard}><BrandMark /><span className={styles.initials}>AMG</span><span className={styles.portraitCaption}>CEO &amp; FOUNDER</span></div>
          <span className={styles.signal + " " + styles.signalTop}>Human judgment</span>
          <span className={styles.signal + " " + styles.signalBottom}>Talent intelligence</span>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="about-amaan">
        <div className={styles.sectionLabel}>01 · ABOUT AMAAN</div>
        <div className={styles.twoColumn}>
          <h2 id="about-amaan">Building with a simple belief.</h2>
          <div><p className={styles.lede}><strong>I’m Amaan Makhdoom Ghori, Founder &amp; CEO of Avenlo.</strong></p><p>I’m building Avenlo around a simple belief: better talent decisions come from combining better intelligence with better human judgment.</p></div>
        </div>
      </section>

      <section className={styles.section + " " + styles.companySection} aria-labelledby="about-avenlo">
        <div className={styles.companyMark}><BrandMark /></div>
        <div>
          <div className={styles.sectionLabel}>02 · ABOUT AVENLO</div>
          <h2 id="about-avenlo">Talent intelligence.<br /><span>Human decisions.</span></h2>
          <p>Avenlo combines technology, structured talent information and human judgment to improve how organizations identify, evaluate and connect with talent.</p>
          <Link className={styles.textLink} href="/">Explore Avenlo <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className={styles.section + " " + styles.connectSection} aria-labelledby="connect-heading">
        <div className={styles.sectionLabel}>03 · CONNECT WITH AMAAN</div>
        <div className={styles.connectGrid}>
          <div><h2 id="connect-heading">Let’s connect.</h2><p>For a direct conversation, reach Amaan here.</p></div>
          <div className={styles.contactList}>
            <a href={"tel:" + contact.direct.replace(/\s/g, "")}><span>Direct</span><strong>{contact.direct}</strong></a>
            <a href={"tel:" + contact.avenlo.replace(/\s/g, "")}><span>Avenlo</span><strong>{contact.avenlo}</strong></a>
            <a href={"mailto:" + contact.email}><span>Email</span><strong>{contact.email}</strong></a>
            <a href={contact.website}><span>Website</span><strong>www.avenlo.in</strong></a>
          </div>
        </div>
        <div className={styles.socialRow}><span>LinkedIn</span><span className={styles.unavailable}>Profile link to be added</span></div>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}><BrandMark /><strong>AVENLO</strong></Link>
        <p>Talent intelligence. Human decisions.</p>
        <a href={contact.website}>www.avenlo.in</a>
        <span>© Avenlo</span>
      </footer>
    </main>
  );
}
