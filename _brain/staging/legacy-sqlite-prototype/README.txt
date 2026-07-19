UNIFIED TICKETING SYSTEM — LOCAL TEST BUILD
=============================================

This is a working prototype: real PHP + a real SQLite database (no
MySQL server needed, no Composer packages). Good for testing the
flow and design before deciding what to carry into ELTS/Laravel.

HOW TO RUN
----------
Option A — PHP's built-in server (fastest):
  1. Open a terminal in this folder.
  2. Run:  php -S localhost:8000
  3. Open http://localhost:8000/ in your browser.

Option B — XAMPP (since you already use it):
  1. Copy this whole folder into htdocs, e.g.
     C:\xampp\htdocs\ticketing-app
  2. Start Apache in the XAMPP control panel.
  3. Open http://localhost/ticketing-app/ in your browser.

The database file (data.sqlite) is created automatically the first
time any page runs, seeded with 4 departments, 3 demo staff logins,
and 5 sample tickets. Delete data.sqlite any time to reset back to
that seed data.

DEMO LOGINS
-----------
Super admin : superadmin@company.com / super123
IT admin    : itadmin@company.com    / itadmin123
HR admin    : hradmin@company.com    / hradmin123

WHAT'S REAL VS. STUBBED
------------------------
Real:      ticket submission, status lookup, accept/reject/finish,
           super admin's full inline edit (every field, including
           Accepted date), adding departments, CSV export, and the
           PDF export (opens a print-friendly page — use your
           browser's "Print > Save as PDF").

Stubbed:   emails aren't actually sent — every notification is
           appended to emails.log in this folder instead, so you
           can see exactly what would have gone out and when.
           Swap notifyEmail() in functions.php for mail() or a real
           SMTP/API call once you're ready to send for real.

FILES
-----
config.php          session + DB path setup
db.php              schema + seed data
functions.php        auth guards, ticket numbering, email stub
style.css            shared design
partials/            shared header/footer (sidebar nav)
index.php            landing page
submit.php            public ticket form
check.php             public status lookup
login.php / logout.php   staff auth
dashboard.php         role-based dashboard (dept admin vs super admin)
ticket_action.php     accept/reject/finish + super admin field updates
department_action.php super-admin-only: add a department
export_csv.php        super-admin-only CSV export
report.php            super-admin-only print/PDF report
