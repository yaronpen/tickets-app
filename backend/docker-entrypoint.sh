#!/bin/bash
set -e

echo "⏳  Waiting for SQL Server to be ready..."
until /opt/mssql-tools18/bin/sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USERNAME" -P "$DB_PASSWORD" -Q "SELECT 1" -No &>/dev/null; do
  sleep 2
done
echo "✅  SQL Server is up."

# Create database if it doesn't exist
/opt/mssql-tools18/bin/sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USERNAME" -P "$DB_PASSWORD" -No \
  -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$DB_DATABASE') CREATE DATABASE [$DB_DATABASE]"

echo "🔑  Generating application key..."
php artisan key:generate --force

echo "🗄️  Running migrations..."
php artisan migrate --force

echo "🌱  Running seeders..."
php artisan db:seed --force

echo "⏰  Starting scheduler in background..."
(while true; do php artisan schedule:run --no-interaction; sleep 60; done) &

echo "🚀  Starting Laravel development server on port 8000..."
exec php artisan serve --host=0.0.0.0 --port=8000
