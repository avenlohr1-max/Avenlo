# Razorpay rollout

Owner selected Razorpay on 28 October 2026 for the next two months, replacing
the personal-UPI experiment as the intended customer payment method. Review
the gateway choice around 28 December 2026; there is no automatic cutoff or
scheduled migration. Existing private test records stay as audit history.

## Configuration

Start with the merchant account's test-mode keys. Configure these securely
in the hosting account, never Git or chat:

- `AVENLO_PAYMENT_PROVIDER=razorpay`
- `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`: the same account/mode key ID.
- `RAZORPAY_KEY_SECRET`: server-only API secret.
- `RAZORPAY_WEBHOOK_SECRET`: separate server-only signing secret.
- `AVENLO_UPI_ENABLED=false`: disable the founder personal-UPI QR workflow.

Webhook URL: `https://avenlo.in/api/payments/razorpay/webhook`.
Subscribe to `payment.captured`, configure payment capture in Razorpay, and
verify delivery/signatures in test mode before using live keys. An authorised
but uncaptured payment stays pending. The browser does not collect a UTR.

Checkout also requires the actual configured versions of Candidate Terms,
Privacy Notice, Paid Service Terms and Refund Policy. Do not invent approval
or set arbitrary versions merely to bypass the gate.

The checkout response is signature-checked and the server retrieves the
payment from Razorpay, matching payment ID, order ID, amount and currency.
Only captured funds reach the trusted settlement function. Signed captured
webhooks can complete a delayed notification when the browser is closed.
The browser retries a pending capture for a bounded period and avoids starting
another payment after the checkout success response. No money is transferred
or refunded by deployment/configuration work.

## Invoice

The owner requested a plain Avenlo invoice design with GST fields and tax lines
removed. A sample PDF is kept in the private workspace under
`outputs/invoice-design/avenlo-invoice-no-gst.pdf`, outside application Git.
The sample is not an issued invoice and does not determine tax status.

Automatic numbered invoice issuance, issuer details and an authenticated
invoice/PDF destination remain separate work; the current successful checkout
returns to the dashboard. Do not claim invoices are being generated until
that implementation is connected and tested. Do not invoice the earlier
personal INR 1 transfer as a paid candidate service.

## Acceptance

Test a successful capture, delayed capture, invalid signature, another order,
wrong amount/currency, duplicate webhook and closed browser. Confirm the
correct merchant account and actual approved price. Only after these checks
and secure live configuration should customer charging be enabled.

Sources: Razorpay Node integration and webhook validation documentation:
https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/
https://razorpay.com/docs/webhooks/validate-test/
