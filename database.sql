-- =========================================================================
-- MODULAR TICKETING SYSTEM (MTS) - MASTER DATA SCHEMA
-- Optimized for Performance, Strict Data Isolation, and Audit Compliance
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS system_cache;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS ticket_tags;
DROP TABLE IF EXISTS sso_allowed_emails;
DROP TABLE IF EXISTS requester_accounts;
DROP TABLE IF EXISTS knowledge_base;
DROP TABLE IF EXISTS internal_notes;
DROP TABLE IF EXISTS status_history;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS ticket_departments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS request_type_fields;
DROP TABLE IF EXISTS request_types;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS departments;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. INFRASTRUCTURE & SETTINGS
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NULL, -- T055: shown to requestors on the portal picker card; superadmin-editable
    auto_assign_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- T051: new tickets auto-assigned to the least-loaded eligible agent
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

-- T045 (Trackr port): configurable per-department request types with dynamic custom fields.
-- Created before `tickets` since tickets.request_type_id references this table.
CREATE TABLE request_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    icon VARCHAR(8) NOT NULL DEFAULT '#', -- ASCII default; the app supplies a nicer emoji default
    -- at insert time via PHP (UTF-8 source, correct utf8mb4 PDO charset) rather than a SQL
    -- DEFAULT literal — multi-byte defaults passed through this Windows box's shell/mysql-CLI
    -- pipeline got silently mangled to '?' even with --default-character-set=utf8mb4 set.
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE request_type_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_type_id INT NOT NULL,
    label VARCHAR(150) NOT NULL,
    field_key VARCHAR(80) NOT NULL, -- storage key inside tickets.custom_fields JSON + form field name
    field_type ENUM('text', 'textarea', 'select', 'number', 'date', 'boolean') NOT NULL DEFAULT 'text',
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    field_options TEXT NULL, -- newline-separated choices, only meaningful for field_type='select'
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_request_type_field_key (request_type_id, field_key),
    FOREIGN KEY (request_type_id) REFERENCES request_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CORE TICKETING ENGINE (Capped Pagination & SLA Context Built-In)
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestor_email VARCHAR(150) NOT NULL,
    team_leader_name VARCHAR(150) NOT NULL,
    client_name VARCHAR(150) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    department_id INT NULL, -- primary/owning department; see ticket_departments below for T054's multi-department support
    assigned_to INT NULL,
    status ENUM('open', 'in_progress', 'on-hold', 'closed', 'cancelled') DEFAULT 'open', -- T049: in_progress = claimed/actively worked
    priority ENUM('low', 'med', 'high', 'urgent') DEFAULT 'med',
    supplier_name VARCHAR(150) NULL, -- Clean & optional text field for tracking suppliers
    budget_amount DECIMAL(12,2) NULL, -- T053: optional, only when the request has an associated cost
    sla_deadline DATETIME NULL,
    is_overdue BOOLEAN DEFAULT FALSE,
    total_hold_time_seconds INT DEFAULT 0,
    request_type_id INT NULL,
    custom_fields JSON NULL, -- {field_key: submitted value}, keyed to request_type_fields.field_key
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (request_type_id) REFERENCES request_types(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- T054: additional departments beyond the primary `tickets.department_id`, for full shared
-- ownership (agents in ANY listed department, including the primary, can fully manage the
-- ticket). The primary department is NOT duplicated in here — "all departments for a ticket" is
-- always `department_id` UNION this table's rows, checked together everywhere isolation matters.
CREATE TABLE ticket_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    department_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ticket_department (ticket_id, department_id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
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

-- T048 (Trackr port): free-form agent-editable ticket tags. MySQL has no native array column
-- (unlike Trackr's Postgres `String[]`), so a join table instead.
CREATE TABLE ticket_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ticket_tag (ticket_id, tag),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- T044 (Trackr port): per-department public FAQ, shown on the public submission form once a
-- department is selected. Separate from knowledge_base (T034), which is agent-only/internal.
CREATE TABLE faq_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    department_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- T046 (Trackr port): comment thread visible to BOTH requester and agent — distinct from
-- internal_notes (T016), which is agent-only. Requester has no account (until T047), so posting
-- as requester happens through the existing email+ticket-id status-lookup guard (T010), not a
-- session — author_name is captured at post time rather than joined from a requester account.
CREATE TABLE ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    author_type ENUM('agent', 'requester') NOT NULL,
    agent_id INT NULL, -- set only when author_type = 'agent'
    author_name VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- T047 (Trackr port): optional requester self-service accounts. Deliberately keyed by email only,
-- no FK to tickets — every ticket already carries requestor_email, so "My Requests" is just
-- `WHERE requestor_email = :account_email`. This means ANY ticket ever submitted under that email
-- (before or after registering) shows up automatically, with no separate linking step needed, and
-- the existing anonymous email+ticket-id lookup (T010) keeps working unchanged either way.
CREATE TABLE requester_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deployment-only SSO groundwork (see sso.php) — empty until deployment populates it. Inert while
-- SSO_ENABLED (config.php) is false, which is the default; only meaningful once a real IdP
-- integration is wired up. A row here plus SSO turned on lets that email use "My Requests"
-- directly with no requester_accounts row of its own (no register/login step).
CREATE TABLE sso_allowed_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
