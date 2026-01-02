# ResidentHub API Documentation

This document provides comprehensive API documentation for frontend developers, including request/response formats, error handling, and role-based access control.

## Table of Contents

1. [Authentication](#authentication)
2. [Account Status & Role-Based Access](#account-status--role-based-access)
3. [Residents API](#residents-api)
4. [Maintenance API](#maintenance-api)
5. [Issues API](#issues-api)
6. [Announcements API](#announcements-api)
7. [Societies API](#societies-api)
8. [Units API](#units-api)
9. [Dashboard API](#dashboard-api)
10. [Error Handling](#error-handling)

---

## Authentication

### Base URL
All API endpoints are prefixed with the base URL (e.g., `http://localhost:3000`)

### Authentication Header
All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "RESIDENT",
    "status": "ACTIVE",
    "societyId": "uuid",
    "unitId": "uuid",
    "createdBy": null,
    "lastLoginAt": "2024-12-28T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `401 Unauthorized` - Account suspended
- `401 Unauthorized` - Account not active

---

## Account Status & Role-Based Access

### Account Statuses
- `ACTIVE` - User can access all features
- `PENDING_APPROVAL` - User can login but cannot access protected routes
- `SUSPENDED` - User cannot login

### Roles
- `PLATFORM_OWNER` - Can view all data across all societies
- `SOCIETY_ADMIN` - Can manage their own society
- `RESIDENT` - Can access only their own data (society + unit scoped)

### Important Notes
- `PENDING_APPROVAL` users can login but will receive `403 Forbidden` on protected routes
- All protected routes require `AccountStatusGuard` (status must be `ACTIVE`)
- Role-based filtering is automatic - users only see data they have access to

---

## Residents API

### Create Join Request (Public)
**POST** `/residents/join-request`

**Description:** Register as a resident. Creates user with `PENDING_APPROVAL` status.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "societyId": "uuid",
  "buildingId": "Block A",  // Optional
  "unitId": "uuid"
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "PENDING",
  "message": "Join request submitted. Waiting for admin approval."
}
```

**Error Responses:**
- `409 Conflict` - User with email already exists
- `404 Not Found` - Society or unit not found
- `400 Bad Request` - Unit does not belong to society
- `409 Conflict` - Unit already has an active resident

---

### Get My Join Request Status
**GET** `/residents/my-join-request`

**Description:** Get current user's join request status. Works for `PENDING_APPROVAL` users.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "status": "PENDING",
  "rejectionReason": null,
  "reviewedBy": null,
  "reviewedAt": null,
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "unit": {
    "id": "uuid",
    "buildingName": "Block A",
    "unitNumber": "A-203"
  }
}
```

**Status Values:**
- `PENDING` - Waiting for approval
- `APPROVED` - Approved (user status becomes `ACTIVE`)
- `REJECTED` - Rejected by admin
- `CLOSED` - Request closed

---

### Get All Join Requests
**GET** `/residents/join-requests`

**Description:** Get all pending join requests. Only for `SOCIETY_ADMIN` and `PLATFORM_OWNER`.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "societyId": "uuid",
    "unitId": "uuid",
    "status": "PENDING",
    "rejectionReason": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "PENDING_APPROVAL"
    },
    "society": {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001"
    },
    "unit": {
      "id": "uuid",
      "buildingName": "Block A",
      "unitNumber": "A-203"
    }
  }
]
```

**Error Responses:**
- `403 Forbidden` - Insufficient permissions
- `403 Forbidden` - Account not active

---

### Approve Resident
**PATCH** `/residents/join-requests/:id/approve`

**Description:** Approve a resident join request. Sets user status to `ACTIVE`.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Success Response (200):**
```json
{
  "message": "Resident approved successfully",
  "joinRequestId": "uuid"
}
```

**Error Responses:**
- `404 Not Found` - Join request not found
- `403 Forbidden` - Insufficient permissions or wrong society
- `400 Bad Request` - Request already processed

---

### Reject Resident
**PATCH** `/residents/join-requests/:id/reject`

**Description:** Reject a resident join request.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Request Body:**
```json
{
  "rejectionReason": "Invalid documents provided"  // Optional
}
```

**Success Response (200):**
```json
{
  "message": "Resident join request rejected",
  "joinRequestId": "uuid"
}
```

**Error Responses:**
- `404 Not Found` - Join request not found
- `403 Forbidden` - Insufficient permissions or wrong society
- `400 Bad Request` - Request already processed

---

## Maintenance API

### Create Maintenance
**POST** `/maintenance`

**Description:** Create a maintenance record for a unit. Only `SOCIETY_ADMIN` can create.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Request Body:**
```json
{
  "unitId": "uuid",
  "month": 12,
  "year": 2024,
  "amount": 5000.0,
  "dueDate": "2024-12-31T00:00:00Z",
  "notes": "Monthly maintenance for December"  // Optional
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "month": 12,
  "year": 2024,
  "amount": 5000.0,
  "dueDate": "2024-12-31T00:00:00Z",
  "status": "UPCOMING",
  "paidAt": null,
  "paidBy": null,
  "notes": "Monthly maintenance for December",
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "unit": {
    "id": "uuid",
    "buildingName": "Block A",
    "unitNumber": "A-203"
  }
}
```

**Status Values:**
- `UPCOMING` - Due date is in the future
- `DUE` - Due date has passed
- `PAID` - Marked as paid by admin
- `OVERDUE` - Past due date (auto-updated)

**Error Responses:**
- `403 Forbidden` - Only society admins can create maintenance
- `404 Not Found` - Unit not found
- `403 Forbidden` - Unit does not belong to your society
- `409 Conflict` - Maintenance for this month/year already exists

---

### Get All Maintenance
**GET** `/maintenance`

**Description:** Get all maintenance records. Filtered by role:
- `PLATFORM_OWNER`: All maintenance
- `SOCIETY_ADMIN`: All maintenance in their society
- `RESIDENT`: Only their own maintenance

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "societyId": "uuid",
    "unitId": "uuid",
    "month": 12,
    "year": 2024,
    "amount": 5000.0,
    "dueDate": "2024-12-31T00:00:00Z",
    "status": "DUE",
    "paidAt": null,
    "paidBy": null,
    "notes": null,
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "society": {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001"
    },
    "unit": {
      "id": "uuid",
      "buildingName": "Block A",
      "unitNumber": "A-203"
    }
  }
]
```

---

### Get My Maintenance Dues
**GET** `/maintenance/my-dues`

**Description:** Get pending maintenance dues for current user. Only for `RESIDENT`.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `RESIDENT`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "societyId": "uuid",
    "unitId": "uuid",
    "month": 12,
    "year": 2024,
    "amount": 5000.0,
    "dueDate": "2024-12-31T00:00:00Z",
    "status": "DUE",
    "paidAt": null,
    "paidBy": null,
    "notes": null,
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "society": {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001"
    },
    "unit": {
      "id": "uuid",
      "buildingName": "Block A",
      "unitNumber": "A-203"
    }
  }
]
```

**Note:** Returns only records with status `UPCOMING`, `DUE`, or `OVERDUE`.

---

### Get My Maintenance History
**GET** `/maintenance/my-history`

**Description:** Get payment history for current user. Only for `RESIDENT`.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `RESIDENT`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "societyId": "uuid",
    "unitId": "uuid",
    "month": 11,
    "year": 2024,
    "amount": 5000.0,
    "dueDate": "2024-11-30T00:00:00Z",
    "status": "PAID",
    "paidAt": "2024-11-25T10:00:00Z",
    "paidBy": "uuid",
    "notes": "Payment received via cash",
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-25T10:00:00Z",
    "society": {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001"
    },
    "unit": {
      "id": "uuid",
      "buildingName": "Block A",
      "unitNumber": "A-203"
    }
  }
]
```

**Note:** Returns only records with status `PAID`.

---

### Get Maintenance by ID
**GET** `/maintenance/:id`

**Description:** Get a specific maintenance record.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "month": 12,
  "year": 2024,
  "amount": 5000.0,
  "dueDate": "2024-12-31T00:00:00Z",
  "status": "DUE",
  "paidAt": null,
  "paidBy": null,
  "notes": null,
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "unit": {
    "id": "uuid",
    "buildingName": "Block A",
    "unitNumber": "A-203"
  }
}
```

**Error Responses:**
- `404 Not Found` - Maintenance record not found
- `403 Forbidden` - You do not have access to this record

---

### Mark Maintenance as Paid
**PATCH** `/maintenance/:id/mark-paid`

**Description:** Mark a maintenance record as paid. Only `SOCIETY_ADMIN` can mark as paid.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Request Body:**
```json
{
  "notes": "Payment received via cash on 2024-12-15"  // Optional
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "month": 12,
  "year": 2024,
  "amount": 5000.0,
  "dueDate": "2024-12-31T00:00:00Z",
  "status": "PAID",
  "paidAt": "2024-12-28T10:00:00Z",
  "paidBy": "uuid",
  "notes": "Payment received via cash on 2024-12-15",
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "unit": {
    "id": "uuid",
    "buildingName": "Block A",
    "unitNumber": "A-203"
  }
}
```

**Error Responses:**
- `404 Not Found` - Maintenance record not found
- `403 Forbidden` - Only society admins can mark as paid
- `400 Bad Request` - Already marked as paid

---

## Issues API

### Create Issue
**POST** `/issues`

**Description:** Raise an issue. `RESIDENT` and `SOCIETY_ADMIN` can raise issues.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `RESIDENT`, `SOCIETY_ADMIN`, or `PLATFORM_OWNER`

**Request Body:**
```json
{
  "title": "Water leakage in bathroom",
  "description": "There is a water leakage in the bathroom sink area. It started yesterday.",
  "priority": "HIGH",  // Optional: LOW, MEDIUM, HIGH, URGENT (default: MEDIUM)
  "unitId": "uuid"  // Optional: for unit-specific issues
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "raisedBy": "uuid",
  "title": "Water leakage in bathroom",
  "description": "There is a water leakage in the bathroom sink area. It started yesterday.",
  "status": "OPEN",
  "priority": "HIGH",
  "resolutionNotes": null,
  "resolvedBy": null,
  "resolvedAt": null,
  "closedAt": null,
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "raiser": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Status Values:**
- `OPEN` - Newly created
- `IN_PROGRESS` - Being worked on
- `RESOLVED` - Issue resolved
- `CLOSED` - Issue closed

**Priority Values:**
- `LOW` - Low priority
- `MEDIUM` - Medium priority (default)
- `HIGH` - High priority
- `URGENT` - Urgent

**Error Responses:**
- `400 Bad Request` - Must belong to a society
- `404 Not Found` - Unit not found
- `403 Forbidden` - Unit does not belong to your society

---

### Get All Issues
**GET** `/issues`

**Description:** Get all issues. Filtered by role:
- `PLATFORM_OWNER`: All issues
- `SOCIETY_ADMIN`: All issues in their society
- `RESIDENT`: Only their own issues

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "societyId": "uuid",
    "unitId": "uuid",
    "raisedBy": "uuid",
    "title": "Water leakage in bathroom",
    "description": "There is a water leakage in the bathroom sink area.",
    "status": "OPEN",
    "priority": "HIGH",
    "resolutionNotes": null,
    "resolvedBy": null,
    "resolvedAt": null,
    "closedAt": null,
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "society": {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001"
    },
    "raiser": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

---

### Get Issues by Status
**GET** `/issues/by-status?status=OPEN`

**Description:** Get issues filtered by status. Only for `SOCIETY_ADMIN` and `PLATFORM_OWNER`.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Query Parameters:**
- `status` (required): `OPEN`, `IN_PROGRESS`, `RESOLVED`, or `CLOSED`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "societyId": "uuid",
    "unitId": "uuid",
    "raisedBy": "uuid",
    "title": "Water leakage in bathroom",
    "description": "There is a water leakage in the bathroom sink area.",
    "status": "OPEN",
    "priority": "HIGH",
    "resolutionNotes": null,
    "resolvedBy": null,
    "resolvedAt": null,
    "closedAt": null,
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "society": {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001"
    },
    "raiser": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

**Error Responses:**
- `403 Forbidden` - Only society admins can filter by status

---

### Get Issue by ID
**GET** `/issues/:id`

**Description:** Get a specific issue.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "raisedBy": "uuid",
  "title": "Water leakage in bathroom",
  "description": "There is a water leakage in the bathroom sink area.",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "resolutionNotes": null,
  "resolvedBy": null,
  "resolvedAt": null,
  "closedAt": null,
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "raiser": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `404 Not Found` - Issue not found
- `403 Forbidden` - You do not have access to this issue

---

### Update Issue
**PATCH** `/issues/:id`

**Description:** Update an issue.
- `RESIDENT`: Can only update priority (not status)
- `SOCIETY_ADMIN`: Can update status and add resolution notes

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "IN_PROGRESS",  // Optional: OPEN, IN_PROGRESS, RESOLVED, CLOSED
  "priority": "URGENT",  // Optional: LOW, MEDIUM, HIGH, URGENT
  "resolutionNotes": "Fixed the water leakage by replacing the pipe. Issue resolved."  // Optional, required when resolving
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "unitId": "uuid",
  "raisedBy": "uuid",
  "title": "Water leakage in bathroom",
  "description": "There is a water leakage in the bathroom sink area.",
  "status": "RESOLVED",
  "priority": "URGENT",
  "resolutionNotes": "Fixed the water leakage by replacing the pipe. Issue resolved.",
  "resolvedBy": "uuid",
  "resolvedAt": "2024-12-28T10:00:00Z",
  "closedAt": null,
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "raiser": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `404 Not Found` - Issue not found
- `403 Forbidden` - You can only update your own issues (for residents)
- `403 Forbidden` - Residents cannot change issue status
- `400 Bad Request` - Resolution notes required when resolving

---

## Announcements API

### Create Announcement
**POST** `/announcements`

**Description:** Create an announcement. Only `SOCIETY_ADMIN` can create.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Request Body:**
```json
{
  "title": "Monthly Society Meeting",
  "content": "The monthly society meeting will be held on December 20th at 6 PM in the community hall.",
  "isImportant": true,  // Optional: default false
  "expiresAt": "2024-12-31T23:59:59Z"  // Optional
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "createdBy": "uuid",
  "title": "Monthly Society Meeting",
  "content": "The monthly society meeting will be held on December 20th at 6 PM in the community hall.",
  "isImportant": true,
  "expiresAt": "2024-12-31T23:59:59Z",
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "creator": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

**Error Responses:**
- `403 Forbidden` - Only society admins can create announcements
- `403 Forbidden` - Must belong to a society

---

### Get All Announcements
**GET** `/announcements`

**Description:** Get all announcements. Filtered by role and automatically excludes expired announcements.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "societyId": "uuid",
    "createdBy": "uuid",
    "title": "Monthly Society Meeting",
    "content": "The monthly society meeting will be held on December 20th at 6 PM in the community hall.",
    "isImportant": true,
    "expiresAt": "2024-12-31T23:59:59Z",
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "society": {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001"
    },
    "creator": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
]
```

**Note:** Results are sorted by `isImportant` (desc) then `createdAt` (desc). Expired announcements are automatically filtered out.

---

### Get Announcement by ID
**GET** `/announcements/:id`

**Description:** Get a specific announcement.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "createdBy": "uuid",
  "title": "Monthly Society Meeting",
  "content": "The monthly society meeting will be held on December 20th at 6 PM in the community hall.",
  "isImportant": true,
  "expiresAt": "2024-12-31T23:59:59Z",
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "creator": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

**Error Responses:**
- `404 Not Found` - Announcement not found or expired
- `403 Forbidden` - You do not have access to this announcement

---

### Update Announcement
**PATCH** `/announcements/:id`

**Description:** Update an announcement. Only `SOCIETY_ADMIN` can update.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Request Body:**
```json
{
  "title": "Monthly Society Meeting - Updated",  // Optional
  "content": "The monthly society meeting will be held on December 20th at 6 PM in the community hall. Please note the time change.",  // Optional
  "isImportant": false,  // Optional
  "expiresAt": "2024-12-31T23:59:59Z"  // Optional
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "createdBy": "uuid",
  "title": "Monthly Society Meeting - Updated",
  "content": "The monthly society meeting will be held on December 20th at 6 PM in the community hall. Please note the time change.",
  "isImportant": false,
  "expiresAt": "2024-12-31T23:59:59Z",
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "creator": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

**Error Responses:**
- `404 Not Found` - Announcement not found
- `403 Forbidden` - Only society admins can update announcements
- `403 Forbidden` - You can only update announcements in your own society

---

### Delete Announcement
**DELETE** `/announcements/:id`

**Description:** Delete an announcement. Only `SOCIETY_ADMIN` can delete.

**Headers:** `Authorization: Bearer <token>`

**Required Role:** `SOCIETY_ADMIN` or `PLATFORM_OWNER`

**Success Response (200):**
```json
{
  "message": "Announcement deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Announcement not found
- `403 Forbidden` - Only society admins can delete announcements
- `403 Forbidden` - You can only delete announcements in your own society

---

## Societies API

### Get All Active Societies (Public)
**GET** `/societies/public`

**Description:** Get all active societies. Public endpoint for resident registration.

**No Authentication Required**

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001",
    "city": "Mumbai",
    "state": "Maharashtra",
    "societyType": "APARTMENT"
  }
]
```

**Note:** Returns only societies with status `ACTIVE`. Used for registration form dropdown.

---

### Get All Societies
**GET** `/societies`

**Description:** Get all societies. Filtered by role:
- `PLATFORM_OWNER`: All societies
- `SOCIETY_ADMIN`: Only their society
- `RESIDENT`: Only their society

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001",
    "addressLine1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "societyType": "APARTMENT",
    "createdBy": "uuid",
    "status": "ACTIVE",
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "creator": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "_count": {
      "units": 50,
      "residents": 45
    }
  }
]
```

---

### Get Society by ID
**GET** `/societies/:id`

**Description:** Get a specific society.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": "uuid",
  "name": "Green Valley Society",
  "code": "GV001",
  "addressLine1": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "societyType": "APARTMENT",
  "createdBy": "uuid",
  "status": "ACTIVE",
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "creator": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "_count": {
    "units": 50,
    "residents": 45
  }
}
```

**Error Responses:**
- `404 Not Found` - Society not found
- `403 Forbidden` - You do not have access to this society

---

## Units API

### Get Available Units for Society (Public)
**GET** `/units/available/:societyId`

**Description:** Get available units for a society (units without active residents). Public endpoint for resident registration.

**No Authentication Required**

**Path Parameters:**
- `societyId` (required) - Society UUID

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "societyId": "uuid",
    "buildingName": "Block A",
    "unitNumber": "A-203",
    "floorNumber": 2,
    "unitType": "TWO_BHK",
    "areaSqFt": 1200.5,
    "ownershipType": "OWNER",
    "status": "OCCUPIED",
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "isAvailable": true
  }
]
```

**Note:** Only returns units that don't have an active resident. Units with `PENDING_APPROVAL` residents are still considered available.

**Error Responses:**
- `404 Not Found` - Society not found

---

### Get All Units
**GET** `/units`

**Description:** Get all units. Filtered by role:
- `PLATFORM_OWNER`: All units
- `SOCIETY_ADMIN`: All units in their society
- `RESIDENT`: All units in their society

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "societyId": "uuid",
    "buildingName": "Block A",
    "unitNumber": "A-203",
    "floorNumber": 2,
    "unitType": "TWO_BHK",
    "areaSqFt": 1200.5,
    "ownershipType": "OWNER",
    "status": "OCCUPIED",
    "createdBy": "uuid",
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z",
    "society": {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001"
    },
    "creator": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "_count": {
      "residents": 1
    }
  }
]
```

---

### Get Unit by ID
**GET** `/units/:id`

**Description:** Get a specific unit.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "buildingName": "Block A",
  "unitNumber": "A-203",
  "floorNumber": 2,
  "unitType": "TWO_BHK",
  "areaSqFt": 1200.5,
  "ownershipType": "OWNER",
  "status": "OCCUPIED",
  "createdBy": "uuid",
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:00:00Z",
  "society": {
    "id": "uuid",
    "name": "Green Valley Society",
    "code": "GV001"
  },
  "creator": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@example.com"
  },
    "_count": {
      "residents": 1
    }
}
```

**Error Responses:**
- `404 Not Found` - Unit not found
- `403 Forbidden` - You do not have access to this unit

---

## Dashboard API

### Get Dashboard Statistics
**GET** `/dashboard`

**Description:** Get role-based dashboard statistics. Returns different data based on user role.

**Headers:** `Authorization: Bearer <token>`

**Success Response for RESIDENT (200):**
```json
{
  "outstandingBalance": 15000.0,
  "activeIssuesCount": 2,
  "latestAnnouncements": [
    {
      "id": "uuid",
      "title": "Monthly Society Meeting",
      "content": "Meeting on December 20th",
      "isImportant": true,
      "createdAt": "2024-12-28T10:00:00Z",
      "creator": {
        "id": "uuid",
        "name": "Admin User"
      }
    }
  ],
  "pendingDues": [
    {
      "id": "uuid",
      "month": 12,
      "year": 2024,
      "amount": 5000.0,
      "dueDate": "2024-12-31T00:00:00Z",
      "status": "DUE"
    }
  ],
  "recentPayments": [
    {
      "id": "uuid",
      "month": 11,
      "year": 2024,
      "amount": 5000.0,
      "status": "PAID",
      "paidAt": "2024-11-25T10:00:00Z"
    }
  ]
}
```

**Success Response for SOCIETY_ADMIN (200):**
```json
{
  "pendingMaintenanceDues": 250000.0,
  "pendingJoinRequestsCount": 5,
  "openIssuesCount": 8,
  "recentAnnouncements": [
    {
      "id": "uuid",
      "title": "Monthly Society Meeting",
      "content": "Meeting on December 20th",
      "isImportant": true,
      "createdAt": "2024-12-28T10:00:00Z",
      "creator": {
        "id": "uuid",
        "name": "Admin User"
      }
    }
  ],
  "totalUnits": 50,
  "totalResidents": 45
}
```

**Success Response for PLATFORM_OWNER (200):**
```json
{
  "totalSocieties": 25,
  "activeSocieties": 23,
  "inactiveSocieties": 2,
  "totalUsers": 500,
  "totalAdmins": 25,
  "totalResidents": 475,
  "totalUnits": 1200,
  "recentSocieties": [
    {
      "id": "uuid",
      "name": "Green Valley Society",
      "code": "GV001",
      "status": "ACTIVE",
      "createdAt": "2024-12-28T10:00:00Z",
      "creator": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "_count": {
        "units": 50,
        "residents": 45
      }
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Account not active

---

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message description",
  "error": "Bad Request"
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid credentials
- `403 Forbidden` - Insufficient permissions or account not active
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate entry)

### Common Error Messages

#### Authentication Errors
- `"Invalid credentials"` - Wrong email/password
- `"User not authenticated"` - Missing or invalid token
- `"Your account has been suspended. Please contact support."` - Account is SUSPENDED
- `"Your account is not active."` - Account is not ACTIVE
- `"Your account is pending approval. Please wait for admin approval."` - Account is PENDING_APPROVAL

#### Authorization Errors
- `"Insufficient permissions"` - User role doesn't have required permissions
- `"Only society admins can..."` - Action restricted to SOCIETY_ADMIN
- `"You do not have access to this..."` - User trying to access resource outside their scope
- `"You can only... in your own society"` - SOCIETY_ADMIN trying to access another society's data

#### Validation Errors
- `"Name is required"` - Missing required field
- `"Invalid email format"` - Email validation failed
- `"Invalid UUID format"` - UUID validation failed
- `"Month must be between 1 and 12"` - Invalid month value

#### Resource Errors
- `"User with this email already exists"` - Duplicate email
- `"Society not found"` - Society doesn't exist
- `"Unit not found"` - Unit doesn't exist
- `"This unit already has an active resident"` - Unit already occupied
- `"Maintenance for this month/year already exists for this unit"` - Duplicate maintenance

### Handling PENDING_APPROVAL Status

When a user with `PENDING_APPROVAL` status tries to access a protected route:

**Response:**
```json
{
  "statusCode": 403,
  "message": "Your account is pending approval. Please wait for admin approval.",
  "error": "Forbidden"
}
```

**Frontend Handling:**
1. Check user status after login
2. If status is `PENDING_APPROVAL`, show "Waiting for approval" screen
3. Poll `/residents/my-join-request` to check approval status
4. Once approved, user status becomes `ACTIVE` and they can access protected routes

---

## Best Practices

### 1. Token Management
- Store JWT token securely (e.g., httpOnly cookie or secure storage)
- Include token in all protected requests
- Handle token expiration (401 responses)

### 2. Error Handling
- Always check response status codes
- Display user-friendly error messages
- Handle network errors gracefully

### 3. Role-Based UI
- Show/hide features based on user role
- Disable actions user cannot perform
- Provide clear feedback for restricted actions

### 4. Status Management
- Check user status after login
- Handle `PENDING_APPROVAL` state appropriately
- Show appropriate UI for different account statuses

### 5. Data Filtering
- Backend automatically filters data by role
- Frontend should trust backend filtering
- Don't make assumptions about data visibility

---

## Support

For questions or issues, please contact the backend development team.

**Last Updated:** December 28, 2024

