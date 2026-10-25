# Avenlo Payments: independent test release

Built as original Avenlo code. No YouPI-PG code, assets, SDK, runtime or database
schema is copied or embedded. The reviewed source was
youpi-pg/YouPI-PG commit d7b07414d803094525ceedd5cf81e8a38157263e.
Its README describes an experimental system; package.json declares Commercial
and the linked LICENSE is absent. Creating our licence cannot grant rights to
that code. Our licence applies only to the new implementation listed in LICENSE.txt.

## What this release does

- Candidate-owned sandbox payment history and immutable request events.
- Founder-only personal-UPI testing for exactly INR 1.00 per request.
- Server-owned amount, currency, receiver and unique AVT reference.
- Local QR generation, UPI intent, display expiry and late-payment reporting.
- Payer reports are pending; founder confirms only after independent official
  bank reconciliation, matching amount, receiver, reference and credit time.
- The same bank reference cannot confirm two requests for the same receiver.
- Refund review requests are recorded; the site does not execute refunds.
- Row-level access, read-only client tables, transactional RPC transitions and
  deduplication of repeated actions. No observer inbox, OTP, PIN or bank login.

Neither mode creates candidate service orders, marks paid plans active or
collects employer fees. Personal UPI is not exposed on public pricing pages.
Only the owner of an unexpired founder test request receives a payable QR.
The bank-verified beneficiary name in the payer's UPI app remains authoritative.

## Configuration

Use server environment variables for non-sensitive mode flags only.

    AVENLO_UPI_ENABLED=true
    AVENLO_UPI_MODE=sandbox

Sandbox contains no receiving UPI address and generates no payment QR. To run
the owner's private INR 1 test after verification, set mode=test and store
a JSON object with `upi` and `name` in the encrypted Supabase Vault entry
`avenlo_upi_test_receiver`. The service-role-only RPC of the same name reads
that single entry, and server code calls it only after founder authentication.
Do not store personal receiver details in hosting environment variables or
NEXT_PUBLIC_ configuration. Real receiver values are absent from this repository.
Missing fields, an
unsupported mode or ENABLED other than true fail closed.

The gateway uses the existing Next.js/Netlify and Supabase infrastructure;
no SQLite daemon, Gmail reader, Android observer or always-on PC is required.
Hosting/database usage still consumes existing Free-plan quotas. This is
not a claim of free infrastructure or certified payment processing.

## Private test walkthrough

1. Apply the new migration to a disposable database; run unit, SQL and browser
   tests before any Production activation. Keep Production configuration off.
2. Open /admin/payments as the existing founder, through operations login.
3. In sandbox, create a request, submit its simulated report and confirm the
   simulation. The ledger must say no money moved and no plan purchased.
4. For the owner's personal-UPI test, configure test mode privately. Create
   an INR 1 request. The owner pays manually using a different sending account;
   an agent must not submit the bank/UPI payment or ask for a PIN/OTP.
5. Enter the payer transaction reference. Confirm it against the receiving
   bank's official records; screenshots/SMS/browser messages are insufficient.
6. Founder enters official bank reference, 100 paise, exact receiving UPI ID,
   bank credit time in UTC and a review note. Only then record reconciliation.
7. A repeated reference must fail. An unconfirmed report must remain pending.
   Review and handle any refund through the bank; a request is not a refund.

An expired QR can still be paid from a saved image; expiry is a display rule,
not revocation of a bank transfer. Accept late reports for human reconciliation.
Avoid retaining bank statements or full alerts in this database. Keep the
existing support and retention process for any real-money test records.

## Business cutover still required

Obtain the business receiving details and appropriate merchant setup from
the acquiring bank. Confirm pricing, tax presentation, deliverables, legal
acceptance, support and refund operations. Build a reviewed live-mode integration
with authoritative bank/acquirer confirmation before paid-plan activation.
The test release intentionally rejects mode=live. A personal test confirmation
must never turn into a six-month service purchase.

UPI is INR-only in this implementation. International USD prices remain on
the existing contact/advisory path. No public percentage-of-CTC fee is exposed.

## Sources

- [Reviewed YouPI repository](https://github.com/youpi-pg/YouPI-PG/tree/d7b07414d803094525ceedd5cf81e8a38157263e)
- [NPCI merchant onboarding and QR/intent guidance](https://www.npci.org.in/what-we-do/upi/faqs)
- [NPCI bank-verified beneficiary-name display](https://www.npci.org.in/uploads/UPI_OC_No_101_A_FY_2025_26_Strengthening_beneficiary_name_verification_and_display_during_UPI_transactions_eb7bd7ed72.pdf)
- [MIT-licensed QR dependency](https://github.com/soldair/node-qrcode)
