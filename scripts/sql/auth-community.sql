-- Apply manually to the site's DATABASE_URL database after discussion.sql.
-- Never run automatically at boot/build. Resolve duplicate emails before applying.
BEGIN;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS community_role text NOT NULL DEFAULT 'member'
  CHECK (community_role IN ('member', 'moderator', 'admin'));
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS posting_blocked_at timestamptz;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_post_at timestamptz;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_report_at timestamptz;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_identity_idx
  ON app_users (lower(email)) WHERE email IS NOT NULL AND btrim(email) <> '';
CREATE TABLE IF NOT EXISTS auth_accounts (
  provider text NOT NULL CHECK (provider IN ('google', 'line')),
  provider_account_id text NOT NULL CHECK (btrim(provider_account_id) <> ''),
  user_id text NOT NULL REFERENCES app_users(id),
  type text NOT NULL CHECK (type IN ('oauth', 'oidc')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS auth_accounts_user_idx ON auth_accounts(user_id);
-- OAuth access/refresh/id tokens and session tokens are intentionally not stored.
-- Administrators are manually provisioned by the maintainer after identity review;
-- no public action changes community_role. Existing blocked_users remains a
-- personal relationship table; posting_blocked_at is the global moderation ban.
COMMIT;
