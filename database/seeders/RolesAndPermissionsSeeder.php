<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->createPermissions();
        $this->createRoles();
    }

    private function createPermissions(): void
    {
        $permissions = [
            // Tickets
            'tickets.view_all',
            'tickets.view_own',
            'tickets.create',
            'tickets.edit',
            'tickets.delete',
            'tickets.reply',
            'tickets.note',
            'tickets.assign',
            'tickets.change_status',
            'tickets.change_priority',
            'tickets.merge',
            'tickets.bulk_action',
            'tickets.watch',

            // Users
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.impersonate',

            // Teams
            'teams.view',
            'teams.create',
            'teams.edit',
            'teams.delete',

            // Departments
            'departments.view',
            'departments.create',
            'departments.edit',
            'departments.delete',

            // SLA
            'sla.view',
            'sla.manage',
            'sla.business_hours',
            'sla.holidays',

            // Automation
            'automation.view',
            'automation.manage',

            // Reports
            'reports.view',
            'reports.export',
            'reports.schedule',

            // Knowledge Base
            'kb.view',
            'kb.create',
            'kb.edit',
            'kb.delete',
            'kb.publish',

            // Assets
            'assets.view',
            'assets.create',
            'assets.edit',
            'assets.delete',
            'assets.assign',

            // Audit Logs
            'audit.view',
            'audit.export',

            // Settings
            'settings.general',
            'settings.email',
            'settings.security',
            'settings.branding',
            'settings.mailboxes',
            'settings.retention',

            // Canned Responses
            'canned_responses.view',
            'canned_responses.create_personal',
            'canned_responses.manage_global',

            // Notifications
            'notifications.view',
            'notifications.manage_preferences',

            // API & Webhooks
            'api.manage_keys',
            'api.manage_webhooks',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }

    private function createRoles(): void
    {
        // super_admin — unrestricted access to everything including impersonation
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        $superAdmin->syncPermissions(Permission::all());

        // admin — full operational access (same as super_admin; service layer prevents
        // impersonating higher roles rather than stripping the permission itself)
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions(Permission::all());

        // supervisor — oversees agents, views all tickets/reports, manages KB
        $supervisor = Role::firstOrCreate(['name' => 'supervisor']);
        $supervisor->syncPermissions([
            'tickets.view_all',
            'tickets.edit',
            'tickets.reply',
            'tickets.note',
            'tickets.assign',
            'tickets.change_status',
            'tickets.change_priority',
            'tickets.merge',
            'tickets.bulk_action',
            'tickets.watch',
            'users.view',
            'teams.view',
            'departments.view',
            'sla.view',
            'reports.view',
            'reports.export',
            'reports.schedule',
            'kb.view',
            'kb.create',
            'kb.edit',
            'kb.publish',
            'assets.view',
            'assets.assign',
            'audit.view',
            'canned_responses.view',
            'canned_responses.create_personal',
            'canned_responses.manage_global',
            'notifications.view',
            'notifications.manage_preferences',
            'api.manage_keys',
        ]);

        // agent — handles tickets, uses KB and canned responses
        $agent = Role::firstOrCreate(['name' => 'agent']);
        $agent->syncPermissions([
            'tickets.view_all',
            'tickets.create',
            'tickets.reply',
            'tickets.note',
            'tickets.change_status',
            'tickets.change_priority',
            'tickets.bulk_action',
            'tickets.watch',
            'kb.view',
            'assets.view',
            'canned_responses.view',
            'canned_responses.create_personal',
            'notifications.view',
            'notifications.manage_preferences',
            'api.manage_keys',
        ]);

        // client — self-service portal access only
        $client = Role::firstOrCreate(['name' => 'client']);
        $client->syncPermissions([
            'tickets.view_own',
            'tickets.create',
            'tickets.reply',
            'tickets.watch',
            'kb.view',
            'notifications.view',
            'notifications.manage_preferences',
        ]);
    }
}
