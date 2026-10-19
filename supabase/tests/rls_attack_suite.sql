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

UPDATE public.profiles SET role = 'staff' WHERE id = '30000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'founder' WHERE id = '40000000-0000-0000-0000-000000000001';

INSERT INTO public.candidate_profiles (user_id, industry, preferences) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Technology', '{}'),
  ('10000000-0000-0000-0000-000000000002', 'Finance', '{}'),
  ('10000000-0000-0000-0000-000000000003', 'Healthcare', '{}');

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
  ('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'submitted');

INSERT INTO storage.objects (bucket_id, name, owner) VALUES
  ('candidate-documents', '10000000-0000-0000-0000-000000000001/resume.pdf', '10000000-0000-0000-0000-000000000001'),
  ('candidate-documents', '10000000-0000-0000-0000-000000000002/resume.pdf', '10000000-0000-0000-0000-000000000002'),
  ('candidate-documents', '10000000-0000-0000-0000-000000000003/resume.pdf', '10000000-0000-0000-0000-000000000003');

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
$$;
ROLLBACK;

BEGIN;
SELECT set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.applications WHERE id IN (
    '70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002'
  );
  IF n <> 2 THEN RAISE EXCEPTION 'company could not read applicants for its role'; END IF;
  SELECT count(*) INTO n FROM public.candidate_profiles WHERE user_id = '10000000-0000-0000-0000-000000000003';
  IF n <> 0 THEN RAISE EXCEPTION 'company read a non-applicant candidate record'; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE name = '10000000-0000-0000-0000-000000000003/resume.pdf';
  IF n <> 0 THEN RAISE EXCEPTION 'company read a non-applicant resume'; END IF;
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
