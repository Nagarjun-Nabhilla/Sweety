CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readings (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot         TEXT NOT NULL CHECK (slot IN ('morning', 'after_breakfast', 'after_lunch', 'after_dinner')),
  value        NUMERIC(6,3) NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, reading_date, slot)  -- one reading per slot per day
);

-- Upgrade for tables created before decimals were allowed (safe to run repeatedly).
ALTER TABLE readings ALTER COLUMN value TYPE NUMERIC(6,3);
