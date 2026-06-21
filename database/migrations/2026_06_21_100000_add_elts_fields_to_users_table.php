<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar')->nullable()->after('phone');
            $table->string('job_title')->nullable()->after('avatar');
            $table->string('timezone', 50)->default('UTC')->after('job_title');
            $table->string('locale', 10)->default('en')->after('timezone');
            $table->enum('availability_status', ['online', 'busy', 'away', 'offline'])
                  ->default('offline')
                  ->after('locale');
            $table->boolean('is_vip')->default(false)->after('availability_status');
            $table->boolean('is_active')->default(true)->after('is_vip');
            $table->string('two_factor_secret')->nullable()->after('is_active');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_secret');
            $table->timestamp('last_login_at')->nullable()->after('two_factor_confirmed_at');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            // FK constraints added in P1-02 once teams/departments tables exist
            $table->unsignedBigInteger('team_id')->nullable()->after('last_login_ip');
            $table->unsignedBigInteger('department_id')->nullable()->after('team_id');

            $table->index('availability_status');
            $table->index('is_active');
            $table->index('team_id');
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['availability_status']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['team_id']);
            $table->dropIndex(['department_id']);

            $table->dropColumn([
                'phone',
                'avatar',
                'job_title',
                'timezone',
                'locale',
                'availability_status',
                'is_vip',
                'is_active',
                'two_factor_secret',
                'two_factor_confirmed_at',
                'last_login_at',
                'last_login_ip',
                'team_id',
                'department_id',
            ]);
        });
    }
};
