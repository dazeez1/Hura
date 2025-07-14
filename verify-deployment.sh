#!/bin/bash

echo "🔍 Verifying deployment..."

# Check if URLs were replaced
echo "Checking for remaining localhost URLs..."

# Find any remaining localhost URLs
remaining_urls=$(grep -r "localhost:4000" frontend/src/js/ 2>/dev/null || true)
remaining_urls+=$(grep -r "localhost:3000" frontend/src/js/ 2>/dev/null || true)
remaining_urls+=$(grep -r "localhost:5500" frontend/src/js/ 2>/dev/null || true)

if [ -z "$remaining_urls" ]; then
    echo "✅ No localhost URLs found in frontend files"
else
    echo "⚠️  Found remaining localhost URLs:"
    echo "$remaining_urls"
fi

# Check if backup was created
if [ -d "../Hura-backup-"* ]; then
    echo "✅ Backup directory exists"
else
    echo "⚠️  No backup directory found"
fi

# Check if production env file exists
if [ -f "backend/.env.production" ]; then
    echo "✅ Production environment file created"
else
    echo "⚠️  Production environment file not found"
fi

echo ""
echo "🎉 Verification complete!"
