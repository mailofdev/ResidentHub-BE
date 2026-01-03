# ResidentHub Backend API

A comprehensive NestJS-based backend API for managing residential societies. This system handles societies, units, residents, maintenance payments, issues, and announcements with role-based access control.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [Project Structure](#project-structure)
- [API Usage Examples](#api-usage-examples)
- [Database Reset](#database-reset)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

ResidentHub is a backend API system designed for managing residential societies. It provides:

- **Role-based Access Control**: Platform Owner, Society Admin, and Resident roles
- **Society Management**: Create and manage residential societies
- **Unit Management**: Track housing units within societies
- **Resident Management**: Manage owners and tenants
- **Maintenance Tracking**: Track maintenance fees and payments
- **Issue Management**: Handle resident complaints and issues
- **Announcements**: Society-wide communication system
- **Dashboard Analytics**: Role-specific statistics and insights

### Technology Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **npm** (v9.x or higher) - Comes with Node.js
- **PostgreSQL** (v14.x or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Verify Installation

```bash
node --version    # Should be v18.x or higher
npm --version     # Should be v9.x or higher
psql --version    # Should be v14.x or higher
git --version     # Any recent version
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ResidentHub-BE
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env  # If .env.example exists
# OR create .env manually
```

Add the following variables to your `.env` file:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/residenthub?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="24h"

# Server Configuration
PORT=4001
NODE_ENV=development
```

**Important**: 
- Replace `username`, `password`, and `localhost:5432` with your PostgreSQL credentials
- Replace `JWT_SECRET` with a strong, random string (use a secure password generator)
- For production, use strong secrets and environment-specific values

### 4. Set Up Database

#### Option A: Using Setup Script (Recommended)

```bash
npm run db:setup
```

This script will:
- Verify your `.env` file
- Generate Prisma Client
- Run database migrations
- Create all necessary tables

#### Option B: Manual Setup

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 5. Verify Database Connection

```bash
npm run db:test
```

If successful, you should see a confirmation message.

---

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/residenthub` |
| `JWT_SECRET` | Secret key for JWT token signing | `your-secret-key-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port number | `4001` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `JWT_EXPIRATION` | JWT token expiration time | `24h` |

---

## 🗄️ Database Setup

### Initial Setup

1. **Create PostgreSQL Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE residenthub;

# Exit psql
\q
```

2. **Run Migrations**

```bash
npm run db:migrate
```

3. **Generate Prisma Client**

```bash
npm run db:generate
```

### Reset Database

To completely clear and reset the database:

```bash
# Quick reset (drops and recreates database)
npm run db:reset

# Or use the detailed reset script
bash reset-database.sh
```

**⚠️ Warning**: This will delete all data!

For more database operations, see [DATABASE_RESET_GUIDE.md](./DATABASE_RESET_GUIDE.md)

### Database GUI (Prisma Studio)

View and edit your database through a visual interface:

```bash
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555`

---

## ▶️ Running the Project

### Development Mode (with hot reload)

```bash
npm run start:dev
```

The server will start on `http://localhost:4001` (or your configured PORT).

### Production Mode

```bash
# Build the project
npm run build

# Start production server
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

### View Logs

The server logs will show:
- Server start confirmation
- Swagger documentation URL
- Any errors or warnings

---

## 📚 API Documentation

### Swagger UI (Interactive Documentation)

Once the server is running, visit:

```
http://localhost:4001/api
```

This provides:
- Interactive API testing interface
- All endpoint documentation
- Request/response schemas
- Authentication testing

### API Base URL

```
http://localhost:4001
```

All endpoints are prefixed with their respective paths (e.g., `/auth`, `/societies`, `/units`)

---

## 🔐 Authentication & Authorization

### Overview

The API uses **JWT (JSON Web Tokens)** for authentication. Most endpoints require authentication except for:
- `POST /auth/signup` - Register new admin
- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset
- `GET /societies/public` - Public society list
- `GET /units/available/:societyId` - Available units

### Authentication Flow

#### 1. Register (Society Admin)

```http
POST /auth/signup
Content-Type: application/json

{
  "name": "John Admin",
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Admin",
    "email": "admin@example.com",
    "role": "SOCIETY_ADMIN",
    "status": "ACTIVE"
  }
}
```

#### 2. Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Admin",
    "email": "admin@example.com",
    "role": "SOCIETY_ADMIN",
    "status": "ACTIVE",
    "societyId": null,
    "unitId": null
  }
}
```

#### 3. Using Authentication Token

For protected endpoints, include the token in the Authorization header:

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles

#### PLATFORM_OWNER
- Highest level of access
- Can view and manage all societies, units, residents
- Platform-wide analytics

#### SOCIETY_ADMIN
- Manages a single society
- Creates and manages units, residents
- Creates maintenance records, announcements
- Handles issue resolution
- One admin per society (MVP constraint)

#### RESIDENT
- Accesses their own unit information
- Views maintenance dues and history
- Raises and tracks issues
- Views society announcements

### Authorization Guards

The API uses multiple layers of security:

1. **JWT Guard**: Validates token
2. **Account Status Guard**: Ensures account is ACTIVE
3. **Roles Guard**: Checks required role
4. **Society Guard**: Validates society-level access

---

## 📁 Project Structure

```
ResidentHub-BE/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migration files
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── decorators/        # Custom decorators (@CurrentUser, @Roles, etc.)
│   │   ├── guards/            # Authentication guards
│   │   ├── strategies/        # JWT strategy
│   │   ├── utils/             # Password hashing, token generation
│   │   └── dto/               # Data Transfer Objects
│   ├── users/                 # User management
│   ├── societies/             # Society management
│   ├── units/                 # Unit management
│   ├── residents/             # Resident management
│   ├── maintenance/           # Maintenance fee tracking
│   ├── issues/                # Issue/complaint management
│   ├── announcements/         # Announcement system
│   ├── dashboard/             # Dashboard statistics
│   ├── prisma/                # Prisma service
│   ├── common/                # Shared utilities
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── scripts/                   # Utility scripts
├── test/                      # E2E tests
├── .env                       # Environment variables (not in git)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

---

## 💡 API Usage Examples

### Complete Workflow Example

#### Step 1: Register as Society Admin

```bash
curl -X POST http://localhost:4001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@society.com",
    "password": "Admin123!"
  }'
```

Save the `accessToken` from the response.

#### Step 2: Create a Society

```bash
curl -X POST http://localhost:4001/societies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Green Valley Apartments",
    "addressLine1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "societyType": "APARTMENT"
  }'
```

Save the `id` from the response (this will be your `societyId`).

#### Step 3: Create Units

```bash
curl -X POST http://localhost:4001/units \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "buildingName": "Block A",
    "unitNumber": "101",
    "floorNumber": 1,
    "unitType": "TWO_BHK",
    "areaSqFt": 1200,
    "ownershipType": "OWNER"
  }'
```

#### Step 4: Create a Resident

```bash
curl -X POST http://localhost:4001/residents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "societyId": "SOCIETY_ID_FROM_STEP_2",
    "unitId": "UNIT_ID_FROM_STEP_3",
    "residentType": "OWNER",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+919876543210",
    "emergencyContact": "+919876543211",
    "startDate": "2024-01-01",
    "password": "Resident123!"
  }'
```

#### Step 5: Create Maintenance Record

```bash
curl -X POST http://localhost:4001/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "societyId": "SOCIETY_ID",
    "unitId": "UNIT_ID",
    "month": 1,
    "year": 2024,
    "amount": 5000,
    "dueDate": "2024-01-15T00:00:00Z"
  }'
```

#### Step 6: Resident Login

```bash
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Resident123!"
  }'
```

#### Step 7: View Dashboard (as Resident)

```bash
curl -X GET http://localhost:4001/dashboard \
  -H "Authorization: Bearer RESIDENT_TOKEN_HERE"
```

### Common API Operations

#### Get All Societies

```bash
curl -X GET http://localhost:4001/societies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Available Units (Public)

```bash
curl -X GET http://localhost:4001/units/available/SOCIETY_ID
```

#### Create an Issue

```bash
curl -X POST http://localhost:4001/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "societyId": "SOCIETY_ID",
    "unitId": "UNIT_ID",
    "title": "Water Leakage in Kitchen",
    "description": "There is a water leak from the ceiling",
    "priority": "HIGH"
  }'
```

#### Create an Announcement

```bash
curl -X POST http://localhost:4001/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "societyId": "SOCIETY_ID",
    "title": "Monthly Meeting",
    "content": "Monthly society meeting on 15th January at 6 PM",
    "isImportant": true,
    "expiresAt": "2024-01-20T00:00:00Z"
  }'
```

---

## 🔄 Database Reset

### Quick Reset

```bash
npm run db:reset
```

This will:
- Drop all tables
- Recreate database
- Run all migrations
- Regenerate Prisma Client

### Manual Reset

See [DATABASE_RESET_GUIDE.md](./DATABASE_RESET_GUIDE.md) for detailed instructions.

---

## 🔨 Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:prod` | Start production server |
| `npm run build` | Build the project |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:reset` | Reset database |
| `npm run db:studio` | Open Prisma Studio |

### Creating a New Migration

```bash
# After modifying prisma/schema.prisma
npm run db:migrate
```

### Code Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run lint
```

### Adding a New Module

1. Create module folder in `src/`
2. Create controller, service, and DTO files
3. Register module in `app.module.ts`
4. Add routes and guards as needed

---

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `Can't reach database server`

**Solutions**:
- Verify PostgreSQL is running: `pg_isready` or `psql -U postgres`
- Check `DATABASE_URL` in `.env` file
- Verify database exists: `psql -U postgres -l`
- Check PostgreSQL port (default: 5432)

#### 2. Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solutions**:
```bash
npm run db:generate
# OR
npx prisma generate
```

#### 3. Migration Errors

**Error**: `Migration failed`

**Solutions**:
- Reset database: `npm run db:reset`
- Check `schema.prisma` for syntax errors
- Verify database connection

#### 4. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::4001`

**Solutions**:
- Change `PORT` in `.env` file
- Kill process using port 4001: `lsof -ti:4001 | xargs kill -9` (Mac/Linux)

#### 5. JWT Token Invalid

**Error**: `Unauthorized` or `Invalid token`

**Solutions**:
- Check token is included in Authorization header
- Verify token format: `Bearer <token>`
- Ensure token hasn't expired
- Check `JWT_SECRET` matches between token creation and validation

#### 6. CORS Errors

**Error**: CORS policy blocked request

**Solutions**:
- Verify CORS is enabled in `main.ts` (should be `app.enableCors()`)
- Check frontend URL is allowed
- For development, CORS allows all origins by default

### Getting Help

1. Check the [Swagger Documentation](http://localhost:4001/api) for API details
2. Review error logs in the console
3. Check [Prisma Documentation](https://www.prisma.io/docs)
4. Review [NestJS Documentation](https://docs.nestjs.com)

---

## 📖 Additional Documentation

- **Technical Architecture**: See [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)
- **Database Reset Guide**: See [DATABASE_RESET_GUIDE.md](./DATABASE_RESET_GUIDE.md)
- **API Endpoints**: Visit Swagger UI at `http://localhost:4001/api`

---

## 🤝 Contributing

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write descriptive commit messages
- Add JSDoc comments for public methods

### Pull Request Process

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Format code: `npm run format`
6. Submit pull request

### Adding New Features

1. Update Prisma schema if needed
2. Create migration: `npm run db:migrate`
3. Update relevant modules
4. Add tests
5. Update documentation

---

## 📝 License

This project is private and proprietary.

---

## 📞 Support

For issues, questions, or contributions, please contact the development team.

---

## 🎉 Quick Start Checklist

- [ ] Node.js and PostgreSQL installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct values
- [ ] Database created and migrations run
- [ ] Server started (`npm run start:dev`)
- [ ] Swagger UI accessible (`http://localhost:4001/api`)
- [ ] Test API calls working

---

**Happy Coding! 🚀**

