CREATE TABLE IF NOT EXISTS app_users (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  email text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS threads (
  id text PRIMARY KEY,
  subject_type text NOT NULL CHECK (subject_type IN ('part', 'combo', 'event')),
  subject_id text NOT NULL,
  author_id text NOT NULL REFERENCES app_users (id),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  hidden_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS threads_subject_created_idx
  ON threads (subject_type, subject_id, created_at DESC)
  WHERE hidden_at IS NULL AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS thread_reports (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES threads (id),
  reporter_id text NOT NULL REFERENCES app_users (id),
  reason text CHECK (reason IS NULL OR char_length(btrim(reason)) <= 500),
  status text NOT NULL CHECK (status IN ('open', 'dismissed', 'actioned')) DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (thread_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id text NOT NULL REFERENCES app_users (id),
  blocked_id text NOT NULL REFERENCES app_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
