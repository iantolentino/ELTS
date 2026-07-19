# Modular Ticketing System (MTS)

## Executive Summary
MTS is a high-performance, enterprise-grade ticketing platform built for multi-department organizations. It utilizes a **Centralized Controller** architecture, ensuring that a single engine handles routing and strictly enforces data isolation between departments. Optimized specifically for Cloud and cPanel environments, MTS pairs a lightweight, lightning-fast PHP backend with advanced security, built-in caching, and a modern Shadcn UI front-end interface.

## Technical Stack
*   **Backend:** PHP 8.x (Strictly PDO / Prepared Statements)
*   **Database:** MySQL 8.0+ (Optimized with compound indexes and a native cache layer)
*   **Frontend:** Vite-bundled Shadcn UI
*   **Deployment Target:** cPanel / Cloud Web Servers (LAMP/LEMP Stack)

---

## Core Feature Architecture

### 1. Advanced Routing & Multi-Tenant Control
*   **Centralized Controller:** A single `index.php` root file handles all incoming requests. Clean URLs mask the engine logic (e.g., `/it/` instead of `index.php?dept=it`).
*   **Strict Department Isolation:** Agents are hard-scoped to their assigned department IDs. They cannot see or modify tickets belonging to other departments.

### 2. High-Performance Optimization (Database & Server)
*   **Targeted Pagination:** All dashboards cap data loads to the first **25 tickets** per page using SQL `LIMIT` and `OFFSET`. This keeps memory allocation ultra-low.
*   **Native Query Caching:** A server-side `system_cache` table caches heavy statistics (e.g., aggregate SLA counts, dashboard overview tallies) for 60 seconds, reducing real-time database stress by up to 80%.
*   **Compound Indexing:** Structural indexes ensure search queries run in milliseconds rather than triggering expensive full table scans.

### 3. Super Admin Utilities
*   **"View As" Mode:** Super Admins can securely view any agent's dashboard exactly as they see it to diagnose operational issues, without needing their passwords.
*   **Feature-Flag Command Center:** Turn specific features (e.g., Maintenance Mode, explicit file extensions) on or off globally using simple settings inside `config.php`.
*   **Destructive Safety Modals:** Critical data actions (e.g., Archiving old tickets) are hidden behind confirmation workflows to completely eliminate accidental clicks.

### 4. Spam & Incident Resilience
*   **Context-Aware "Burst" Limiter:** Legitimate power users (e.g., Installation/Repair techs) can submit up to 10 tickets within a 5-minute window.
*   **Escalating Cooldown System:** If the 10-ticket limit is breached, the system drops into an escalating lockout loop (30 minutes -> 1 hour -> 24 hours) to neutralize automation bots.
*   **Service Status Hub:** Public-facing status alert banner to inform requestors of known outages or systems performance updates *before* they create a ticket.

### 5. Accountability & Workflow
*   **Immutable Audit Logging:** Every reassignment, status transition, or note edit is tracked back to a specific user ID with previous and new values.
*   **Mandatory Resolution Summary:** Agents cannot close or resolve a ticket without inputting a closing summary, which is injected directly into report exports and client emails.
*   **Supplier & Asset Linking:** Simplified tracking field allows agents to optionally link tickets to a specific supplier name for rapid vendor cross-referencing.

---

## URL Path Reference
*   **Public Requestor Portal:** `/{domain}/`
*   **Super Admin Dashboard:** `/{domain}/admin/`
*   **Agent Department Portal:** `/{domain}/{dept-slug}/`
*   **Detailed Ticket View:** `/{domain}/{dept-slug}/ticket/{id}`

---

## Quick-Start Deployment (cPanel / Cloud)

### Step 1: Configuration
Update the `config.php` file in your root folder with your database credentials. Set global variables like `MAINTENANCE_MODE = false` or your default allowed file upload arrays (`['png', 'pdf', 'xlsx']`).

### Step 2: Database Setup
1. Open your cPanel and log into **phpMyAdmin**.
2. Create an empty database.
3. Select the database, click **Import**, choose the provided `database.sql` file, and execute.

### Step 3: Connection & Migration Check
Navigate to `yourdomain.com/private/migration-command.php` in your browser. This script securely verifies database table readability and structure integrity, confirming your environment is fully functional.

### Step 4: Server Caching & Compression Optimization
Ensure that the provided `.htaccess` file is active in your root folder. It forces clean URL handling, prevents directory browsing, blocks unauthorized access to the `/private` directory, and applies Gzip `DEFLATE` compression to dramatically increase page load speeds.
