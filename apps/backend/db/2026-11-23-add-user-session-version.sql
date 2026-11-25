BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  ALTER TABLE public.users
    ADD CONSTRAINT users_session_version_check CHECK (session_version >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
