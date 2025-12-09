# ResidentHub-BE

NestJS backend application for ResidentHub.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Update the `.env` file in the root directory with your PostgreSQL credentials:

```env
# Database - Update YOUR_PASSWORD with your actual PostgreSQL password
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/residenthub?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=4001
NODE_ENV=development
```

**Important:** Replace `YOUR_PASSWORD` with your actual PostgreSQL password. If your username is not `postgres`, update that as well.

### 3. Database Setup

**Option 1: Using the setup script (Recommended)**
```bash
npm run db:setup
```

**Option 2: Manual setup**
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# (Optional) Test database connection
npm run db:test

# (Optional) Open Prisma Studio to view/edit data
npm run db:studio
```

**Note:** Make sure you have created the `residenthub` database in pgAdmin before running these commands.

### 4. Run the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The application will be available at `http://localhost:4001`
Swagger documentation: `http://localhost:4001/api`

## Authentication APIs

### Register User
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```

### Login
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```

### Get Profile (Protected)
- **GET** `/auth/profile`
- **Headers:**
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response:**
  ```json
  {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

## Protecting Routes

To protect a route, simply add the `@UseGuards(JwtAuthGuard)` decorator:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Get('protected')
@UseGuards(JwtAuthGuard)
getProtectedData() {
  return { message: 'This is protected' };
}
```

To make a route public (bypass authentication), use the `@Public()` decorator:

```typescript
import { Public } from './auth/decorators/public.decorator';

@Public()
@Get('public')
getPublicData() {
  return { message: 'This is public' };
}
```

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── decorators/      # Custom decorators (@Public, @CurrentUser)
│   ├── dto/            # Data Transfer Objects
│   ├── guards/         # Auth guards
│   ├── strategies/     # Passport strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── prisma/             # Prisma module
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## Technologies

- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Database
- **JWT** - JSON Web Tokens for authentication
- **Passport** - Authentication middleware
- **Swagger** - API documentation
- **bcrypt** - Password hashing
