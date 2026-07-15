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
php artisan optimize
php artisan view:cache
php artisan event:cache
php artisan storage:link || true
php artisan queue:restart

# 8. Bring application back up
echo -e "\033[33mBringing application out of maintenance mode...\033[0m"
php artisan up

echo -e "\033[32mDeployment completed successfully!\033[0m"
