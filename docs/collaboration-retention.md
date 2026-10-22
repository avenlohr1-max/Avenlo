# Collaboration retention — proposed technical policy

Updated: 21 October 2026, 03:26 IST. Requires owner/retention acceptance before rollout; these are proposed engineering defaults, not statutory retention advice.

| Data | Access end | Proposed purge |
|---|---|---|
| Decision rooms and child messages/proofs/dossier/export requests | Immediate candidate withdrawal or 30-day expiry | Delete after 90 days from expiry; candidate may delete sooner |
| Proof drafts without a room | Candidate-only | Delete after 90 days from capture; candidate may delete sooner |
| Human service case and shared notes | Immediate withdrawal or 30-day expiry for staff | Delete after 90 days from expiry; candidate may delete sooner |
| Consent/assignment audit metadata | Candidate-only | Delete after 180 days; account erasure removes candidate-owned audit metadata |
| Downloaded copies | Outside Avenlo's recall control | Recipient must honor purpose, confidentiality and agreed deletion; support handles requests |
| Paid orders, disputes, support and backups | Separate policies | Owner must reconcile legal/commercial obligations before activating deletion/paid delivery |

The SQL below is an operator-reviewed template. It is not scheduled or executed in production by this change. An accountable operator must approve exclusions/holds, test counts in a disposable restored database, schedule a daily run and record affected row counts. Do not enable the products with an indefinite retention promise.

```sql
begin;
delete from public.decision_rooms where expires_at < now() - interval '90 days';
delete from public.proof_packages where room_id is null and captured_at < now() - interval '90 days';
delete from public.intelligence_cases where expires_at < now() - interval '90 days';
delete from public.collaboration_events where occurred_at < now() - interval '180 days';
commit;
```

Room/case cascades remove their child records. Audit events retain only IDs, operation and access/status metadata; private evidence/message content is excluded. Candidate account deletion removes candidate-owned collaboration data even when room access has already ended. Existing service-order records still block automated account deletion for support review.

Before rollout: choose and publish accepted periods, define exceptions and deletion deadlines for downloaded copies, approve backup expiry, establish a support process for corrections/disagreements and test the purge on synthetic retained/expired/erased fixtures. A timer without those decisions is insufficient evidence of retention readiness.
