-- =========================================================================
-- MODULAR TICKETING SYSTEM (MTS) - MASTER DATA SCHEMA
-- Optimized for Performance, Strict Data Isolation, and Audit Compliance
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS system_cache;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS knowledge_base;
DROP TABLE IF EXISTS internal_notes;
DROP TABLE IF EXISTS status_history;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS departments;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. INFRASTRUCTURE & SETTINGS
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value TEXT NULL,
    is_enabled BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USERS & PRESENCE (The Green Dot Feature)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department_id INT NULL,
    role ENUM('superadmin', 'agent') DEFAULT 'agent',
    can_accept_tickets BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at DATETIME NULL,
    signature TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CORE TICKETING ENGINE (Capped Pagination & SLA Context Built-In)
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestor_email VARCHAR(150) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    department_id INT NULL,
    assigned_to INT NULL,
    status ENUM('open', 'on-hold', 'closed', 'cancelled') DEFAULT 'open',
    priority ENUM('low', 'med', 'high', 'urgent') DEFAULT 'med',
    supplier_name VARCHAR(150) NULL, -- Clean & optional text field for tracking suppliers
    sla_deadline DATETIME NULL,
    is_overdue BOOLEAN DEFAULT FALSE,
    total_hold_time_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SPAM TRACKING & ESCALATING COOLDOWN DATA
CREATE TABLE spam_trackers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestor_email VARCHAR(150) UNIQUE NOT NULL,
    request_count_last_5m INT DEFAULT 1,
    violation_tier INT DEFAULT 0, -- Tiers map to: 0 (None), 1 (30m), 2 (1hr), 3 (24hr)
    next_allowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SERVICE STATUS HUB (Incident Communications Alert)
CREATE TABLE service_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    system_name VARCHAR(100) NOT NULL,
    status_state ENUM('operational', 'degraded', 'down') DEFAULT 'operational',
    alert_message VARCHAR(255) NULL,
    is_visible_to_public BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. IMMUTABLE ACCOUNTABILITY & AUDIT TRAILS
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    actor_id INT NULL, -- NULL implies automated system change (e.g., Auto SLA breach)
    action_type VARCHAR(50) NOT NULL, -- e.g., 'STATUS_CHANGE', 'REASSIGN', 'CLIPBOARD_EXPORT'
    old_value TEXT NULL,
    new_value TEXT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    status_from VARCHAR(50) NOT NULL,
    status_to VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. COLLABORATION, FILE HANDLERS, & REPOSITORIES
CREATE TABLE internal_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    agent_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE knowledge_base (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    department_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_kb INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PERFORMANCE CRITICAL PERFORMANCE INDEXES (High-Speed Processing)
CREATE INDEX idx_tickets_dept_status ON tickets(department_id, status);
CREATE INDEX idx_tickets_requestor ON tickets(requestor_email);
CREATE INDEX idx_audit_logs_ticket ON audit_logs(ticket_id);
CREATE INDEX idx_users_email_role ON users(email, role);
CREATE INDEX idx_spam_email_time ON spam_trackers(requestor_email, next_allowed_at);

-- 9. CACHE LAYER ENGINE TABLE (Protects MySQL from heavy redundant reads)
CREATE TABLE system_cache (
    cache_key VARCHAR(100) PRIMARY KEY,
    cache_value LONGTEXT NOT NULL,
    expires_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
