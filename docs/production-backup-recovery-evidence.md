# Production snapshot backup and recovery evidence

Updated: 22 October 2026, 01:22 IST.

**Status: ✅ DONE — encrypted off-site snapshot backup and hosted logical recovery drill for the captured Avenlo state.** This does not approve Production deployment or establish an ongoing backup SLA. Production application/schema/settings were unchanged.

## Approved scope and custody

Source project: `yzuuutynqfpbiozlrfmy`, PostgreSQL 17.11.0.002. The founder explicitly approved the sensitive database export, portable encryption and upload to a new private Google Drive folder owned by their account. Only the encrypted archive, manifest and README were uploaded. Folder/file readback confirmed owner-only permissions and `shared=false`; the folder contained exactly those three files.

The 21 October 2026, 20:20 IST snapshot was encrypted with age 1.3.2, whose official release SHA-256 was checked. The uploaded file was downloaded again. Ciphertext SHA-256, successful age decryption, plaintext SHA-256 and PostgreSQL archive-index validation all passed. The founder confirmed the recovery key was printed and safely stored separately from the PC. No recovery key, plaintext archive, API key, private record or private Drive URL is included in this repository.

## Hosted recovery target and isolation

The founder selected the Avenlo organization and authorized restoring sensitive user/Auth data into temporary project `avenlo-recovery-drill` (`lhwyurcgxrusihrbemrg`) in Mumbai. Supabase quoted $0/month; no paid plan or add-on was approved or purchased. The target ran PostgreSQL 17.11.0.003.

A separate private tooling directory preserved the live application's original project link. Before transfer, the empty target was verified and configured to expose only an inaccessible `recovery_quarantine` schema through the Data API, disable signup/email authentication, and remove live-app redirect targets. Configuration readback matched. The restore guard rejected the Production ref and required the target to be empty. Keys stayed in process memory; no notifications were sent. No WSL/Docker installation was needed.

## Provider-compatible restore

The input was the verified downloaded encrypted backup, locally decrypted and hash-checked in the previously approved restricted recovery folder. Application pre-data, data, post-data/object privileges and the custom Auth signup trigger were restored in one transaction with the authorized postgres session role. Auth, Storage and Vault table data were included.

Provider-owned schemas/extensions, provider migration ledgers and `supabase_admin` default privileges were retained from the fresh Supabase target rather than replayed as superuser operations. Postgres-owned defaults and application object grants were restored. Twenty-eight zero-row managed COPY blocks were omitted because protected provider tables need no insert when empty; their recovered counts were verified. No archived user row was omitted.

The preflight/initial attempts exposed session-role, protected empty-table and provider-default privilege restrictions. Guards/transactions stopped those attempts without leaving a partial restore. The final provider-compatible restore succeeded. These restrictions are now reflected in the operator script; bypassing them with broad ignore-errors is not an acceptable recovery procedure.

## Verification results

| Check | Evidence |
|---|---|
| Archive reference | Input SHA-256 matched the approved snapshot |
| Recovered data | **41 tables** matched archive-reference row counts and canonical row digests; zero mismatches |
| Application schema | Columns/defaults/types, enums, indexes, constraints, public policies, public triggers, application function definitions/configuration and RLS flags matched |
| Object permissions | Public-table grants matched source metadata |
| Auth service | Server-side admin read succeeded; restored-user count matched database; signup/email entry remained disabled |
| Storage service | Server-side bucket read succeeded; recovered count matched database |
| Data API isolation | Request for the public application schema was denied with `PGRST106` |
| Candidate/anonymous boundaries | Transactional synthetic fixtures verified own-profile access, cross-candidate denial and anonymous denial; rollback removed fixtures |
| Post-test integrity | All 41 table counts/digests matched again after access-test rollback |
| Key/data handling | Keys were not logged, private row values were not printed, and no notification requests were made |
| Teardown | Temporary project deleted; subsequent project listing contained only the original healthy Production project |

## Measured exercise and limits

Observed configuration/restore/verification interval from recovery-tooling initialization: **17.69 minutes**. Successful database restore command: **5.48 seconds**. Snapshot age at verification: **4.97 hours**. These are observations for this small captured state, not a guaranteed future full RTO or an ongoing RPO commitment; initial owner approval/provisioning time is not included in the initialization-based interval.

The captured state had no Storage objects, Vault secrets or MFA factors. Their empty recovered state was verified. Recovery of future nonempty file bytes, Vault encryption-dependent secrets, MFA factors or external identity/provider credentials needs a corresponding drill and key/configuration handling. This is a supported logical recovery onto fresh provider services, not a bit-for-bit copy of provider internals.

This is one snapshot and one recovery drill. Before a live migration, recheck schema/data drift, take a fresh consistent backup and retain the verified encrypted off-site copy. Establish daily backup scheduling, retention, alerting and recovery/deletion-suppression operations before onboarding real cohorts. Acceptance of retention/legal exceptions and rollout ownership remains tracked separately; no public rollout, main merge, production erasure enablement or live migration was authorized by this evidence.

## Next sequential item

**2 — Live migration and security:** finalize canonical migration-history reconciliation and the reviewed delta, then execute under the release controls. The founder's Free-plan decision still leaves leaked-password protection open. Overall phases remain pending their remaining exit criteria.

References: [Supabase logical backup/restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [Supabase backup scope](https://supabase.com/docs/guides/platform/backups).
