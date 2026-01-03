#!/bin/bash

# Script to completely reset the database and start fresh

echo "🔄 Resetting database..."

# Step 1: Drop and recreate database (using Prisma)
echo "📦 Dropping database..."
npx prisma migrate reset --force --skip-seed 2>/dev/null || echo "Migration reset failed, continuing..."

# Step 2: Remove problematic migrations (need sudo for root-owned files)
echo "🧹 Cleaning up migrations..."
sudo rm -rf prisma/migrations/20251221200000_add_auth_fields
sudo rm -rf prisma/migrations/20251225054803_new_migration  
sudo rm -rf prisma/migrations/20251225120132_*
sudo rm -rf prisma/migrations/20251221202000_residenthub_auth_update

# Keep only the initial migration
echo "✅ Keeping initial migration: 20251209134416_init"

# Step 3: Create fresh migration
echo "📝 Creating fresh migration..."
npx prisma migrate dev --name initial_residenthub_auth

# Step 4: Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run db:generate

echo "✅ Database reset complete!"
echo "🚀 You can now start your application with: npm run start:dev"

