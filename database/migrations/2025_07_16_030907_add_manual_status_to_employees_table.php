<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('employees', 'manual_status')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('manual_status')->nullable()->after('employee_image');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('employees', 'manual_status')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('manual_status');
            });
        }
    }
};
