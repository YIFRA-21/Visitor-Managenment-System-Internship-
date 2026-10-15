-- Migration: VMS Employee Temporary Credentials & Password History
-- Adds columns for first-login temporary password expiry and a password history
-- table used to enforce "no reuse of recent passwords".
USE visitor_db;

-- 1. Temporary credential timestamps on users (validity window for first login)
ALTER TABLE users ADD COLUMN temporary_password_created_at DATETIME NULL;
ALTER TABLE users ADD COLUMN temporary_password_expires_at DATETIME NULL;

-- 2. Password history table (recent passwords per user)
CREATE TABLE IF NOT EXISTS password_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    password_hash VARCHAR(255) NULL,
    change_reason VARCHAR(100) NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_history_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_password_history_user ON password_history(user_id);
