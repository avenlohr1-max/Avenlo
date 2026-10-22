# Production hosting and authentication evidence

Updated: 22 October 2026, 18:39 IST.

## Verified Vercel connection and targets

✅ Authenticated access confirmed to team **Avenlo** (`avenlo1`) and project **avenlo**, connected to `avenlohr1-max/Avenlo`. Framework Next.js; Node.js 24.x. The verified Production domain is `https://avenlo.in`; DNS configuration reports no conflicts and `misconfigured=false`. The project's Production `NEXT_PUBLIC_SITE_URL` already matches that origin. Public browser JavaScript also contains the expected Supabase project ref `yzuuutynqfpbiozlrfmy`; the same environment entries target Production and Preview. No secret values are recorded here.

The existing Production deployment is READY on `568e0dd795876d9e4f828da1b8b82f18282f6ffa` (the older main branch). Candidate `8078b84d09189fa3c1a96b53fccd1a1f14ece2f8` is READY as a protected preview. Both login pages return HTTP 200 with the expected sign-in page. Preview remains Production-data access and is not used for write UAT. No deployment was promoted and no domain reassigned.

CI #281 passed both jobs on that candidate, including 88 tests, six SQL suites, build, public smoke, synthetic recovery and authenticated disposable journeys. The later update to this document is evidence only; application/security source last changed at `a3a01b2d61a40c7205bfdf1ceaa1806fe8af8e84`.

## Production Auth correction

✅ At 18:29 IST, the live Supabase site URL changed from localhost to `https://avenlo.in`. The allowlist now contains the exact implemented routes:

- `https://avenlo.in/auth/callback`
- `https://avenlo.in/auth/reset-password`

A minimal configuration file and before/after diffs verified these were the only two declared setting updates, with zero remaining updates after readback. No preview-domain or localhost wildcard was added. The earlier password-minimum change to eight characters remains in effect; email confirmations remain enabled. Resend SMTP was already configured.

## Approved email delivery check

✅ The founder explicitly approved **one** account-recovery test email to their own account. Exactly one request was made; the existing owner Auth account was checked first. The Auth endpoint returned HTTP 200. The matching email appeared in the owner's inbox at 18:36 IST, outside Spam, with the expected project header and SPF, DKIM and DMARC passing. Its Auth verification host and reset redirect match the expected Supabase project and `https://avenlo.in/auth/reset-password`; no localhost URL remains in the message.

The recovery link was inspected without opening/consuming it. No password was changed, and no second email was sent. Email contents, recovery token/link and private message identifiers are excluded from Git. This validates configured delivery and link construction, not a completed real-account password-change journey or general support/alert response coverage.

## Founder security decision and phase scope

The founder explicitly selected **“Accept limitation for invited pilot”** for Supabase Free's unavailable leaked-password protection. This is a documented risk acceptance for an **invitation-only pilot**, not enabled provider protection, a paid upgrade, or approval for unrestricted public/paid release. The provider advisor warning remains technically present. Reassess before broader rollout.

✅ **Phase 0 delivery foundation is complete for that invited-pilot scope:** canonical live history, reviewed/versioned upgrade, clean replay/RLS checks, confirmed Production target, encrypted off-site recovery evidence, documented backup/forward-repair controls, function hardening, correct Auth origin, email delivery and explicit security exception are recorded. This does not release the application or close Phases 1–9.

The founder said **“ok will review and update you”** about retention, service-trial terms, actual support hours and independent quality review. Those remain unapproved. Representative-user acceptance, operational staffing/drills, scheduled backup/purge/alerts, erasure enablement and the first cohort remain open. PR #12 is unmerged and the ten-product candidate is not yet the Production application.
