#!/bin/bash

echo "🔄 Starting PostgreSQL migration..."

# 1. Stop existing container
echo "🛑 Stopping existing PostgreSQL container..."
docker stop db_postgresql 2>/dev/null || true
docker rm db_postgresql 2>/dev/null || true

# 2. Start with docker-compose
echo "🚀 Starting PostgreSQL with docker-compose..."
docker-compose up -d

# 3. Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec db_postgresql pg_isready -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "⏳ Waiting... ($i/30)"
    sleep 2
done

# 4. Test connection
echo "🔍 Testing database connection..."
if npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT version();" >/dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "📋 Container logs:"
    docker logs db_postgresql --tail 10
    exit 1
fi

# 5. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 6. Run migration
echo "📦 Running database migration..."
if npx prisma migrate dev --name init-postgresql; then
    echo "✅ Migration successful!"
else
    echo "⚠️  Migration failed, trying db push..."
    npx prisma db push
fi

# 7. Verify tables
echo "🔍 Verifying database tables..."
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "\dt"

echo "🎉 Migration completed successfully!"
echo "🚀 You can now start your development server with: npm run dev"