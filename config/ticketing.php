<?php

/*
|--------------------------------------------------------------------------
| ELTS — Application-wide Defaults
|--------------------------------------------------------------------------
| These values are the fallback defaults used when no admin-configured
| setting exists in the database (settings table, Phase 14).
|
| Every value that can be changed via Settings UI has a corresponding
| env() fallback so deployments can pre-configure without a DB row.
*/

return [

    /*
    |--------------------------------------------------------------------------
    | Ticket Defaults
    |--------------------------------------------------------------------------
    */
    'tickets' => [
        // Default priority assigned to new tickets when not specified
        'default_priority' => env('TICKET_DEFAULT_PRIORITY', 'medium'),

        // Prefix and zero-padding for human-readable ticket numbers (e.g. TKT-00042)
        'number_prefix'    => env('TICKET_NUMBER_PREFIX', 'TKT'),
        'number_padding'   => (int) env('TICKET_NUMBER_PADDING', 5),

        // Resolved tickets are auto-closed after this many days of inactivity
        'auto_close_days'  => (int) env('TICKET_AUTO_CLOSE_DAYS', 7),

        // Maximum file attachment size in megabytes
        'max_attachment_mb' => (int) env('TICKET_MAX_ATTACHMENT_MB', 10),

        // Allowed attachment MIME types
        'allowed_mime_types' => [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv',
            'application/zip',
        ],

        // How many tickets to show per page in list views
        'per_page' => (int) env('TICKET_PER_PAGE', 25),
    ],

    /*
    |--------------------------------------------------------------------------
    | SLA Defaults (hours)
    |--------------------------------------------------------------------------
    | Used when no SLA policy is explicitly assigned to a ticket.
    | Phase 4 SLA policies override these per priority/tier.
    */
    'sla' => [
        'first_response' => [
            'critical' => (int) env('SLA_RESPONSE_CRITICAL', 1),
            'high'     => (int) env('SLA_RESPONSE_HIGH',     4),
            'medium'   => (int) env('SLA_RESPONSE_MEDIUM',  8),
            'low'      => (int) env('SLA_RESPONSE_LOW',     24),
        ],
        'resolution' => [
            'critical' => (int) env('SLA_RESOLUTION_CRITICAL', 4),
            'high'     => (int) env('SLA_RESOLUTION_HIGH',     24),
            'medium'   => (int) env('SLA_RESOLUTION_MEDIUM',  72),
            'low'      => (int) env('SLA_RESOLUTION_LOW',    168),
        ],
        // Percentage of SLA time elapsed before a "warning" state is shown
        'warning_threshold_percent' => (int) env('SLA_WARNING_THRESHOLD', 75),
    ],

    /*
    |--------------------------------------------------------------------------
    | Email / Mailbox Defaults
    |--------------------------------------------------------------------------
    */
    'email' => [
        // How many emails to process per poll cycle (prevents memory spikes)
        'max_per_poll'   => (int) env('EMAIL_MAX_PER_POLL', 50),

        // Patterns used to strip quoted reply content from incoming emails
        'reply_patterns' => [
            '/On .+ wrote:/i',
            '/-----Original Message-----/',
            '/_{10,}/',
        ],

        // Days to retain processed incoming email records
        'incoming_retention_days' => (int) env('EMAIL_INCOMING_RETENTION_DAYS', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | CSAT / NPS Defaults
    |--------------------------------------------------------------------------
    */
    'satisfaction' => [
        // Hours to wait after ticket resolution before sending CSAT survey
        'csat_delay_hours' => (int) env('CSAT_DELAY_HOURS', 1),

        // Days between NPS surveys sent to the same client
        'nps_frequency_days' => (int) env('NPS_FREQUENCY_DAYS', 90),

        // Days before a survey token expires (clicks the link after this = expired)
        'survey_token_expiry_days' => (int) env('SURVEY_TOKEN_EXPIRY_DAYS', 7),
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Defaults
    |--------------------------------------------------------------------------
    */
    'security' => [
        // Roles that are required to have 2FA enabled (enforced at login)
        'require_2fa_roles' => explode(',', env('REQUIRE_2FA_ROLES', 'super_admin')),

        // Maximum failed login attempts before account is temporarily locked
        'max_login_attempts' => (int) env('MAX_LOGIN_ATTEMPTS', 5),

        // Lockout duration in minutes after max attempts exceeded
        'lockout_minutes' => (int) env('LOCKOUT_MINUTES', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Client Portal Defaults
    |--------------------------------------------------------------------------
    */
    'portal' => [
        // Allow new clients to self-register (false = invite-only)
        'registration_enabled' => (bool) env('PORTAL_REGISTRATION_ENABLED', true),

        // Require email verification on registration
        'email_verification' => (bool) env('PORTAL_EMAIL_VERIFICATION', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Knowledge Base Defaults
    |--------------------------------------------------------------------------
    */
    'kb' => [
        // Number of suggested articles shown on the new ticket form
        'suggestion_limit' => (int) env('KB_SUGGESTION_LIMIT', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination Defaults
    |--------------------------------------------------------------------------
    */
    'pagination' => [
        'default'  => (int) env('PAGINATION_DEFAULT', 25),
        'audit'    => (int) env('PAGINATION_AUDIT',   50),
        'reports'  => (int) env('PAGINATION_REPORTS', 100),
    ],

];
