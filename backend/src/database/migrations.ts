// Database changes, applied in order on startup (MigrationService). Never edit an applied one - add a new one.
export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: '001_accounts',
    sql: `
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL,
        password_hash text NOT NULL,
        is_adult boolean NOT NULL,
        terms_accepted_at timestamptz NOT NULL,
        email_verified_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX users_email_key ON users (lower(email));

      -- login sessions (cookie holds the raw token, the table only its SHA-256)
      CREATE TABLE sessions (
        token_hash text PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL
      );
      CREATE INDEX sessions_user_idx ON sessions (user_id);

      -- one-time email links (verify email now, reset password later)
      CREATE TABLE email_tokens (
        token_hash text PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        purpose text NOT NULL,
        email text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        used_at timestamptz
      );
      CREATE INDEX email_tokens_user_idx ON email_tokens (user_id, purpose);

      -- every email the site sends. Until an email service is chosen nothing leaves this PC:
      -- emails are only stored here (and printed in the server log).
      CREATE TABLE email_outbox (
        id bigserial PRIMARY KEY,
        to_email text NOT NULL,
        subject text NOT NULL,
        body text NOT NULL,
        link text,
        created_at timestamptz NOT NULL DEFAULT now(),
        sent_at timestamptz
      );
    `,
  },
  {
    id: '002_terms_version',
    // B25: save WHICH terms + privacy version was accepted, not only when
    sql: `ALTER TABLE users ADD COLUMN terms_version text NOT NULL DEFAULT 'draft-2026-10-26'; ALTER TABLE users ALTER COLUMN terms_version DROP DEFAULT;`,
  },
];
