-- ============================================================
-- EBP Auth - Users & Sessions
-- ============================================================

CREATE TABLE app_user (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,         -- bcrypt hash
    user_role     VARCHAR(20)  NOT NULL,          -- MANAGER | ADMIN
    employee_id   INT REFERENCES employee(id),   -- linked for MANAGER, NULL for ADMIN
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_session (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES app_user(id),
    token       VARCHAR(255) UNIQUE NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_token   ON user_session(token);
CREATE INDEX idx_user_employee   ON app_user(employee_id);

-- ============================================================
-- Seed: 1 Admin + 1 Store Manager per store (10 managers)
-- Password for ALL users: "password123"
-- bcrypt hash of "password123" (cost 10):
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2
-- ============================================================

-- Admin user (standalone, no employee link)
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'ADMIN', NULL, 'System Administrator', 'admin@ebp.co.uk');

-- Store Managers — one per store, linked to first employee at each store
-- Store 1: London Oxford St  → employee id 1
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.london1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 1, 'Alfie Robinson', 'alfie.robinson1@ebp.co.uk');

-- Store 2: London Canary Wharf → employee id 2
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.london2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 2, 'Vivaan Jones', 'vivaan.jones2@ebp.co.uk');

-- Store 3: Manchester → employee id 3
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.manchester', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 3, 'Aditya Williams', 'aditya.williams3@ebp.co.uk');

-- Store 4: Birmingham → employee id 4
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.birmingham', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 4, 'Vihaan Taylor', 'vihaan.taylor4@ebp.co.uk');

-- Store 5: Leeds → employee id 5
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.leeds', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 5, 'Arjun Brown', 'arjun.brown5@ebp.co.uk');

-- Store 6: Bristol → employee id 6
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.bristol', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 6, 'Sai Davies', 'sai.davies6@ebp.co.uk');

-- Store 7: Edinburgh → employee id 7
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.edinburgh', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 7, 'Reyansh Evans', 'reyansh.evans7@ebp.co.uk');

-- Store 8: Glasgow → employee id 8
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.glasgow', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 8, 'Ayaan Wilson', 'ayaan.wilson8@ebp.co.uk');

-- Store 9: Cardiff → employee id 9
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.cardiff', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 9, 'Krishna Thomas', 'krishna.thomas9@ebp.co.uk');

-- Store 10: Belfast → employee id 10
INSERT INTO app_user (username, password_hash, user_role, employee_id, full_name, email) VALUES
  ('manager.belfast', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2',
   'MANAGER', 10, 'Ishaan Roberts', 'ishaan.roberts10@ebp.co.uk');
