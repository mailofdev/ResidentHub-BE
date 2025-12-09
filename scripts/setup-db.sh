#!/bin/bash

# Database Setup Script for ResidentHub
echo "🚀 Setting up ResidentHub Database..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ Error: DATABASE_URL not found in .env file!"
    exit 1
fi

# Check if password placeholder is still there
if grep -q "YOUR_PASSWORD" .env; then
    echo "⚠️  Warning: Please update YOUR_PASSWORD in .env file with your actual PostgreSQL password"
    exit 1
fi

echo "✅ .env file found"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma Client generated successfully"
else
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Failed to run migrations"
    exit 1
fi

echo ""
echo "🎉 Database setup completed!"
echo ""
echo "Next steps:"
echo "1. Start your server: npm run start:dev"
echo "2. Open Prisma Studio: npx prisma studio"
echo "3. Test your API at: http://localhost:4001/api"

