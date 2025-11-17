#!/bin/bash

echo "🔄 Setting up SQLite database..."

# 1. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 2. Run migration
echo "📦 Running database migration..."
if npx prisma migrate dev --name init-sqlite; then
    echo "✅ Migration successful!"
else
    echo "⚠️  Migration failed, trying db push..."
    npx prisma db push
fi

# 3. Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo "🎉 SQLite setup completed successfully!"
echo "🚀 You can now start your development server with: npm run dev"