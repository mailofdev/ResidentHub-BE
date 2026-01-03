# ResidentHub MVP - Flow Charts & Complete API Documentation

## 📋 Table of Contents

1. [MVP Flow Charts](#mvp-flow-charts)
2. [Complete API Documentation](#complete-api-documentation)
3. [Request/Response Examples](#requestresponse-examples)

---

## 🎯 MVP Flow Charts

### 1. Overall System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RESIDENTHUB SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │
│   (Client)   │
└──────┬───────┘
       │
       │ HTTP/REST API
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ResidentHub Backend API                        │
│                    (NestJS + PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth       │  │  Societies   │  │    Units     │          │
│  │   Module     │  │   Module     │  │   Module     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Residents   │  │ Maintenance  │  │   Issues     │          │
│  │   Module     │  │   Module     │  │   Module     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │Announcements │  │  Dashboard   │                             │
│  │   Module     │  │   Module     │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ Prisma ORM
                                │
                                ▼
                    ┌───────────────────────┐
                    │    PostgreSQL         │
                    │    Database           │
                    └───────────────────────┘
```

---

### 2. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Client     │
                    └──────┬───────┘
                           │
                           │ 1. POST /auth/signup or /auth/login
                           │    { email, password }
                           │
                           ▼
                    ┌──────────────────┐
                    │  Auth Controller │
                    └────────┬─────────┘
                             │
                             │ 2. Validate credentials
                             │
                             ▼
                    ┌──────────────────┐
                    │   Auth Service   │
                    └────────┬─────────┘
                             │
                             │ 3. Hash password (signup)
                             │    Verify password (login)
                             │
                             ▼
                    ┌──────────────────┐
                    │  Users Service   │
                    └────────┬─────────┘
                             │
                             │ 4. Create/Find user in DB
                             │
                             ▼
                    ┌──────────────────┐
                    │   Prisma ORM     │
                    └────────┬─────────┘
                             │
                             │ 5. Database Query
                             │
                             ▼
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    └────────┬─────────┘
                             │
                             │ 6. Return user data
                             │
                             ▼
                    ┌──────────────────┐
                    │  JWT Generation  │
                    │  { sub, role,    │
                    │    societyId,    │
                    │    unitId }      │
                    └────────┬─────────┘
                             │
                             │ 7. Return JWT token + user
                             │
                             ▼
                    ┌──────────────────┐
                    │   Client         │
                    │   Stores token   │
                    └──────────────────┘

                    ┌──────────────────────────────┐
                    │  Subsequent Requests:        │
                    │  Authorization: Bearer <JWT> │
                    └──────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  JWT Auth Guard  │
                    │  Validates token │
                    └────────┬─────────┘
                             │
                             │ 8. Extract user info
                             │
                             ▼
                    ┌──────────────────┐
                    │  Roles Guard     │
                    │  (if required)   │
                    └────────┬─────────┘
                             │
                             │ 9. Check permissions
                             │
                             ▼
                    ┌──────────────────┐
                    │  Controller      │
                    │  Process request │
                    └──────────────────┘
```

---

### 3. Society Admin Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              SOCIETY ADMIN ONBOARDING FLOW                       │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────┐
│ 1. Register as Admin    │
│ POST /auth/signup       │
│ { name, email,          │
│   password }            │
└───────────┬─────────────┘
            │
            │ Returns: JWT token + user (role: SOCIETY_ADMIN)
            │
            ▼
┌─────────────────────────┐
│ 2. Login                │
│ POST /auth/login        │
│ { email, password }     │
└───────────┬─────────────┘
            │
            │ Returns: JWT token (includes societyId: null)
            │
            ▼
┌─────────────────────────┐
│ 3. Create Society       │
│ POST /societies         │
│ { name, address,        │
│   city, state,          │
│   pincode, type }       │
└───────────┬─────────────┘
            │
            │ System generates unique society code
            │ Updates admin's societyId in User record
            │
            ▼
┌─────────────────────────┐
│ 4. Create Units         │
│ POST /units             │
│ (Repeat for each unit)  │
│ { buildingName,         │
│   unitNumber, type }    │
└───────────┬─────────────┘
            │
            │ Units linked to admin's societyId
            │
            ▼
┌─────────────────────────┐
│ 5. Create Residents     │
│ POST /residents         │
│ { societyId, unitId,    │
│   name, email,          │
│   mobile, password }    │
└───────────┬─────────────┘
            │
            │ Creates Resident record
            │ If password provided: Creates User account
            │ Links User to unitId and societyId
            │
            ▼
┌─────────────────────────┐
│ 6. Create Maintenance   │
│ POST /maintenance       │
│ { unitId, month, year,  │
│   amount, dueDate }     │
└───────────┬─────────────┘
            │
            │ Maintenance records created per unit
            │
            ▼
┌─────────────────────────┐
│ 7. Create Announcements │
│ POST /announcements     │
│ { societyId, title,     │
│   content, isImportant }│
└───────────┬─────────────┘
            │
            │ Announcements visible to all residents
            │
            ▼
        END - System Ready
```

---

### 4. Resident Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESIDENT JOURNEY FLOW                         │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────┐
│ 1. Admin Creates        │
│    Resident Record      │
│ POST /residents         │
│ (with or without        │
│  password)              │
└───────────┬─────────────┘
            │
            ├─── If password provided ───┐
            │                            │
            │                            ▼
            │                   ┌─────────────────────┐
            │                   │ User account        │
            │                   │ created             │
            │                   └──────────┬──────────┘
            │                              │
            └─── If no password ───────────┴───┐
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ Resident can use    │
                                    │ Forgot Password     │
                                    │ to set password     │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ 2. Resident Login   │
                                    │ POST /auth/login    │
                                    └──────────┬──────────┘
                                               │
                                               │ Returns JWT token
                                               │ (includes unitId, societyId)
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ 3. View Dashboard   │
                                    │ GET /dashboard      │
                                    └──────────┬──────────┘
                                               │
                                               │ Shows:
                                               │ - Outstanding balance
                                               │ - Active issues
                                               │ - Announcements
                                               │ - Pending dues
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ 4. View Maintenance │
                                    │ GET /maintenance/   │
                                    │    my-dues          │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ 5. Raise Issue      │
                                    │ POST /issues        │
                                    │ { title,            │
                                    │   description,      │
                                    │   priority }        │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ 6. View Announcements│
                                    │ GET /announcements  │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                            END
```

---

### 5. Issue Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ISSUE RESOLUTION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │ Resident raises     │
                    │ issue               │
                    │ POST /issues        │
                    └──────────┬──────────┘
                               │
                               │ Status: OPEN
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Admin views issue   │
                    │ GET /issues         │
                    │ or                  │
                    │ GET /issues/        │
                    │   by-status?        │
                    │   status=OPEN       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Admin updates       │
                    │ status              │
                    │ PATCH /issues/:id   │
                    │ { status:           │
                    │   IN_PROGRESS }     │
                    └──────────┬──────────┘
                               │
                               │ Status: IN_PROGRESS
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Issue being         │
                    │ resolved            │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Admin resolves      │
                    │ PATCH /issues/:id   │
                    │ { status: RESOLVED, │
                    │   resolutionNotes,  │
                    │   resolvedBy,       │
                    │   resolvedAt }      │
                    └──────────┬──────────┘
                               │
                               │ Status: RESOLVED
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Admin closes        │
                    │ PATCH /issues/:id   │
                    │ { status: CLOSED,   │
                    │   closedAt }        │
                    └──────────┬──────────┘
                               │
                               │ Status: CLOSED
                               │
                               ▼
                            END
```

---

### 6. Maintenance Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  MAINTENANCE PAYMENT FLOW                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│ Admin creates       │
│ maintenance         │
│ POST /maintenance   │
│ { unitId, month,    │
│   year, amount,     │
│   dueDate }         │
└──────────┬──────────┘
           │
           │ Status: UPCOMING
           │
           ▼
┌─────────────────────┐
│ Due date arrives    │
│ (System can auto    │
│  update or manual)  │
└──────────┬──────────┘
           │
           │ Status: DUE
           │
           ▼
┌─────────────────────┐
│ Resident views      │
│ GET /maintenance/   │
│   my-dues           │
└──────────┬──────────┘
           │
           │ Shows pending dues
           │
           ▼
┌─────────────────────┐
│ Payment made        │
│ (offline/3rd party) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Admin marks as paid │
│ PATCH /maintenance/ │
│   :id/mark-paid     │
│ { paidAt, notes }   │
└──────────┬──────────┘
           │
           │ Status: PAID
           │ Updates paidAt, paidBy
           │
           ▼
        COMPLETED

Note: If payment overdue → Status: OVERDUE
```

---

## 📚 Complete API Documentation

### Base URL
```
http://localhost:4001
```

### Authentication Header Format
```
Authorization: Bearer <jwt-token>
```

---

## 🔐 Authentication APIs

### POST /auth/signup

**Description:** Register a new society admin account

**Public Endpoint:** Yes (no authentication required)

**Request Body:**
```json
{
  "name": "John Admin",
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Request Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | Non-empty | Full name |
| email | string | Yes | Valid email format | Email address |
| password | string | Yes | Min 8 characters | Password |

**Response (201 Created):**
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
    "unitId": null,
    "createdBy": null,
    "lastLoginAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `409 Conflict`: User with email already exists
- `400 Bad Request`: Validation error

---

### POST /auth/login

**Description:** Authenticate user and receive JWT token

**Public Endpoint:** Yes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Request Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | string | Yes | Valid email | User email |
| password | string | Yes | Non-empty | User password |

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Admin",
    "email": "admin@example.com",
    "role": "SOCIETY_ADMIN",
    "status": "ACTIVE",
    "societyId": "uuid",
    "unitId": null,
    "createdBy": null,
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials or account suspended

---

### POST /auth/forgot-password

**Description:** Request password reset token

**Public Endpoint:** Yes

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Note:** In development, reset token is logged to console

---

### POST /auth/reset-password

**Description:** Reset password using token

**Public Endpoint:** Yes

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired reset token

---

### GET /auth/me

**Description:** Get current authenticated user profile

**Authentication Required:** Yes

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "John Admin",
  "email": "admin@example.com",
  "role": "SOCIETY_ADMIN",
  "status": "ACTIVE",
  "societyId": "uuid",
  "unitId": null,
  "createdBy": null,
  "lastLoginAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /auth/me

**Description:** Update user profile (name and/or password)

**Authentication Required:** Yes

**Request Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Name",
  "password": "NewPassword123!"
}
```
**Note:** Both fields are optional, but at least one must be provided

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "New Name",
  "email": "admin@example.com",
  "role": "SOCIETY_ADMIN",
  "status": "ACTIVE",
  "societyId": "uuid",
  "unitId": null,
  "createdBy": null,
  "lastLoginAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 🏢 Society APIs

### POST /societies

**Description:** Create a new society

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN

**Request Body:**
```json
{
  "name": "Green Valley Apartments",
  "addressLine1": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "560001",
  "societyType": "APARTMENT"
}
```

**Request Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | Non-empty | Society name |
| addressLine1 | string | Yes | Non-empty | Address line 1 |
| city | string | Yes | Non-empty | City |
| state | string | Yes | Non-empty | State |
| pincode | string | Yes | 6 digits | Pincode |
| societyType | enum | Yes | APARTMENT/VILLA/ROW_HOUSE | Society type |

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Green Valley Apartments",
  "code": "GV-2024-001",
  "addressLine1": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "560001",
  "societyType": "APARTMENT",
  "createdBy": "admin-uuid",
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: Only society admins can create
- `409 Conflict`: User already has a society (MVP: one admin per society)

---

### GET /societies

**Description:** Get all societies (filtered by role)

**Authentication Required:** Yes

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Green Valley Apartments",
    "code": "GV-2024-001",
    "addressLine1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "560001",
    "societyType": "APARTMENT",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Filtering:**
- **SOCIETY_ADMIN:** Returns only their society
- **PLATFORM_OWNER:** Returns all societies
- **RESIDENT:** Returns their society

---

### GET /societies/public

**Description:** Get all active societies (for public registration)

**Public Endpoint:** Yes

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Green Valley Apartments",
    "code": "GV-2024-001",
    "city": "Mumbai",
    "state": "Maharashtra",
    "societyType": "APARTMENT"
  }
]
```

---

### GET /societies/:id

**Description:** Get society details by ID

**Authentication Required:** Yes

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Society ID |

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Green Valley Apartments",
  "code": "GV-2024-001",
  "addressLine1": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "560001",
  "societyType": "APARTMENT",
  "createdBy": "admin-uuid",
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Society not found
- `403 Forbidden`: No access to this society

---

### PATCH /societies/:id

**Description:** Update society information

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:**
```json
{
  "name": "Updated Name",
  "city": "Bangalore",
  "status": "ACTIVE"
}
```
**All fields optional**

**Response (200 OK):** Updated society object

---

### DELETE /societies/:id

**Description:** Soft delete society (set status to INACTIVE)

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Response (200 OK):**
```json
{
  "message": "Society successfully deleted"
}
```

**Error Responses:**
- `400 Bad Request`: Cannot delete society with units

---

## 🏠 Unit APIs

### POST /units

**Description:** Create a new unit in admin's society

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN

**Request Body:**
```json
{
  "buildingName": "Block A",
  "unitNumber": "101",
  "floorNumber": 2,
  "unitType": "TWO_BHK",
  "areaSqFt": 1200.5,
  "ownershipType": "OWNER"
}
```

**Request Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| buildingName | string | Yes | Non-empty | Building/Block name |
| unitNumber | string | Yes | Non-empty | Unit/Flat number |
| floorNumber | number | No | >= 0 | Floor number |
| unitType | enum | Yes | ONE_BHK/TWO_BHK/THREE_BHK/FOUR_BHK/VILLA | Unit type |
| areaSqFt | number | No | > 0 | Area in square feet |
| ownershipType | enum | Yes | OWNER/TENANT | Ownership type |

**Response (201 Created):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "buildingName": "Block A",
  "unitNumber": "101",
  "floorNumber": 2,
  "unitType": "TWO_BHK",
  "areaSqFt": 1200.5,
  "ownershipType": "OWNER",
  "status": "OCCUPIED",
  "createdBy": "admin-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** `societyId` is automatically taken from the authenticated admin's token

---

### GET /units

**Description:** Get all units (filtered by role/society)

**Authentication Required:** Yes

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| societyId | UUID | No | Filter by society ID |

**Response (200 OK):** Array of unit objects

---

### GET /units/available/:societyId

**Description:** Get available units (no active resident) for a society

**Public Endpoint:** Yes

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| societyId | UUID | Society ID |

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "buildingName": "Block A",
    "unitNumber": "101",
    "floorNumber": 2,
    "unitType": "TWO_BHK",
    "areaSqFt": 1200.5,
    "status": "VACANT"
  }
]
```

---

### GET /units/:id

**Description:** Get unit details by ID

**Authentication Required:** Yes

**Response (200 OK):** Unit object with full details

---

### PATCH /units/:id

**Description:** Update unit information

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:** All fields optional
```json
{
  "floorNumber": 3,
  "areaSqFt": 1300,
  "status": "VACANT"
}
```

---

### DELETE /units/:id

**Description:** Soft delete unit (set status to VACANT)

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Error Responses:**
- `400 Bad Request`: Cannot delete unit with residents

---

## 👥 Resident APIs

### POST /residents

**Description:** Create a new resident and optionally create user account

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN

**Request Body:**
```json
{
  "societyId": "uuid",
  "buildingId": "Block A",
  "unitId": "uuid",
  "residentType": "OWNER",
  "ownerId": null,
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+919876543210",
  "emergencyContact": "+919876543211",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "password": "Resident123!"
}
```

**Request Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| societyId | UUID | Yes | Valid UUID | Society ID |
| buildingId | string | No | - | Building name |
| unitId | UUID | Yes | Valid UUID | Unit ID |
| residentType | enum | Yes | OWNER/TENANT | Resident type |
| ownerId | UUID | No | Valid UUID | Required if TENANT |
| name | string | Yes | Non-empty | Resident name |
| email | string | Yes | Valid email | Email (unique in society) |
| mobile | string | Yes | Non-empty | Mobile (unique in society) |
| emergencyContact | string | No | - | Emergency contact |
| startDate | string | Yes | Date format | Start date |
| endDate | string | No | Date format | End date |
| password | string | No | - | Creates User account if provided |

**Response (201 Created):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "buildingId": "Block A",
  "unitId": "uuid",
  "residentType": "OWNER",
  "ownerId": null,
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+919876543210",
  "emergencyContact": "+919876543211",
  "status": "ACTIVE",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Important Notes:**
- If `password` is provided, a User account is created with RESIDENT role
- Email and mobile must be unique within the society
- Creating OWNER resident updates `unit.ownerId`
- Creating TENANT resident updates `unit.tenantId` and requires `ownerId`

---

### GET /residents

**Description:** Get all residents (filtered by role)

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+919876543210",
    "residentType": "OWNER",
    "status": "ACTIVE",
    "society": {
      "id": "uuid",
      "name": "Green Valley",
      "code": "GV-001"
    },
    "unit": {
      "id": "uuid",
      "buildingName": "Block A",
      "unitNumber": "101",
      "unitType": "TWO_BHK"
    },
    "owner": null
  }
]
```

---

### GET /residents/:id

**Description:** Get resident details by ID

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Response (200 OK):** Resident object with full relations

---

### PUT /residents/:id

**Description:** Update resident information

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:** All fields optional except cannot change residentType
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "mobile": "+919999999999",
  "emergencyContact": "+919888888888",
  "startDate": "2024-02-01",
  "endDate": "2025-01-31"
}
```

---

### DELETE /residents/:id

**Description:** Deactivate resident (set status to SUSPENDED)

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Response (200 OK):**
```json
{
  "message": "Resident deactivated successfully",
  "residentId": "uuid"
}
```

---

## 💰 Maintenance APIs

### POST /maintenance

**Description:** Create maintenance record for a unit

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:**
```json
{
  "societyId": "uuid",
  "unitId": "uuid",
  "month": 1,
  "year": 2024,
  "amount": 5000.00,
  "dueDate": "2024-01-15T00:00:00Z",
  "notes": "Monthly maintenance for January"
}
```

**Request Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| societyId | UUID | Yes | Valid UUID | Society ID |
| unitId | UUID | Yes | Valid UUID | Unit ID |
| month | number | Yes | 1-12 | Month |
| year | number | Yes | - | Year (e.g., 2024) |
| amount | number | Yes | > 0 | Maintenance amount |
| dueDate | string | Yes | ISO date | Due date |
| notes | string | No | - | Additional notes |

**Response (201 Created):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "month": 1,
  "year": 2024,
  "amount": 5000.00,
  "dueDate": "2024-01-15T00:00:00.000Z",
  "status": "UPCOMING",
  "notes": "Monthly maintenance for January",
  "paidAt": null,
  "paidBy": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Status Flow:** UPCOMING → DUE → PAID (or OVERDUE)

---

### GET /maintenance

**Description:** Get all maintenance records (filtered by role)

**Authentication Required:** Yes

**Response:**
- **SOCIETY_ADMIN:** All maintenance in their society
- **PLATFORM_OWNER:** All maintenance
- **RESIDENT:** Only their unit's maintenance

---

### GET /maintenance/my-dues

**Description:** Get pending maintenance dues for resident's unit

**Authentication Required:** Yes  
**Required Role:** RESIDENT

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "month": 1,
    "year": 2024,
    "amount": 5000.00,
    "dueDate": "2024-01-15T00:00:00.000Z",
    "status": "DUE",
    "notes": null
  }
]
```

---

### GET /maintenance/my-history

**Description:** Get payment history for resident's unit

**Authentication Required:** Yes  
**Required Role:** RESIDENT

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "month": 12,
    "year": 2023,
    "amount": 5000.00,
    "dueDate": "2023-12-15T00:00:00.000Z",
    "status": "PAID",
    "paidAt": "2023-12-10T00:00:00.000Z",
    "notes": "Paid via bank transfer"
  }
]
```

---

### GET /maintenance/:id

**Description:** Get maintenance record by ID

**Authentication Required:** Yes

---

### PATCH /maintenance/:id

**Description:** Update maintenance record

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:**
```json
{
  "amount": 5500.00,
  "dueDate": "2024-01-20T00:00:00Z",
  "notes": "Updated amount"
}
```

---

### PATCH /maintenance/:id/mark-paid

**Description:** Mark maintenance as paid

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:**
```json
{
  "paidAt": "2024-01-10T00:00:00Z",
  "notes": "Paid via bank transfer"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "PAID",
  "paidAt": "2024-01-10T00:00:00.000Z",
  "paidBy": "admin-uuid",
  "notes": "Paid via bank transfer"
}
```

---

## 🐛 Issue APIs

### POST /issues

**Description:** Raise a new issue

**Authentication Required:** Yes  
**Required Role:** RESIDENT, SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:**
```json
{
  "societyId": "uuid",
  "unitId": "uuid",
  "title": "Water Leakage in Kitchen",
  "description": "There is a water leak from the ceiling in the kitchen area",
  "priority": "HIGH"
}
```

**Request Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| societyId | UUID | Yes | Valid UUID | Society ID |
| unitId | UUID | No | Valid UUID | Unit ID (optional for society-level) |
| title | string | Yes | Non-empty | Issue title |
| description | string | Yes | Non-empty | Issue description |
| priority | enum | Yes | LOW/MEDIUM/HIGH/URGENT | Priority level |

**Response (201 Created):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "raisedBy": "user-uuid",
  "title": "Water Leakage in Kitchen",
  "description": "There is a water leak from the ceiling...",
  "status": "OPEN",
  "priority": "HIGH",
  "resolutionNotes": null,
  "resolvedBy": null,
  "resolvedAt": null,
  "closedAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /issues

**Description:** Get all issues (filtered by role)

**Authentication Required:** Yes

**Response:**
- **SOCIETY_ADMIN:** All issues in their society
- **PLATFORM_OWNER:** All issues
- **RESIDENT:** Only issues raised by them

---

### GET /issues/by-status

**Description:** Get issues filtered by status

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | enum | Yes | OPEN/IN_PROGRESS/RESOLVED/CLOSED |

**Example:**
```
GET /issues/by-status?status=OPEN
```

---

### GET /issues/:id

**Description:** Get issue details by ID

**Authentication Required:** Yes

---

### PATCH /issues/:id

**Description:** Update issue (status, priority, resolution notes)

**Authentication Required:** Yes

**Request Body:**
```json
{
  "status": "RESOLVED",
  "priority": "MEDIUM",
  "resolutionNotes": "Fixed by plumber. Leak sealed.",
  "resolvedBy": "admin-uuid",
  "resolvedAt": "2024-01-05T00:00:00Z"
}
```

**Authorization:**
- **RESIDENT:** Can update own issues (only if status is OPEN)
- **SOCIETY_ADMIN:** Can update any issue in their society
- **PLATFORM_OWNER:** Can update any issue

---

## 📢 Announcement APIs

### POST /announcements

**Description:** Create announcement for a society

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:**
```json
{
  "societyId": "uuid",
  "title": "Monthly Society Meeting",
  "content": "Monthly meeting scheduled on 15th January at 6 PM in the clubhouse",
  "isImportant": true,
  "expiresAt": "2024-01-20T00:00:00Z"
}
```

**Request Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| societyId | UUID | Yes | Valid UUID | Society ID |
| title | string | Yes | Non-empty | Announcement title |
| content | string | Yes | Non-empty | Announcement content |
| isImportant | boolean | No | - | Mark as important (default: false) |
| expiresAt | string | No | ISO date | Expiration date (null = never expires) |

**Response (201 Created):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "createdBy": "admin-uuid",
  "title": "Monthly Society Meeting",
  "content": "Monthly meeting scheduled...",
  "isImportant": true,
  "expiresAt": "2024-01-20T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /announcements

**Description:** Get all active announcements (filtered by society)

**Authentication Required:** Yes

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "title": "Monthly Society Meeting",
    "content": "Monthly meeting scheduled...",
    "isImportant": true,
    "expiresAt": "2024-01-20T00:00:00.000Z",
    "creator": {
      "id": "uuid",
      "name": "Admin Name"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Note:** Only returns announcements where `expiresAt > now` or `expiresAt is null`

---

### GET /announcements/:id

**Description:** Get announcement details by ID

**Authentication Required:** Yes

---

### PATCH /announcements/:id

**Description:** Update announcement

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Request Body:** All fields optional
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "isImportant": false,
  "expiresAt": "2024-02-01T00:00:00Z"
}
```

---

### DELETE /announcements/:id

**Description:** Delete announcement

**Authentication Required:** Yes  
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

**Response (200 OK):**
```json
{
  "message": "Announcement deleted successfully"
}
```

---

## 📊 Dashboard API

### GET /dashboard

**Description:** Get role-based dashboard statistics

**Authentication Required:** Yes

**Response (200 OK):**

**Platform Owner:**
```json
{
  "totalSocieties": 10,
  "activeSocieties": 8,
  "inactiveSocieties": 2,
  "totalUsers": 150,
  "totalAdmins": 10,
  "totalResidents": 140,
  "totalUnits": 500,
  "recentSocieties": [...]
}
```

**Society Admin:**
```json
{
  "pendingMaintenanceDues": 250000.00,
  "openIssuesCount": 5,
  "recentAnnouncements": [...],
  "totalUnits": 50,
  "totalResidents": 45
}
```

**Resident:**
```json
{
  "outstandingBalance": 10000.00,
  "activeIssuesCount": 2,
  "latestAnnouncements": [...],
  "pendingDues": [...],
  "recentPayments": [...]
}
```

---

## 🏥 Health Check API

### GET /

**Description:** Health check endpoint

**Public Endpoint:** Yes

**Response (200 OK):**
```
Hello World!
```

---

## 📝 Enums Reference

### Role
```typescript
enum Role {
  PLATFORM_OWNER
  SOCIETY_ADMIN
  RESIDENT
}
```

### Account Status
```typescript
enum AccountStatus {
  ACTIVE
  SUSPENDED
}
```

### Society Type
```typescript
enum SocietyType {
  APARTMENT
  VILLA
  ROW_HOUSE
}
```

### Unit Type
```typescript
enum UnitType {
  ONE_BHK
  TWO_BHK
  THREE_BHK
  FOUR_BHK
  VILLA
}
```

### Resident Type
```typescript
enum ResidentType {
  OWNER
  TENANT
}
```

### Maintenance Status
```typescript
enum MaintenanceStatus {
  UPCOMING
  DUE
  PAID
  OVERDUE
}
```

### Issue Status
```typescript
enum IssueStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

### Issue Priority
```typescript
enum IssuePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

---

## 🔒 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions, suspended account |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (email, etc.) |

---

## 💡 Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Check role requirements** before calling endpoints
3. **Use UUID format** for all ID parameters
4. **Dates** should be in ISO 8601 format
5. **Validate inputs** before sending requests
6. **Handle errors** appropriately based on status codes
7. **Store JWT tokens securely** (not in localStorage for production)

---

**For interactive API testing, visit:** http://localhost:4001/api

