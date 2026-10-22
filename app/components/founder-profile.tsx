"use client";
import { useState } from "react";
import { BrandLogo } from "./brand-logo";
import { founderProfile as profile } from "@/lib/founder-profile";
import s from "./founder-profile.module.css";

export function FounderProfile() {
  const [saved,setSaved]=useState(false);
  function saveContact() {
    const vcard=["BEGIN:VCARD","VERSION:3.0","N:Makhdoom Ghori;Amaan;;;",
      "FN:"+profile.fullName,"ORG:"+profile.company,"TITLE:"+profile.role,
      "TEL;TYPE=CELL,VOICE:"+profile.direct,"TEL;TYPE=WORK,VOICE:"+profile.workPhone,
      "EMAIL;TYPE=INTERNET:"+profile.email,"URL:"+profile.website,"END:VCARD"].join("\r\n");
    const url=URL.createObjectURL(new Blob([vcard],{type:"text/vcard;charset=utf-8"}));
    const anchor=document.createElement("a");anchor.href=url;anchor.download="Amaan-Makhdoom-Ghori.vcf";
    document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);setSaved(true);
  }
  return <main className={s.page}>
    <header className={s.header}><BrandLogo href={profile.website} compact /><nav aria-label="Profile navigation"><a href={profile.website+"/about"}>About Avenlo</a><a href={profile.website+"/companies"}>Employer partnerships ↗</a></nav></header>
    <div className={s.container}>
      <article className={s.identity} aria-labelledby="founder-name">
        <div className={s.cover}><span>AVENLO / FOUNDER</span><p>Talent intelligence.<br /><strong>Human decisions.</strong></p><div className={s.coverOrb} aria-hidden="true"/></div>
        <div className={s.identityBody}><div className={s.identityTop}><span className={s.avatar} aria-label="Amaan Makhdoom Ghori initials">{profile.initials}</span><span className={s.companyTag}>AVENLO</span></div>
          <div className={s.nameRow}><div><span className={s.eyebrow}>FOUNDER PROFILE</span><h1 id="founder-name">{profile.fullName}</h1><p className={s.role}>{profile.role} · {profile.company}</p></div><a className={s.contactLink} href="#contact">Contact information ↓</a></div>
          <p className={s.headline}>{profile.headline}</p>
          <div className={s.actions}><a className={s.primary} href={"mailto:"+profile.email}>Connect with Amaan ↗</a><button className={s.secondary} type="button" onClick={saveContact}>Save contact</button><a className={s.textLink} href={profile.website}>Visit Avenlo →</a></div>
          <p className={s.saveStatus} role="status">{saved?"Your contact card is ready to save.":""}</p>
        </div>
      </article>
      <div className={s.columns}>
        <div className={s.mainColumn}>
          <section className={s.card} aria-labelledby="about-title"><span className={s.eyebrow}>PERSPECTIVE</span><h2 id="about-title">About</h2><p>I’m {profile.fullName}, Founder &amp; CEO of Avenlo.</p><p>{profile.about}</p><p>Avenlo brings professional records, supporting evidence and career conversations into a connected platform, with people accountable for the decisions.</p></section>
          <section className={s.card} aria-labelledby="role-title"><span className={s.eyebrow}>CURRENT ROLE</span><h2 id="role-title">Building Avenlo</h2><div className={s.experience}><span className={s.companyIcon}>A</span><div><h3>{profile.role}</h3><a href={profile.website}>{profile.company} ↗</a><p>Talent intelligence and human-led career and hiring conversations.</p></div></div><div className={s.focus}><span>Professional evidence</span><span>Candidate control</span><span>Human judgment</span></div></section>
          <section className={s.card} aria-labelledby="platform-title"><span className={s.eyebrow}>THE PLATFORM</span><h2 id="platform-title">A clearer professional journey.</h2><p>Ten connected products help candidates understand their experience, explore directions and share selected evidence. Employers join through personal onboarding.</p><div className={s.actions}><a className={s.textLink} href={profile.website+"/products"}>Explore the ten products →</a><a className={s.textLink} href={profile.website+"/join"}>Start your Talent Record →</a></div></section>
        </div>
        <aside className={s.card} id="contact" aria-labelledby="contact-title"><span className={s.eyebrow}>START A CONVERSATION</span><h2 id="contact-title">Connect</h2><dl className={s.contacts}><dt>Email</dt><dd><a href={"mailto:"+profile.email}>{profile.email}</a></dd><dt>Avenlo phone</dt><dd><a href={"tel:"+profile.workPhone.replace(/\s/g,"")}>{profile.workPhone}</a></dd><dt>Direct phone</dt><dd><a href={"tel:"+profile.direct.replace(/\s/g,"")}>{profile.direct}</a></dd><dt>Website</dt><dd><a href={profile.website}>avenlo.in ↗</a></dd></dl><div className={s.partnership}><h3>Hiring for your company?</h3><p>Register interest and the Avenlo team will connect with you.</p><a className={s.textLink} href={profile.website+"/companies"}>Register employer interest →</a></div></aside>
      </div>
    </div><footer className={s.footer}><span>© {new Date().getFullYear()} Avenlo</span><a href={profile.website}>Talent intelligence. Human decisions. ↗</a></footer>
  </main>;
}
