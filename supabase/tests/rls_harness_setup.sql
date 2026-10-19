-- Minimal Supabase-compatible auth and storage objects for the isolated RLS regression database.
-- This file runs before application migrations in CI. It contains no production data.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END
$$;
ALTER ROLE service_role BYPASSRLS;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_app_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  public boolean NOT NULL DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (bucket_id, name)
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION storage.foldername(path text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN array_length(parts, 1) <= 1 THEN ARRAY[]::text[]
    ELSE parts[1:(array_length(parts, 1) - 1)]
  END
  FROM (SELECT string_to_array(path, '/') AS parts) AS path_parts;
$$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

GRANT USAGE ON SCHEMA auth, storage, public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated, service_role;
