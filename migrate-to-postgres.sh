#!/bin/bash

echo "🔄 This script is for PostgreSQL migration only!"
echo "⚠️  You are currently using SQLite. This script will not work with SQLite."
echo "💡 To set up SQLite, use the setup-sqlite.sh script or run npm run db:setup-sqlite"
echo ""
echo "If you want to switch to PostgreSQL:"
echo "1. Update prisma/schema.prisma to use postgresql provider"
echo "2. Update .env with DATABASE_URL"
echo "3. Run this script"
echo ""
echo "For SQLite setup, run: ./setup-sqlite.sh"
exit 0