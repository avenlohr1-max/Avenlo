# Candidate website and invitation-only employer portals

Updated: 22 October 2026, 22:18 IST. Implementation in the release candidate; not a Production deployment or completed portal acceptance.

## Owner decisions recorded in this request

- avenlo.in is the candidate platform.
- Employer registration is an interest inquiry only. Avenlo contacts, verifies and personally onboards employers, then issues access. Public signup continues to create candidate accounts only.
- Employer fee percentages and fee schedules are confidential. No employer rate table or public fee calculator is added. Signed schedules must be delivered privately; tenant configuration must not hold fee schedules.
- Employer payment is due within 60 days of placement. After the deadline, the case moves to collections/legal review under the agreement. No automatic lawsuit, penalty or legal notice is created by the website.
- One free replacement search is offered when a candidate leaves within 90 days of placement; no free replacement after 90 days. This replaces the operations document's old 30/60/90 tier-specific windows. The original one-search remedy is preserved; no cash-refund or guaranteed-hire promise is added.
- The signed agreement must identify the placement date/clock anchor, qualifying departure and claim handling; do not silently choose invoice date, offer date or change the compensation basis.
- The prior candidate retention proposal and support/quality coverage remain unapproved. This redesign does not close those gates.

## Site design implemented

A candidate-first home with an illustrative private workspace, three journey stages, all ten products, steps to start and candidate plan CTA. Employer entry is secondary and leads to a working existing inquiry endpoint. Product guide provides each product's actual purpose and instructions. Candidate pricing retains the supplied market prices and six-month/no-auto-renewal baseline. No fabricated “most chosen” claim.

Paid-plan links lead to a scope discussion, not an unapproved purchase. Premium deliverables and per-plan service quantities still need definition; no new paid entitlement or advisor guarantee is invented. Product workspaces keep existing account/consent controls. Terms/refund/retention acceptance and real-user UAT remain separate.

Company inquiry form captures company, contact, work email, role and hiring needs; successful submission is not an invitation/account. It now retains the form element before await so success/reset does not use a released event reference. Employer workspace links to a private, authenticated engagement policy page. Automated placement invoicing/replacement/collections workflows are not implemented by this page.

## Domain map

| Address | Root destination | Access |
|---|---|---|
| avenlo.in | Candidate home | Public marketing; authenticated candidate tools |
| companies.avenlo.in | Employer interest and onboarding entry | Public inquiry; assigned company-role account for workspace |
| assigned-company.avenlo.in | Company workspace | Explicit server-side mapping, active contract AND active hiring, matching company owner |
| staff.avenlo.in | Internal operations | Existing staff/founder role plus private operations session |
| admin.avenlo.in | Founder administration | Founder role plus private operations session |
| founders.avenlo.in | Founder directory | Public professional profile; existing Amaan profile reused |
| team.avenlo.in | Executive profile directory | Public shell; no invented staff identities or biographies |

No extra subdomains are required now. Reserved names cannot be assigned as tenant slugs. Unknown/unassigned company hosts fail closed. The current company model supports a single company owner; tenant entry rejects owners attached to multiple companies instead of selecting the wrong company. A general team-membership/SSO model is future work.

The routing layer is Next.js 16 proxy.ts, with existing database RLS and server-side authorization retained. It is not a substitute for database permissions. Admin session POST now verifies the current non-suspended staff/founder role before setting its marker. Founder administration additionally checks the founder role server-side. No authorization uses user-editable metadata. Sessions remain host-only; no .avenlo.in parent-domain cookie is introduced.

## Activation checklist — not yet done

Read-only Vercel inventory on 22 October shows only avenlo.in and the existing redirecting vercel.app alias. New subdomains are not assigned, DNS/HTTPS is not verified, and no wildcard was activated.

1. Review and deploy this candidate only after existing release gates pass; current Production is still old main.
2. Add the six named portal domains to the intended Vercel project; retrieve each exact DNS target/verification value. Current authoritative DNS is external. Preserve MX/TXT/email records; do not change nameservers as a shortcut.
3. Provision dedicated company domains individually after a signed long-term contract and active-hiring confirmation. Use AVENLO_COMPANY_TENANTS server configuration. No real company assignment is invented here.
4. Verify HTTPS, root rewrites, all navigation and same-host login/logout. Register exact callback/reset URLs for each activated auth host after checking the app's redirect construction; no broad wildcard.
5. Confirm server-action allowed-origin behavior before any cross-origin operation. Keep requests same-origin; do not loosen it globally.
6. Confirm roles, suspended/unconfirmed accounts, no-cookie entry, staff-versus-founder boundaries, tenant mismatch and withdrawal in isolated synthetic infrastructure. Preview continues to share Production and must not receive write UAT.
7. Set AVENLO_PORTALS_ENABLED=true only after the domains/auth/application are ready. The default false preserves existing apex workspace paths during rollout.
8. Maintain owner review of legal/finance mechanics, retention, service quantities, support hours, quality review and first-cohort acceptance. No fee collection or litigation is enabled here.

## Implementation checks

TypeScript and changed-file ESLint passed during implementation. Production build passed with synthetic, build-only Supabase placeholders and generated all 47 static pages. The first build without configuration stopped at existing authenticated pages; no live keys were pulled to resolve it. Desktop browser review of home, employer inquiry and candidate pricing passed without submitting forms. Mobile/device and real-account portal acceptance remain pending. Subsequent automatic CI is recorded separately; prior CI #281 is evidence for the earlier 8078b84 candidate, not this redesign. Existing homepage smoke assertions were updated to the new headings/CTA; no new test cases were added and no local test suite was run for this request.

Reference: [Next.js proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).
