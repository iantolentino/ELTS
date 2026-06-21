<?php

return [

    /*
     * If set to false, no activities will be saved to the database.
     */
    'enabled' => env('ACTIVITY_LOGGER_ENABLED', true),

    /*
     * When the clean-command is executed, all recording activities older than
     * the number of days specified here will be deleted.
     * This is the default — admins can override via system settings.
     */
    'delete_records_older_than_days' => env('ACTIVITY_LOGGER_RETENTION_DAYS', 365),

    /*
     * Default log name used when no log name is passed to activity().
     */
    'default_log_name' => 'system',

    /*
     * Auth driver for resolving the causer (user who triggered the activity).
     * Null = use Laravel's default auth driver.
     */
    'default_auth_driver' => null,

    /*
     * If set to true, the subject returns soft deleted models.
     */
    'subject_returns_soft_deleted_models' => true,

    /*
     * The model used to log activity.
     */
    'activity_model' => \Spatie\Activitylog\Models\Activity::class,

    /*
     * The table name used by the Activity model.
     */
    'table_name' => env('ACTIVITY_LOGGER_TABLE_NAME', 'activity_log'),

    /*
     * Database connection for activity log. Null = use default connection.
     */
    'database_connection' => env('ACTIVITY_LOGGER_DB_CONNECTION'),
];
