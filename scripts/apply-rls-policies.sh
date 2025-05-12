#!/bin/bash

# Script to apply RLS policies to the database
# This is intended to be run once after initial database setup

# Exit on error
set -e

echo "Applying Row-Level Security policies..."

# Get the database connection string from environment variable
# You can also pass this as an argument to the script
DB_URL=${1:-$DATABASE_URL}

if [ -z "$DB_URL" ]; then
  echo "Error: No database URL provided"
  echo "Usage: ./apply-rls-policies.sh [DATABASE_URL]"
  echo "Alternatively, set the DATABASE_URL environment variable"
  echo ""
  echo "The DATABASE_URL should be in the format:"
  echo "postgresql://username:password@host:port/database"
  echo ""
  echo "If your password contains special characters like @, use the following format instead:"
  echo "PGPASSWORD=your_password psql -h hostname -p port -U username -d database"
  exit 1
fi

# Path to the RLS policies SQL file
POLICIES_FILE="$(dirname "$(dirname "$0")")/apps/www/prisma/migrations/rls_policies.sql"

# Check if the file exists
if [ ! -f "$POLICIES_FILE" ]; then
  echo "Error: RLS policies file not found at $POLICIES_FILE"
  exit 1
fi

# Extract connection details if it's a standard PostgreSQL URL
if echo "$DB_URL" | grep -q "^postgresql://"; then
  # Try to connect with the URL directly first
  echo "Testing database connection..."
  if psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "Connection successful, applying policies..."
    psql "$DB_URL" -f "$POLICIES_FILE"
  else
    # If connection fails, it might be due to special characters in password
    echo "Could not connect with the provided URL. It may contain special characters."
    echo "Attempting to parse connection details..."
    
    # Extract components from the URL
    DB_USER=$(echo "$DB_URL" | sed -n 's/^postgresql:\/\/\([^:]*\):.*/\1/p')
    DB_HOST=$(echo "$DB_URL" | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DB_URL" | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:\([^/]*\).*/\1/p')
    DB_NAME=$(echo "$DB_URL" | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:[^/]*\/\(.*\)$/\1/p')
    
    # Check if we extracted all parts correctly
    if [ -z "$DB_USER" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
      echo "Error: Could not parse the database URL correctly."
      echo ""
      echo "For passwords with special characters, use individual parameters:"
      echo ""
      echo "Usage for passwords with special characters:"
      echo "./apply-rls-policies.sh \"host=localhost port=5432 user=postgres password=your@password dbname=dabao\""
      exit 1
    fi
    
    # Ask for password interactively
    echo "Please enter the database password for user $DB_USER:"
    read -s DB_PASS
    
    # Try connecting with individual parameters
    export PGPASSWORD="$DB_PASS"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
      echo "Connection successful, applying policies..."
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$POLICIES_FILE"
    else
      echo "Error: Could not connect to the database with the provided credentials."
      exit 1
    fi
  fi
# Alternative format: connection string with parameters
else
  echo "Using connection string parameters..."
  psql "$DB_URL" -f "$POLICIES_FILE"
fi

echo "Row-Level Security policies applied successfully!"
echo ""
echo "Next steps:"
echo "1. Make sure your authentication system adds the necessary claims to JWTs:"
echo "   - sub: User ID"
echo "   - org_id: Current organization ID"
echo "   - project_id: Current project ID"
echo ""
echo "2. When switching projects/organizations, update the JWT with new claims"
echo ""
echo "3. For service-to-service communication, use service role tokens"