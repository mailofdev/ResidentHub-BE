# PostgreSQL Database Setup Guide

## Step 1: Create Database in pgAdmin

1. **Open pgAdmin** on your machine

2. **Connect to your PostgreSQL server** (if not already connected):
   - Right-click on "Servers" → "Create" → "Server"
   - In the "General" tab, enter a name (e.g., "Local PostgreSQL")
   - In the "Connection" tab:
     - **Host**: `localhost` (or `127.0.0.1`)
     - **Port**: `5432` (default PostgreSQL port)
     - **Maintenance database**: `postgres`
     - **Username**: Your PostgreSQL username (usually `postgres`)
     - **Password**: Your PostgreSQL password
   - Click "Save"

3. **Create a new database**:
   - Expand your server connection
   - Right-click on "Databases" → "Create" → "Database"
   - **Database name**: `residenthub` (or any name you prefer)
   - **Owner**: Leave as default (usually `postgres`)
   - Click "Save"

## Step 2: Get Your Connection Details

After creating the database, note down:
- **Host**: Usually `localhost` or `127.0.0.1`
- **Port**: Usually `5432`
- **Database name**: `residenthub` (or what you named it)
- **Username**: Your PostgreSQL username
- **Password**: Your PostgreSQL password

## Step 3: Create .env File

Create a `.env` file in the project root with the following format:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"
```

**Example:**
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/residenthub?schema=public"
```

Replace:
- `USERNAME` with your PostgreSQL username
- `PASSWORD` with your PostgreSQL password
- `HOST` with `localhost` (or your host)
- `PORT` with `5432` (or your port)
- `DATABASE_NAME` with `residenthub` (or your database name)

## Step 4: Run Prisma Commands

After creating the `.env` file, run these commands:

```bash
# Generate Prisma Client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

## Troubleshooting

### Connection Error?
- Make sure PostgreSQL is running
- Check if the port is correct (default is 5432)
- Verify username and password are correct
- Ensure the database exists

### Permission Error?
- Make sure your PostgreSQL user has permission to create tables
- You might need to grant privileges in pgAdmin

### Can't find pgAdmin?
- On macOS: Usually in Applications or use Spotlight search
- On Windows: Check Start Menu or installed programs
- On Linux: Check your application menu

