<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $isNew = !file_exists(DB_PATH);
    $pdo = new PDO('sqlite:' . DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');

    $pdo->exec("CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        next_number INTEGER NOT NULL DEFAULT 1
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        department_id INTEGER
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number TEXT NOT NULL UNIQUE,
        department_id INTEGER NOT NULL,
        requester_name TEXT NOT NULL,
        requester_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        submitted_at TEXT NOT NULL,
        accepted_at TEXT,
        accepted_by TEXT,
        finished_at TEXT
    )");

    if ($isNew) {
        seedDatabase($pdo);
    }

    return $pdo;
}

function seedDatabase(PDO $pdo): void
{
    $pdo->beginTransaction();

    $deptStmt = $pdo->prepare('INSERT INTO departments (name, code, next_number) VALUES (?, ?, ?)');
    $deptStmt->execute(['IT', 'IT', 232]);
    $itId = (int) $pdo->lastInsertId();
    $deptStmt->execute(['HR', 'HR', 89]);
    $hrId = (int) $pdo->lastInsertId();
    $deptStmt->execute(['Finance', 'FIN', 15]);
    $finId = (int) $pdo->lastInsertId();
    $deptStmt->execute(['Facilities', 'FAC', 3]);
    $facId = (int) $pdo->lastInsertId();

    $adminStmt = $pdo->prepare(
        'INSERT INTO admins (name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?)'
    );
    $adminStmt->execute(['Super Admin', 'superadmin@company.com', password_hash('super123', PASSWORD_DEFAULT), 'super', null]);
    $adminStmt->execute(['IT Admin', 'itadmin@company.com', password_hash('itadmin123', PASSWORD_DEFAULT), 'dept_admin', $itId]);
    $adminStmt->execute(['HR Admin', 'hradmin@company.com', password_hash('hradmin123', PASSWORD_DEFAULT), 'dept_admin', $hrId]);

    $ticketStmt = $pdo->prepare(
        'INSERT INTO tickets (ticket_number, department_id, requester_name, requester_email, subject, description,
            category, status, rejection_reason, submitted_at, accepted_at, accepted_by, finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $ticketStmt->execute([
        'IT-0231', $itId, 'Maria Santos', 'm.santos@company.com', "Laptop won't power on",
        "After a firmware update, no response even holding the power button for 30 seconds.",
        'Repair', 'pending', null, '2026-07-17 09:12:00', null, null, null,
    ]);
    $ticketStmt->execute([
        'IT-0229', $itId, 'Ramon Cruz', 'r.cruz@company.com', 'Payroll login locked',
        "Can't log in to the payroll portal — the password reset email isn't arriving.",
        'Account', 'ongoing', null, '2026-07-16 14:03:00', '2026-07-16 15:00:00', 'IT Admin', null,
    ]);
    $ticketStmt->execute([
        'IT-0224', $itId, 'Elena Reyes', 'e.reyes@company.com', 'Monitor cable request',
        'HDMI port on current cable is damaged, needs a replacement.',
        'Digital', 'done', null, '2026-07-14 08:40:00', '2026-07-14 09:00:00', 'IT Admin', '2026-07-15 11:20:00',
    ]);
    $ticketStmt->execute([
        'HR-0088', $hrId, 'Anna Lim', 'a.lim@company.com', 'Leave balance incorrect',
        'System shows 3 days remaining, expected 6 based on contract terms.',
        'Leave', 'done', null, '2026-07-16 10:00:00', '2026-07-16 10:30:00', 'HR Admin', '2026-07-17 09:00:00',
    ]);
    $ticketStmt->execute([
        'FIN-0014', $finId, 'Josef Tan', 'j.tan@company.com', 'Reimbursement not received',
        'Approved on Jul 10 but no transfer has posted to the account yet.',
        'Reimbursement', 'ongoing', null, '2026-07-12 09:00:00', '2026-07-13 09:00:00', 'Super Admin', null,
    ]);

    $pdo->commit();
}
