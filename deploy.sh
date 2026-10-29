#!/bin/bash
# deploy.sh
# Deploy script for Earth Doha (Laravel + Inertia) on Linux

set -e # Exit immediately if a command exits with a non-zero status.

echo -e "\033[32mStarting deployment...\033[0m"

# 1. Check for required tools
command -v git >/dev/null 2>&1 || { echo >&2 "Git is required but it's not installed. Aborting."; exit 1; }
command -v composer >/dev/null 2>&1 || { echo >&2 "Composer is required but it's not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "NPM is required but it's not installed. Aborting."; exit 1; }
command -v php >/dev/null 2>&1 || { echo >&2 "PHP is required but it's not installed. Aborting."; exit 1; }

# 2. Put application in maintenance mode
echo -e "\033[33mPutting application in maintenance mode...\033[0m"
php artisan down --refresh

# 3. Pull latest changes
echo -e "\033[33mPulling latest changes from git...\033[0m"
git pull origin main

# 4. Install PHP dependencies
echo -e "\033[33mInstalling PHP dependencies...\033[0m"
composer install --no-dev --optimize-autoloader

# 5. Install Node dependencies and Build Assets
echo -e "\033[33mInstalling Node dependencies...\033[0m"
npm install
echo -e "\033[33mBuilding frontend assets...\033[0m"
npm run build

# 6. Run Migrations
echo -e "\033[33mRunning database migrations...\033[0m"
php artisan migrate --force

# 7. Clear and Cache Config/Routes/Views
echo -e "\033[33mOptimizing application...\033[0m"
php artisan view:clear
php artisan optimize:clear
php artisan optimize
php artisan view:cache
    # SECURITY FIX (CRIT-04): do NOT run `php artisan storage:link`.
    #
    # The link (public/storage -> storage/app/public) makes Apache/nginx serve
    # every file under storage/app/public as a STATIC file. The request then
    # never reaches Laravel, so the session check, the extension allowlist and
    # the tenant isolation enforced by the `storage.fallback` route are all
    # bypassed, and confidential HR documents (passport, QID, Aadhaar, PAN,
    # bank details, medical certificates) and expense receipts become readable
    # to anyone who can name a file.
    #
    # This was confirmed locally: with the link present an anonymous visitor
    # received HTTP 200 and the full body of an employee photo, and removing
    # the link immediately restored the 403.
    #
    # Instead the link is actively REMOVED, so an existing server that was
    # deployed with the old script is closed as soon as it is redeployed. All
    # files are served exclusively through the hardened `storage.fallback`
    # route, which enforces the session check and the tenant check in PHP.
rm -rf public/storage
mkdir -p public/storage

# Fix ownership and permissions for Nginx/Apache web user (www for aaPanel/BT, www-data for Ubuntu/Nginx)
chown -R www:www storage bootstrap/cache 2>/dev/null || chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# 8. Ensure Queue Worker & Scheduled Jobs are Active on Production
echo -e "\033[33mConfiguring and verifying background jobs...\033[0m"

# 8.1 Restart existing queue workers so they pick up new code
php artisan queue:restart || true

# 8.2 Verify and ensure queue worker is running
WORKER_RUNNING=false
if command -v supervisorctl >/dev/null 2>&1; then
    if supervisorctl status 2>/dev/null | grep -iqE "worker|queue"; then
        echo -e "\033[32mSupervisor detected with worker configuration. Restarting supervisor processes...\033[0m"
        supervisorctl reread 2>/dev/null || true
        supervisorctl update 2>/dev/null || true
        supervisorctl restart all 2>/dev/null || true
        WORKER_RUNNING=true
    fi
fi

if [ "$WORKER_RUNNING" = false ] && command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet laravel-worker 2>/dev/null || systemctl is-active --quiet doha-worker 2>/dev/null; then
        echo -e "\033[32mSystemd worker service active. Restarting...\033[0m"
        systemctl restart laravel-worker 2>/dev/null || systemctl restart doha-worker 2>/dev/null || true
        WORKER_RUNNING=true
    fi
fi

# 8.3 If no supervisor or systemd worker is active, ensure a background daemon is running
if [ "$WORKER_RUNNING" = false ]; then
    if ! pgrep -f "artisan queue:work" >/dev/null 2>&1; then
        echo -e "\033[33mQueue worker not running! Starting background worker process...\033[0m"
        nohup php artisan queue:work --sleep=3 --tries=3 --max-time=3600 > storage/logs/worker.log 2>&1 &
        sleep 1
        if pgrep -f "artisan queue:work" >/dev/null 2>&1; then
            echo -e "\033[32mBackground queue worker auto-started successfully (PID: $(pgrep -f "artisan queue:work" | tr '\n' ' ')).\033[0m"
        else
            echo -e "\033[31mWarning: Could not start background queue worker automatically. Check storage/logs/worker.log\033[0m"
        fi
    else
        echo -e "\033[32mQueue worker is already active (PID: $(pgrep -f "artisan queue:work" | tr '\n' ' ')).\033[0m"
    fi
fi

# 8.4 Ensure Laravel cron scheduler is registered in Crontab
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_JOB="* * * * * cd $APP_DIR && php artisan schedule:run >> /dev/null 2>&1"
if command -v crontab >/dev/null 2>&1; then
    if ! crontab -l 2>/dev/null | grep -q "artisan schedule:run"; then
        echo -e "\033[33mScheduler cron missing from crontab. Auto-installing cron job...\033[0m"
        (crontab -l 2>/dev/null || true; echo "$CRON_JOB") | crontab -
        echo -e "\033[32mArtisan schedule:run cron registered successfully.\033[0m"
    else
        echo -e "\033[32mArtisan schedule:run cron already active in crontab.\033[0m"
    fi
fi

# 9. Bring application back up
echo -e "\033[33mBringing application out of maintenance mode...\033[0m"
php artisan up

echo -e "\033[32mDeployment completed successfully!\033[0m"
