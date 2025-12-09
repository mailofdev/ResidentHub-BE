# Quick Start Guide - Database Connection

## ✅ What's Already Done

1. ✅ Prisma schema created with User model
2. ✅ Prisma service and module configured
3. ✅ Database connection code integrated into the app
4. ✅ `.env` file template created
5. ✅ Database setup scripts added

## 🚀 Next Steps

### Step 1: Update `.env` File

Open `.env` file and replace `YOUR_PASSWORD` with your actual PostgreSQL password:

```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/residenthub?schema=public"
```

**If your PostgreSQL username is different from `postgres`, update that too.**

### Step 2: Install Dependencies (if not done)

```bash
npm install
```

**Note:** If you get permission errors, run:
```bash
sudo chown -R 501:20 "/Users/apple/.npm"
```

### Step 3: Generate Prisma Client & Run Migrations

```bash
# Option 1: Use the setup script (recommended)
npm run db:setup

# Option 2: Manual steps
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Create database tables
```

### Step 4: Test Database Connection

```bash
npm run db:test
```

This will verify that:
- ✅ Database connection works
- ✅ Tables are created correctly
- ✅ Prisma Client is working

### Step 5: Start the Application

```bash
npm run start:dev
```

The server will start on `http://localhost:4001`
Swagger docs: `http://localhost:4001/api`

## 📋 Available Database Commands

```bash
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio (database GUI)
npm run db:test        # Test database connection
npm run db:setup       # Complete setup (generate + migrate)
```

## 🔍 Verify Database Connection

After setup, you can verify in pgAdmin:
1. Open pgAdmin
2. Connect to your server
3. Expand `residenthub` database
4. Expand `Schemas` → `public` → `Tables`
5. You should see a `users` table

## 🐛 Troubleshooting

### Connection Error?
- Check if PostgreSQL is running
- Verify username and password in `.env`
- Ensure database `residenthub` exists in pgAdmin
- Check if port 5432 is correct

### Migration Error?
- Make sure database exists
- Check DATABASE_URL format in `.env`
- Ensure user has CREATE TABLE permissions

### Still having issues?
Run the test script to see detailed error messages:
```bash
npm run db:test
```

