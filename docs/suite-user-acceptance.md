# Ten-product user acceptance

Updated: 21 October 2026, 20:34 IST. Status: executable scripts prepared; human sessions NOT RUN.

## Session setup and pass rule

Use local/disposable infrastructure with synthetic data. Preview shares Production and is unsuitable for write UAT. Record app SHA, database revision, device/browser, date/time in IST and anonymous participant reference. Obtain consent before recording feedback; store recordings privately. Use separate candidate A/B, employer A/B and staff identities. Do not give participants service-role keys. Do not message or recruit people without the founder's authorization.

Proposed minimum before first cohort: three representative candidates, two employer users and one service operator; include a paired candidate/employer session. Founder acceptance may approve this sample or replace it with a documented rationale. Counts alone do not establish product value.

Each relevant participant must complete the task and explain who can access the information without moderator coaching. Record independent success, assisted success or failure, time, confusion, defects and the participant's words. All critical access/consent/deletion errors block release. Retest fixes on the same release candidate; product owner explicitly accepts remaining minor issues.

## Candidate tasks

| ID / product | Instructions to participant | Expected outcome |
|---|---|---|
| C01 Talent Record | Add synthetic work/education, correct a mistake, find sharing controls and explain the default. | Corrections persist; sharing starts private; candidate understands the effect of opting in/out. |
| C02 Signal Ledger | Enter a source with context/date/uncertainty; confirm it and later correct it. | Candidate distinguishes extraction from confirmation; revision history is understandable. |
| C03 Capability Atlas | Associate a capability with confirmed evidence and explain what the association proves. | Traceable source; no inferred proficiency or unexplained score. |
| C04 Career Scenario Lab | Compare two roles, enter assumptions/questions and change one assumption. | Scenarios remain editable/private; candidate understands uncertainty and no promised hiring result. |
| C05 Opportunity Intelligence | Read a human suggestion and its reason; save, dismiss and restore it; add a private question. | No application or sharing occurs implicitly; candidate can distinguish private notes from employer-visible role data. |
| C06 Proof Studio | Select a confirmed source, redact a private draft, preview recipient/content, then approve sharing; correct the source. | Employer sees nothing before approval and only approved text after; correction withdraws the old snapshot. |
| C07 Account control | Withdraw sharing, find support and deletion; on synthetic account try wrong password, cleanup failure/retry and successful deletion. | Honest error/success states, paid-order exception explained, private data/Storage removed only on success; independent backend checks recorded. |

## Employer tasks

| ID | Instructions | Expected outcome |
|---|---|---|
| E01 Role Intelligence Studio | Define purpose/outcomes, separate essential/preferred criteria and explain evidence/rationale; submit for review. | Employer understands criteria and human review; no arbitrary hidden screening score. |
| E02 Publication/correction | Staff requests changes, employer corrects, staff approves, employer proposes and staff publishes; edit approved criteria. | Candidate sees reviewed snapshot; definition change pauses publication and requires renewed review. |
| E03 Applicant access | Inspect an applicant with consent, then withdraw candidate consent; try employer B's account. | Employer understands consent scope; subsequent access is denied after withdrawal and cross-company access is denied. |

## Paired participant tasks

| ID / product | Task | Expected outcome |
|---|---|---|
| P01 Mutual Decision Room | Candidate invites employer with chosen name/purpose; exchange question, answer and correction. | Both explain participants, purpose and 30-day access; staff/uninvited employer cannot read room. |
| P02 Withdrawal/expiry | Candidate withdraws room; employer reloads room, proof and export; exercise expiry with synthetic time fixtures. | New reads fail, no reopen of withdrawn room; both understand copies already downloaded are outside recall. |
| P03 Decision Dossier | Add evidence reference, human judgment and correction; export JSON, then withdraw source. | Entries distinguish evidence/judgment; export matches visible approved content; private source IDs absent; withdrawal hides evidence references, independent text/copies require correction handling. |

## Staff and Human Intelligence Services

| ID | Task | Expected outcome |
|---|---|---|
| S01 | Candidate requests scoped review; staff claims it with declaration, posts progress and outcome. | No charge/subscription created; candidate sees notes; unassigned triage and assigned-only access behave as described. |
| S02 | Candidate escalates, then withdraws consent; founder reviews escalation; staff attempts access after withdrawal. | Escalation reaches founder without staff approval; consent removal denies staff access; operator explains limits and handoff. |
| S03 | Process conflict, incorrect advice and paid-order erasure exception using trial records. | Conflict reassigned without informal data copying; corrections visible; financial retention handled by authorized support, never by deleting order rows. |

## Accessibility and usability sweep

On candidate, employer and staff core journeys: keyboard-only navigation and visible focus; meaningful labels/errors; screen-reader headings and live feedback; zoom 200%; narrow viewport; long/empty data; pending/double-submit/error recovery; understandable IST expiry. Record browser/screen-reader combinations and actual results. Automated smoke checks do not close this manual gate.

## Evidence template

Session reference / role / app SHA / DB revision / IST start-end / browser-device-accessibility setup / case IDs / independent-assistance-failure outcome / access understanding / defects / private evidence reference / retest result / participant acceptance or objection / product owner decision and timestamp.

Current results: no representative-user sessions recorded. Do not replace this line with fabricated pass results or substitute synthetic CI for user acceptance.
