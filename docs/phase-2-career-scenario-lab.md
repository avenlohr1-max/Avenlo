# Phase 2 — Career Scenario Lab

## First slice

Candidates create up to three role scenarios they want to explore. They write and can correct the assumptions, open questions, and possible next steps for each scenario. A scenario can link only to a signal the candidate has marked candidate-confirmed; the link keeps that signal's source and uncertainty visible.

Roles are candidate-defined or come from the candidate's own Talent Record target-role list. The product does not generate role recommendations, estimate fit, score capability, rank scenarios, or predict employment outcomes.

## Access and lifecycle

- Scenario records and their evidence links are private to the owning candidate through RLS.
- Companies and anonymous visitors receive no access.
- Evidence links must point to a candidate-confirmed signal owned by the same candidate. Composite foreign keys prevent cross-candidate associations.
- Deleting a scenario removes its evidence links. Deleting a Signal Ledger entry also removes links to that signal.
- There is no automatic expiry. Scenario data remains until the candidate deletes it or account erasure is handled.
- No production migration or real-candidate test is permitted until Phase 0 database-baseline and privacy gates are resolved.

## Validation before broader use

Test whether three scenarios are enough, whether candidates can identify unsupported assumptions, and whether the evidence/unknowns/next-step structure helps them plan conversations or exploration. Do not interpret usage as validated career prediction or hiring suitability.
