# Phase 4 — Role Intelligence Studio

Employers create role briefs in `/company/roles`. A definition contains its
purpose, expected outcomes, essential requirements, preferred capabilities,
expected evidence for every requirement and a rationale for every essential.
Location and work mode are explicit optional context. Missing fields are labelled
as unspecified. Criteria do not produce candidate scores or hidden filters.

Drafts may be incomplete. Submission requires a purpose, outcomes, essentials,
evidence expectations, essential rationales and no duplicate requirements across
or within categories. Field/collection limits and workflow rules are enforced in
both the application and database, including direct Data API writes.

Staff/founders review a specific revision at `/staff/roles`, either approving the
definition or requesting changes with a mandatory note. Reviewers cannot rewrite
employer criteria. Employers may revise or withdraw a submission; editing an
approved brief clears its approval metadata and starts a draft or new submission.
Earlier definitions and review notes remain in server-written revision history.
Optimistic revision predicates reject stale edits and reviews.

Owners see only their company briefs/history; operations see definitions for
review; candidates and other employers cannot read them. Client roles cannot
write or delete history. The trusted audit trigger is in the unexposed private
schema with direct execution revoked and a required authenticated actor.

Approval applies to the definition. This phase does not publish or modify jobs,
grant candidate access, score applicants or change Opportunity Intelligence
suggestions. Linking an approved definition to published role information remains
an integrated-release task, with review provenance preserved. Existing job
publication continues to require moderation.

The employer page shows the latest 50 briefs and 20 revisions for the selected
brief. Operations shows up to 50 submitted/approved briefs. Integrated usability,
pagination, retention/lifecycle handling for employer/reviewer accounts and
legal review remain release gates before real employer use.

Tests cover definition completeness, expected evidence, category separation,
duplicates, limits and untrusted metadata. Disposable database checks cover
ownership, self-approval denial, incomplete submissions, reviewer attribution,
immutable employer criteria during review, stale revisions, approval reset,
trusted history, candidate isolation and absence of job publication.

This PR stacks on Phase 3 PR #10. Existing Production backup/baseline/security,
retention and combined synthetic-journey gates remain open. Engineering DONE is
recorded only after the code checks and database regression workflow pass.
