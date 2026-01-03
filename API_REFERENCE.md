# API Reference Guide

Quick reference for all ResidentHub Backend API endpoints.

## Base URL

```
http://localhost:4001
```

## Authentication

Most endpoints require JWT authentication. Include token in header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register Society Admin
```http
POST /auth/signup
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```
**Response:** JWT token + user object

---

### Login
```http
POST /auth/login
Content-Type: application/json
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```
**Response:** JWT token + user object

---

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json
```
**Body:**
```json
{
  "email": "user@example.com"
}
```

---

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json
```
**Body:**
```json
{
  "token": "reset-token",
  "password": "NewPassword123!"
}
```

---

### Get Current User Profile
```http
GET /auth/me
Authorization: Bearer <token>
```

---

### Update Profile
```http
PATCH /auth/me
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "name": "New Name",
  "password": "NewPassword123!"
}
```

---

## 🏢 Society Endpoints

### Create Society
```http
POST /societies
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN  
**Body:**
```json
{
  "name": "Green Valley Apartments",
  "addressLine1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "societyType": "APARTMENT"
}
```

---

### Get All Societies
```http
GET /societies
Authorization: Bearer <token>
```
**Returns:** List of societies (filtered by role)

---

### Get Public Societies
```http
GET /societies/public
```
**No auth required** - Returns active societies for registration

---

### Get Society by ID
```http
GET /societies/:id
Authorization: Bearer <token>
```

---

### Update Society
```http
PATCH /societies/:id
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

---

### Delete Society
```http
DELETE /societies/:id
Authorization: Bearer <token>
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER  
**Note:** Soft delete (sets status to INACTIVE)

---

## 🏠 Unit Endpoints

### Create Unit
```http
POST /units
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN  
**Body:**
```json
{
  "buildingName": "Block A",
  "unitNumber": "101",
  "floorNumber": 1,
  "unitType": "TWO_BHK",
  "areaSqFt": 1200,
  "ownershipType": "OWNER"
}
```

---

### Get All Units
```http
GET /units?societyId=<optional>
Authorization: Bearer <token>
```
**Query Params:** `societyId` (optional)

---

### Get Available Units (Public)
```http
GET /units/available/:societyId
```
**No auth required** - Returns units without active residents

---

### Get Unit by ID
```http
GET /units/:id
Authorization: Bearer <token>
```

---

### Update Unit
```http
PATCH /units/:id
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

---

### Delete Unit
```http
DELETE /units/:id
Authorization: Bearer <token>
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER  
**Note:** Soft delete (sets status to VACANT)

---

## 👥 Resident Endpoints

### Create Resident
```http
POST /residents
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN  
**Body:**
```json
{
  "societyId": "uuid",
  "unitId": "uuid",
  "residentType": "OWNER",
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+919876543210",
  "emergencyContact": "+919876543211",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "password": "ResidentPassword123!"
}
```
**Note:** `password` is optional. If provided, creates User account.

---

### Get All Residents
```http
GET /residents
Authorization: Bearer <token>
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

---

### Get Resident by ID
```http
GET /residents/:id
Authorization: Bearer <token>
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

---

### Update Resident
```http
PUT /residents/:id
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

---

### Delete Resident
```http
DELETE /residents/:id
Authorization: Bearer <token>
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER  
**Note:** Soft delete (sets status to SUSPENDED)

---

## 💰 Maintenance Endpoints

### Create Maintenance
```http
POST /maintenance
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER  
**Body:**
```json
{
  "societyId": "uuid",
  "unitId": "uuid",
  "month": 1,
  "year": 2024,
  "amount": 5000,
  "dueDate": "2024-01-15T00:00:00Z",
  "notes": "Monthly maintenance"
}
```

---

### Get All Maintenance
```http
GET /maintenance
Authorization: Bearer <token>
```
**Returns:** Filtered by role (resident sees only their unit)

---

### Get My Dues
```http
GET /maintenance/my-dues
Authorization: Bearer <token>
```
**Required Role:** RESIDENT  
**Returns:** Pending maintenance dues

---

### Get My History
```http
GET /maintenance/my-history
Authorization: Bearer <token>
```
**Required Role:** RESIDENT  
**Returns:** Payment history

---

### Get Maintenance by ID
```http
GET /maintenance/:id
Authorization: Bearer <token>
```

---

### Update Maintenance
```http
PATCH /maintenance/:id
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

---

### Mark Maintenance as Paid
```http
PATCH /maintenance/:id/mark-paid
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER  
**Body:**
```json
{
  "paidAt": "2024-01-10T00:00:00Z",
  "notes": "Paid via bank transfer"
}
```

---

## 🐛 Issue Endpoints

### Create Issue
```http
POST /issues
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** RESIDENT, SOCIETY_ADMIN, PLATFORM_OWNER  
**Body:**
```json
{
  "societyId": "uuid",
  "unitId": "uuid",
  "title": "Water Leakage",
  "description": "Leak in kitchen ceiling",
  "priority": "HIGH"
}
```
**Priority Options:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`

---

### Get All Issues
```http
GET /issues
Authorization: Bearer <token>
```
**Returns:** Filtered by role (resident sees only their issues)

---

### Get Issues by Status
```http
GET /issues/by-status?status=OPEN
Authorization: Bearer <token>
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER  
**Status Options:** `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

---

### Get Issue by ID
```http
GET /issues/:id
Authorization: Bearer <token>
```

---

### Update Issue
```http
PATCH /issues/:id
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "status": "RESOLVED",
  "resolutionNotes": "Fixed by plumber",
  "priority": "MEDIUM"
}
```

---

## 📢 Announcement Endpoints

### Create Announcement
```http
POST /announcements
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER  
**Body:**
```json
{
  "societyId": "uuid",
  "title": "Monthly Meeting",
  "content": "Meeting on 15th at 6 PM",
  "isImportant": true,
  "expiresAt": "2024-01-20T00:00:00Z"
}
```

---

### Get All Announcements
```http
GET /announcements
Authorization: Bearer <token>
```
**Returns:** Active announcements for user's society

---

### Get Announcement by ID
```http
GET /announcements/:id
Authorization: Bearer <token>
```

---

### Update Announcement
```http
PATCH /announcements/:id
Authorization: Bearer <token>
Content-Type: application/json
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

---

### Delete Announcement
```http
DELETE /announcements/:id
Authorization: Bearer <token>
```
**Required Role:** SOCIETY_ADMIN, PLATFORM_OWNER

---

## 📊 Dashboard Endpoint

### Get Dashboard Statistics
```http
GET /dashboard
Authorization: Bearer <token>
```
**Returns:** Role-specific dashboard data

**Platform Owner:**
- Total societies, users, units
- Active vs inactive societies

**Society Admin:**
- Pending maintenance dues
- Open issues count
- Total units and residents
- Recent announcements

**Resident:**
- Outstanding balance
- Active issues count
- Latest announcements
- Pending dues
- Recent payments

---

## 🏥 Health Check

### Get Hello Message
```http
GET /
```
**No auth required** - Returns "Hello World!"

---

## 📝 Common Enums

### Role
- `PLATFORM_OWNER`
- `SOCIETY_ADMIN`
- `RESIDENT`

### Account Status
- `ACTIVE`
- `SUSPENDED`

### Society Type
- `APARTMENT`
- `VILLA`
- `ROW_HOUSE`

### Unit Type
- `ONE_BHK`
- `TWO_BHK`
- `THREE_BHK`
- `FOUR_BHK`
- `VILLA`

### Resident Type
- `OWNER`
- `TENANT`

### Maintenance Status
- `UPCOMING`
- `DUE`
- `PAID`
- `OVERDUE`

### Issue Status
- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`

### Issue Priority
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

---

## 📊 Response Format

### Success Response
```json
{
  "id": "uuid",
  "name": "Example",
  // ... other fields
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": ["Error message"],
  "error": "Bad Request"
}
```

---

## 🔒 HTTP Status Codes

- `200 OK` - Successful GET, PATCH
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (email, etc.)

---

## 📖 Interactive Documentation

For detailed documentation with examples, visit:

**Swagger UI:** http://localhost:4001/api

This provides:
- Interactive API testing
- Request/response schemas
- Authentication testing
- Try-it-out functionality

---

## 💡 Tips

1. **Always include Authorization header** for protected endpoints
2. **Check role requirements** before calling endpoints
3. **Use Swagger UI** for testing and exploring APIs
4. **UUID format** is required for all ID parameters
5. **Dates** should be in ISO 8601 format (YYYY-MM-DD or ISO string)

---

For complete workflow examples, see [README.md](./README.md#-api-usage-examples)

