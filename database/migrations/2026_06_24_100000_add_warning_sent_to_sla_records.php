<?php
declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sla_records', function (Blueprint $table) {
            $table->boolean('first_response_warning_sent')->default(false)->after('first_response_breached');
            $table->boolean('resolution_warning_sent')->default(false)->after('resolution_breached');
        });
    }

    public function down(): void
    {
        Schema::table('sla_records', function (Blueprint $table) {
            $table->dropColumn(['first_response_warning_sent', 'resolution_warning_sent']);
        });
    }
};
