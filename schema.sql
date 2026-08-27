-- Moonshot Wayfinder D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('zone', 'booth')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_target ON check_ins(user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
