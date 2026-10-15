-- Migration: VMS Additional Enterprise Tables (Audit, Login History, Notifications)
USE visitor_db;

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    actor_id BIGINT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) DEFAULT 'AUTH',
    entity VARCHAR(100) NULL,
    table_name VARCHAR(100) NULL,
    record_id BIGINT UNSIGNED NULL,
    entity_id BIGINT UNSIGNED NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    metadata_json JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    http_method VARCHAR(10) NULL,
    endpoint VARCHAR(255) NULL,
    status VARCHAR(30) DEFAULT 'SUCCESS',
    severity VARCHAR(20) DEFAULT 'LOW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 2. Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    status VARCHAR(30) DEFAULT 'SUCCESS',
    failure_reason TEXT NULL,
    CONSTRAINT fk_login_hist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Indices for performance optimizations
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_login_hist_user ON login_history(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
