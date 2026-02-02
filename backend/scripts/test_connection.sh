#!/bin/bash
# Quick database connection test script

echo "🔍 Testing SQL Server Connection..."
echo ""

cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your database credentials"
    exit 1
fi

# Run the test
python -m app.tests.test_db_connection

echo ""
echo "Done!"
