# Cloudflare compatibility trial

Status: trial only, 1 November 2026. Production and DNS still use Netlify.

The existing Next.js build remains available. The trial adds Cloudflare's vinext
adapter with pinned dependencies and a separate `avenlo-compatibility` Worker.
No custom domain, paid storage, cache, Images or Production secret binding is
configured by this change. Use Node 24 and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm run build:vinext
pnpm run start:vinext --host 127.0.0.1 --port 3001
```

Public page rendering requires the existing public Supabase build variables.
Use placeholders for an offline public-page check. Do not connect this trial to
Production data to make an authenticated check pass.

The `cloudflare-integration` workflow creates a disposable local Supabase stack,
replays the canonical migrations, seeds synthetic role accounts and exercises
the same authenticated product journey as the Next.js job. It additionally
tests real PDF/DOCX text extraction and persistence. Its `.dev.vars` file contains
only the disposable service key and is ignored by Git. No live Razorpay payment
is performed; invoice checks use synthetic settlement fixtures.

Before cutover, verify the hosted Worker on the Free plan, its CPU limits,
subdomain routing, authentication, private downloads, file parsing and payment
webhook signature/replay behavior. A local Workers build does not establish
Free-plan capacity or prove receipt of a real captured payment. The preview
hostname must be explicitly allowed before hosted testing; never accept every
`workers.dev` hostname as a trusted application host.

Move DNS and provision Production secrets only after the trial passes and the
concrete cutover is approved. Preserve the existing Netlify deployment for
rollback. Do not alter Microsoft 365 mail records during a hosting migration.
