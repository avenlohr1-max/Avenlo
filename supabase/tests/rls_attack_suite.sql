-- RLS regression checks against a disposable Postgres instance.
-- The CI workflow applies application migrations before running this file.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('10000000-0000-0000-0000-000000000001', 'candidate-a@example.test', '{"full_name":"Candidate A","account_type":"candidate"}'),
  ('10000000-0000-0000-0000-000000000002', 'candidate-b@example.test', '{"full_name":"Candidate B","account_type":"candidate"}'),
  ('10000000-0000-0000-0000-000000000003', 'candidate-c@example.test', '{"full_name":"Candidate C","account_type":"candidate"}'),
  ('20000000-0000-0000-0000-000000000001', 'company-a@example.test', '{"full_name":"Company A","account_type":"company"}'),
  ('20000000-0000-0000-0000-000000000002', 'company-b@example.test', '{"full_name":"Company B","account_type":"company"}'),
  ('30000000-0000-0000-0000-000000000001', 'staff@example.test', '{"full_name":"Staff"}'),
  ('40000000-0000-0000-0000-000000000001', 'founder@example.test', '{"full_name":"Founder"}');

UPDATE public.profiles SET role = 'company' WHERE id IN ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002');
UPDATE public.profiles SET role = 'staff' WHERE id = '30000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'founder' WHERE id = '40000000-0000-0000-0000-000000000001';

INSERT INTO public.candidate_profiles (user_id, industry, preferences, share_with_applicant_companies) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Technology', '{}', true),
  ('10000000-0000-0000-0000-000000000002', 'Finance', '{}', true),
  ('10000000-0000-0000-0000-000000000003', 'Healthcare', '{}', false);

INSERT INTO public.candidate_skills (user_id, skill) VALUES
  ('10000000-0000-0000-0000-000000000001', 'SQL'),
  ('10000000-0000-0000-0000-000000000002', 'Finance'),
  ('10000000-0000-0000-0000-000000000003', 'Research');

INSERT INTO public.companies (id, owner_id, name) VALUES
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Company A'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Company B');

INSERT INTO public.jobs (id, company_id, created_by, title, description, status) VALUES
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Open role', 'A role open for applications.', 'open'),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Draft role', 'A role not visible to candidates.', 'draft'),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Company B role', 'A role owned by a different company.', 'open');

INSERT INTO public.applications (id, job_id, candidate_id, status) VALUES
  ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'submitted'),
  ('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'submitted'),
  ('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'submitted');

INSERT INTO storage.objects (bucket_id, name, owner) VALUES
  ('candidate-documents', '10000000-0000-0000-0000-000000000001/resume.pdf', '10000000-0000-0000-0000-000000000001'),
  ('candidate-documents', '10000000-0000-0000-0000-000000000002/resume.pdf', '10000000-0000-0000-0000-000000000002'),
  ('candidate-documents', '10000000-0000-0000-0000-000000000003/resume.pdf', '10000000-0000-0000-0000-000000000003');

INSERT INTO public.candidate_signals (id, candidate_id, signal_type, statement, source_type, source_label, source_date, context, uncertainty_note, verification_status) VALUES
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'achievement', 'Reduced support response time', 'work_sample', '2024 operations project', '2024-06-01', 'Candidate led a process improvement at work.', 'Impact estimate needs a source document.', 'needs_review'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'skill', 'SQL reporting', 'candidate', 'Candidate reflection', null, 'Used SQL to prepare recurring reports.', 'No work sample attached yet.', 'candidate_confirmed');
INSERT INTO public.candidate_capability_evidence (candidate_id, candidate_skill_id, signal_id)
SELECT cs.user_id, cs.id, sig.id
FROM public.candidate_skills cs
JOIN public.candidate_signals sig ON sig.candidate_id = cs.user_id
WHERE (cs.user_id = '10000000-0000-0000-0000-000000000001' AND cs.skill = 'SQL' AND sig.id = '80000000-0000-0000-0000-000000000001')
   OR (cs.user_id = '10000000-0000-0000-0000-000000000002' AND cs.skill = 'Finance' AND sig.id = '80000000-0000-0000-0000-000000000002');

BEGIN;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  n integer;
  blocked boolean;
BEGIN
  SELECT count(*) INTO n FROM public.profiles WHERE id = '10000000-0000-0000-0000-000000000002';
  IF n <> 0 THEN RAISE EXCEPTION 'candidate read another candidate profile'; END IF;
  SELECT count(*) INTO n FROM public.candidate_profiles WHERE user_id = '10000000-0000-0000-0000-000000000002';
  IF n <> 0 THEN RAISE EXCEPTION 'candidate read another candidate record'; END IF;
  SELECT count(*) INTO n FROM public.candidate_skills WHERE user_id = '10000000-0000-0000-0000-000000000002';
  IF n <> 0 THEN RAISE EXCEPTION 'candidate read another candidate skills'; END IF;
  SELECT count(*) INTO n FROM public.candidate_signals WHERE candidate_id = '10000000-0000-0000-0000-000000000001';
  IF n <> 1 THEN RAISE EXCEPTION 'candidate could not read own signal'; END IF;
  SELECT count(*) INTO n FROM public.candidate_signals WHERE candidate_id = '10000000-0000-0000-0000-000000000002';
  IF n <> 0 THEN RAISE EXCEPTION 'candidate read another candidate signal'; END IF;
  SELECT count(*) INTO n FROM public.candidate_capability_evidence WHERE candidate_id = '10000000-0000-0000-0000-000000000001';
  IF n <> 1 THEN RAISE EXCEPTION 'candidate could not read own capability evidence link'; END IF;
  SELECT count(*) INTO n FROM public.candidate_capability_evidence WHERE candidate_id = '10000000-0000-0000-0000-000000000002';
  IF n <> 0 THEN RAISE EXCEPTION 'candidate read another candidate capability evidence link'; END IF;
  UPDATE public.candidate_signals SET statement = 'Reduced support response time by 18 percent'
    WHERE id = '80000000-0000-0000-0000-000000000001';
  SELECT count(*) INTO n FROM public.candidate_signal_revisions
    WHERE signal_id = '80000000-0000-0000-0000-000000000001';
  IF n <> 1 THEN RAISE EXCEPTION 'signal correction history was not recorded'; END IF;
  SELECT count(*) INTO n FROM public.candidate_signal_revisions
    WHERE signal_id = '80000000-0000-0000-0000-000000000002';
  IF n <> 0 THEN RAISE EXCEPTION 'candidate read another candidate signal history'; END IF;
  SELECT count(*) INTO n FROM public.jobs WHERE id = '60000000-0000-0000-0000-000000000001';
  IF n <> 1 THEN RAISE EXCEPTION 'candidate could not read an open job'; END IF;
  SELECT count(*) INTO n FROM public.jobs WHERE id = '60000000-0000-0000-0000-000000000002';
  IF n <> 0 THEN RAISE EXCEPTION 'candidate read a draft job'; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE name = '10000000-0000-0000-0000-000000000002/resume.pdf';
  IF n <> 0 THEN RAISE EXCEPTION 'candidate read another candidate document'; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE name = '10000000-0000-0000-0000-000000000001/resume.pdf';
  IF n <> 1 THEN RAISE EXCEPTION 'candidate could not read own document'; END IF;

  blocked := false;
  BEGIN
    UPDATE public.candidate_profiles
      SET user_id = '10000000-0000-0000-0000-000000000004'
      WHERE user_id = '10000000-0000-0000-0000-000000000001';
  EXCEPTION WHEN OTHERS THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'candidate reassigned own record to another user'; END IF;

  UPDATE public.applications SET status = 'hired'
    WHERE id = '70000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'candidate changed application review status'; END IF;
END
$;

UPDATE public.candidate_profiles
SET share_with_applicant_companies = false
WHERE user_id = '10000000-0000-0000-0000-000000000001';
DO $
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.candidate_sharing_events
  WHERE candidate_id = '10000000-0000-0000-0000-000000000001'
    AND previous_value = true AND new_value = false;
  IF n <> 1 THEN RAISE EXCEPTION 'candidate sharing withdrawal was not audited'; END IF;
END
$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
SET LOCAL ROLE authenticated;
DO $
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.profiles WHERE id = '10000000-0000-0000-0000-000000000001';
  IF n <> 0 THEN RAISE EXCEPTION 'company retained profile access after sharing was withdrawn'; END IF;
  SELECT count(*) INTO n FROM public.candidate_profiles WHERE user_id = '10000000-0000-0000-0000-000000000001';
  IF n <> 0 THEN RAISE EXCEPTION 'company retained candidate record access after sharing was withdrawn'; END IF;
  SELECT count(*) INTO n FROM public.candidate_skills WHERE user_id = '10000000-0000-0000-0000-000000000001';
  IF n <> 0 THEN RAISE EXCEPTION 'company retained skill access after sharing was withdrawn'; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE name = '10000000-0000-0000-0000-000000000001/resume.pdf';
  IF n <> 0 THEN RAISE EXCEPTION 'company retained resume access after sharing was withdrawn'; END IF;
END
$;
ROLLBACK;

BEGIN;
SELECT set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.applications WHERE id IN (
    '70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000003'
  );
  IF n <> 3 THEN RAISE EXCEPTION 'company could not read all applicants for its role'; END IF;
  SELECT count(*) INTO n FROM public.candidate_signals WHERE candidate_id = '10000000-0000-0000-0000-000000000001';
  IF n <> 0 THEN RAISE EXCEPTION 'company read candidate-private Signal Ledger entries'; END IF;
  SELECT count(*) INTO n FROM public.candidate_capability_evidence WHERE candidate_id = '10000000-0000-0000-0000-000000000001';
  IF n <> 0 THEN RAISE EXCEPTION 'company read candidate-private capability evidence links'; END IF;
  SELECT count(*) INTO n FROM public.profiles WHERE id = '10000000-0000-0000-0000-000000000001';
  IF n <> 1 THEN RAISE EXCEPTION 'company could not read opted-in applicant profile'; END IF;
  SELECT count(*) INTO n FROM public.profiles WHERE id = '10000000-0000-0000-0000-000000000002';
  IF n <> 1 THEN RAISE EXCEPTION 'company could not read another opted-in applicant profile'; END IF;
  SELECT count(*) INTO n FROM public.profiles WHERE id = '10000000-0000-0000-0000-000000000003';
  IF n <> 0 THEN RAISE EXCEPTION 'company read profile after candidate opted out'; END IF;
  SELECT count(*) INTO n FROM public.candidate_profiles WHERE user_id = '10000000-0000-0000-0000-000000000001';
  IF n <> 1 THEN RAISE EXCEPTION 'company could not read applicant candidate record'; END IF;
  SELECT count(*) INTO n FROM public.candidate_profiles WHERE user_id = '10000000-0000-0000-0000-000000000003';
  IF n <> 0 THEN RAISE EXCEPTION 'company read a candidate record after the candidate opted out'; END IF;
  SELECT count(*) INTO n FROM public.candidate_skills WHERE user_id = '10000000-0000-0000-0000-000000000002';
  IF n <> 1 THEN RAISE EXCEPTION 'company could not read opted-in applicant skill'; END IF;
  SELECT count(*) INTO n FROM public.candidate_skills WHERE user_id = '10000000-0000-0000-0000-000000000003';
  IF n <> 0 THEN RAISE EXCEPTION 'company read skill after candidate opted out'; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE name = '10000000-0000-0000-0000-000000000003/resume.pdf';
  IF n <> 0 THEN RAISE EXCEPTION 'company read a resume after candidate opted out'; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE name = '10000000-0000-0000-0000-000000000001/resume.pdf';
  IF n <> 1 THEN RAISE EXCEPTION 'company could not read applicant resume'; END IF;

  UPDATE public.applications
    SET status = 'reviewing', match_score = 99
    WHERE id = '70000000-0000-0000-0000-000000000001';
  IF NOT EXISTS (
    SELECT 1 FROM public.applications
    WHERE id = '70000000-0000-0000-0000-000000000001'
      AND status = 'reviewing' AND match_score IS NULL
  ) THEN RAISE EXCEPTION 'company review update changed protected matching fields or failed'; END IF;

  SELECT count(*) INTO n FROM public.companies WHERE id = '50000000-0000-0000-0000-000000000002';
  IF n <> 0 THEN RAISE EXCEPTION 'company read another company record'; END IF;
END
$$;
ROLLBACK;

BEGIN;
SELECT set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.applications;
  IF n <> 0 THEN RAISE EXCEPTION 'company read another company applicants'; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE name LIKE '10000000-0000-0000-0000-0000000000%/resume.pdf';
  IF n <> 0 THEN RAISE EXCEPTION 'company read another company candidate resumes'; END IF;
END
$$;
ROLLBACK;

BEGIN;
SELECT set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.profiles WHERE id::text LIKE '10000000-0000-0000-0000-00000000000%';
  IF n <> 3 THEN RAISE EXCEPTION 'staff could not access candidate profiles'; END IF;
  SELECT count(*) INTO n FROM public.jobs WHERE id IN (
    '60000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002'
  );
  IF n <> 2 THEN RAISE EXCEPTION 'staff could not review roles'; END IF;
END
$$;
ROLLBACK;

BEGIN;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', true);
SET LOCAL ROLE anon;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.profiles;
  IF n <> 0 THEN RAISE EXCEPTION 'anonymous user read candidate profiles'; END IF;
  SELECT count(*) INTO n FROM storage.objects;
  IF n <> 0 THEN RAISE EXCEPTION 'anonymous user read private documents'; END IF;
END
$$;
ROLLBACK;
