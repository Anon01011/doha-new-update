# deploy.ps1
# Deploy script for Earth Doha (Laravel + Inertia) on Windows

Write-Host "Starting deployment..." -ForegroundColor Green

# 1. Check for required tools
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "Git is not installed."; exit 1 }
if (-not (Get-Command composer -ErrorAction SilentlyContinue)) { Write-Error "Composer is not installed."; exit 1 }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Write-Error "NPM is not installed."; exit 1 }
if (-not (Get-Command php -ErrorAction SilentlyContinue)) { Write-Error "PHP is not installed."; exit 1 }

# 2. Put application in maintenance mode
Write-Host "Putting application in maintenance mode..." -ForegroundColor Yellow
php artisan down --refresh

# 3. Pull latest changes
Write-Host "Pulling latest changes from git..." -ForegroundColor Yellow
git pull origin main

# 4. Install PHP dependencies
Write-Host "Installing PHP dependencies..." -ForegroundColor Yellow
composer install --no-dev --optimize-autoloader

# 5. Install Node dependencies and Build Assets
Write-Host "Installing Node dependencies..." -ForegroundColor Yellow
npm install
Write-Host "Building frontend assets..." -ForegroundColor Yellow
npm run build

# 6. Run Migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
php artisan migrate --force

# 7. Clear and Cache Config/Routes/Views
Write-Host "Optimizing application..." -ForegroundColor Yellow
php artisan optimize
php artisan view:cache
php artisan event:cache
try { php artisan storage:link } catch {}
php artisan queue:restart

# 8. Bring application back up
Write-Host "Bringing application out of maintenance mode..." -ForegroundColor Yellow
php artisan up

Write-Host "Deployment completed successfully!" -ForegroundColor Green
