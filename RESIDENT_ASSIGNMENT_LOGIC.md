# Resident Assignment to Unit - Complete Logic Flow

This document explains the complete logic and flow for how a resident is assigned to a unit in ResidentHub.

## 📋 Overview

The resident assignment process follows an **approval-based workflow** where:
1. Resident registers and selects a unit
2. A join request is created (status: PENDING)
3. Society Admin reviews and approves/rejects
4. Upon approval, resident becomes ACTIVE and is assigned to the unit

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    RESIDENT REGISTRATION                    │
│  POST /residents/join-request (Public - No Auth Required)   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Validation Checks                                  │
│  ✓ Email uniqueness check                                   │
│  ✓ Society exists                                           │
│  ✓ Unit exists                                              │
│  ✓ Unit belongs to the society                              │
│  ✓ Unit doesn't have an active resident                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Create User & Join Request (Transaction)           │
│  • Create User:                                             │
│    - role: RESIDENT                                         │
│    - status: PENDING_APPROVAL                              │
│    - societyId: [selected society]                         │
│    - unitId: [selected unit]                                │
│  • Create ResidentJoinRequest:                             │
│    - status: PENDING                                       │
│    - userId: [new user id]                                 │
│    - societyId: [selected society]                         │
│    - unitId: [selected unit]                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Resident Status                                    │
│  • Can LOGIN (status: PENDING_APPROVAL)                     │
│  • Cannot access protected routes                           │
│  • Sees "Waiting for approval" screen                       │
│  • Can check status via GET /residents/my-join-request     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Society Admin Review                               │
│  GET /residents/join-requests (Admin Only)                  │
│  • Sees all pending requests for their society              │
│  • Can view request details                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────┴──────────────────┐
        │                                      │
        ▼                                      ▼
┌──────────────────────┐          ┌──────────────────────┐
│   APPROVE REQUEST     │          │   REJECT REQUEST     │
│ PATCH /residents/     │          │ PATCH /residents/    │
│ join-requests/:id/    │          │ join-requests/:id/   │
│ approve               │          │ reject               │
└──────────────────────┘          └──────────────────────┘
        │                                      │
        ▼                                      ▼
┌──────────────────────┐          ┌──────────────────────┐
│ Update in Transaction│          │ Update Join Request   │
│ • JoinRequest.status │          │ • status: REJECTED   │
│   = APPROVED         │          │ • rejectionReason    │
│ • User.status         │          │ • reviewedBy         │
│   = ACTIVE           │          │ • reviewedAt         │
│ • reviewedBy         │          │                      │
│ • reviewedAt         │          │ User remains         │
│                      │          │ PENDING_APPROVAL     │
└──────────────────────┘          └──────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Resident Becomes Active                            │
│  • User.status = ACTIVE                                      │
│  • Can access all protected routes                         │
│  • Fully assigned to unit                                   │
│  • Can view maintenance, raise issues, etc.                │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Detailed Logic Breakdown

### Step 1: Registration (POST /residents/join-request)

**Endpoint:** `POST /residents/join-request` (Public - No authentication required)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "societyId": "uuid-of-society",
  "unitId": "uuid-of-unit",
  "buildingId": "Block A"  // Optional
}
```

**Validation Checks (in order):**

1. **Email Uniqueness**
   ```typescript
   // Check if user with email already exists
   if (existingUser) {
     throw ConflictException('User with this email already exists');
   }
   ```

2. **Society Exists**
   ```typescript
   // Verify society exists
   const society = await prisma.society.findUnique({
     where: { id: societyId }
   });
   if (!society) {
     throw NotFoundException('Society not found');
   }
   ```

3. **Unit Exists & Belongs to Society**
   ```typescript
   // Verify unit exists and belongs to the society
   const unit = await prisma.unit.findUnique({
     where: { id: unitId },
     include: { society: true }
   });
   if (!unit) {
     throw NotFoundException('Unit not found');
   }
   if (unit.societyId !== societyId) {
     throw BadRequestException('Unit does not belong to the specified society');
   }
   ```

4. **Unit Availability Check** ⚠️ **CRITICAL CONSTRAINT**
   ```typescript
   // Check if unit already has an ACTIVE resident
   const existingResident = await prisma.user.findFirst({
     where: {
       unitId,
       role: Role.RESIDENT,
       status: AccountStatus.ACTIVE,  // Only ACTIVE residents block assignment
     }
   });
   if (existingResident) {
     throw ConflictException('This unit already has an active resident');
   }
   ```

   **Important Notes:**
   - Only **ACTIVE** residents block unit assignment
   - **PENDING_APPROVAL** residents don't block (multiple can request same unit)
   - **REJECTED** residents don't block
   - This ensures only one active resident per unit

### Step 2: User & Join Request Creation (Transaction)

**Why Transaction?** Both user and join request must be created together atomically.

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create User
  const user = await tx.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: Role.RESIDENT,              // Fixed role
      status: AccountStatus.PENDING_APPROVAL,  // Initial status
      societyId,                         // Assigned immediately
      unitId,                            // Assigned immediately
    }
  });

  // 2. Create Join Request
  const joinRequest = await tx.residentJoinRequest.create({
    data: {
      userId: user.id,                   // Link to user
      societyId,                         // Same society
      unitId,                            // Same unit
      status: JoinRequestStatus.PENDING, // Initial status
    }
  });

  return { user, joinRequest };
});
```

**Key Points:**
- User is **immediately linked** to `societyId` and `unitId` (even in PENDING_APPROVAL)
- This allows the system to know which unit the resident is requesting
- User cannot access protected routes until status becomes ACTIVE

### Step 3: PENDING_APPROVAL State

**What Resident Can Do:**
- ✅ Login (can authenticate)
- ✅ Check join request status: `GET /residents/my-join-request`
- ❌ Access protected routes (blocked by AccountStatusGuard)
- ❌ View dashboard, maintenance, issues, etc.

**Frontend Behavior:**
```typescript
// After login, check status
if (user.status === 'PENDING_APPROVAL') {
  // Show "Waiting for approval" screen
  // Poll /residents/my-join-request every 30 seconds
  // Once approved, auto-redirect to dashboard
}
```

### Step 4: Admin Review

**Admin Endpoints:**
- `GET /residents/join-requests` - List all pending requests
- `GET /residents/join-requests/:id` - View specific request
- `PATCH /residents/join-requests/:id/approve` - Approve request
- `PATCH /residents/join-requests/:id/reject` - Reject request

**Access Control:**
- Only `SOCIETY_ADMIN` or `PLATFORM_OWNER` can review
- `SOCIETY_ADMIN` can only see requests for their own society
- `PLATFORM_OWNER` can see all requests

### Step 5: Approval Process

**When Admin Approves:**

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update Join Request
  await tx.residentJoinRequest.update({
    where: { id: requestId },
    data: {
      status: JoinRequestStatus.APPROVED,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    }
  });

  // 2. Activate User
  await tx.user.update({
    where: { id: joinRequest.userId },
    data: {
      status: AccountStatus.ACTIVE,  // ✅ Now ACTIVE
    }
  });
});
```

**What Happens:**
- ✅ User status changes to `ACTIVE`
- ✅ User can now access all protected routes
- ✅ User is fully assigned to the unit
- ✅ User can view maintenance, raise issues, etc.
- ✅ Join request status becomes `APPROVED`

### Step 6: Rejection Process

**When Admin Rejects:**

```typescript
await tx.residentJoinRequest.update({
  where: { id: requestId },
  data: {
    status: JoinRequestStatus.REJECTED,
    rejectionReason: "Invalid documents provided",  // Optional
    reviewedBy: adminUserId,
    reviewedAt: new Date(),
  }
});
// User status remains PENDING_APPROVAL
```

**What Happens:**
- ❌ User status remains `PENDING_APPROVAL`
- ❌ User still cannot access protected routes
- ❌ Join request status becomes `REJECTED`
- ✅ Unit becomes available again (can be requested by others)
- ℹ️ Rejection reason is stored for reference

## 🗄️ Database Schema Relationships

```
User
├── id (UUID)
├── role: RESIDENT
├── status: PENDING_APPROVAL → ACTIVE (on approval)
├── societyId: [linked immediately]
└── unitId: [linked immediately]
    │
    └── One-to-One ──→ ResidentJoinRequest
                       ├── userId (unique)
                       ├── societyId
                       ├── unitId
                       ├── status: PENDING → APPROVED/REJECTED
                       ├── reviewedBy
                       └── reviewedAt

Unit
├── id (UUID)
├── societyId
└── residents: User[] (one-to-many)
    └── Only ACTIVE residents are considered "assigned"
```

## 🔒 Business Rules & Constraints

### 1. One Active Resident Per Unit
- **Rule**: Only one user with `role=RESIDENT` and `status=ACTIVE` can be assigned to a unit
- **Enforcement**: Checked during registration
- **Exception**: Multiple `PENDING_APPROVAL` residents can request the same unit
- **Rationale**: Prevents duplicate assignments, ensures data integrity

### 2. Immediate Unit Assignment
- **Rule**: User is linked to `unitId` immediately upon registration
- **Purpose**: Allows system to track which unit is being requested
- **Note**: User cannot access unit data until `ACTIVE`

### 3. Approval Required
- **Rule**: All residents must be approved by `SOCIETY_ADMIN`
- **Exception**: `PLATFORM_OWNER` can also approve
- **Rationale**: Ensures only legitimate residents are added

### 4. Status-Based Access
- **PENDING_APPROVAL**: Can login, cannot access protected routes
- **ACTIVE**: Full access to all features
- **SUSPENDED**: Cannot login

## 📊 State Transitions

### User Status Flow
```
PENDING_APPROVAL ──[Admin Approves]──> ACTIVE
     │
     └──[Admin Rejects]──> PENDING_APPROVAL (remains)
     
ACTIVE ──[Admin Suspends]──> SUSPENDED
```

### Join Request Status Flow
```
PENDING ──[Admin Approves]──> APPROVED
   │
   └──[Admin Rejects]──> REJECTED
```

## 🎯 Frontend Implementation Guide

### Registration Flow

**Step 1: Load Societies (Public)**
```typescript
// GET /societies/public - Get all active societies
const { data: societies } = useQuery({
  queryKey: ['societies', 'public'],
  queryFn: () => api.get('/societies/public'),
});

// Display societies in dropdown/select
```

**Step 2: Load Available Units (Public)**
```typescript
// GET /units/available/:societyId - Get available units for selected society
const { data: availableUnits } = useQuery({
  queryKey: ['units', 'available', selectedSocietyId],
  queryFn: () => api.get(`/units/available/${selectedSocietyId}`),
  enabled: !!selectedSocietyId, // Only fetch when society is selected
});

// Display only available units (no active resident)
// Show: buildingName, unitNumber, unitType, etc.
```

**Step 3: Submit Registration**
```typescript
// 1. User selects society, building, unit
const handleRegister = async (data) => {
  try {
    const response = await api.post('/residents/join-request', {
      name: data.name,
      email: data.email,
      password: data.password,
      societyId: selectedSociety.id,
      unitId: selectedUnit.id,
    });
    
    // 2. Show success message
    toast.success('Registration successful! Waiting for admin approval.');
    
    // 3. Auto-login user
    await login(data.email, data.password);
    
    // 4. Redirect to approval pending screen
    navigate('/approval-pending');
  } catch (error) {
    // Handle errors (email exists, unit occupied, etc.)
  }
};
```

**Complete Registration Form Flow:**
```
1. User visits /signup/resident
2. Form loads societies from GET /societies/public
3. User selects a society
4. Form loads available units from GET /units/available/:societyId
5. User selects a unit (only available units shown)
6. User fills name, email, password
7. Submit → POST /residents/join-request
8. Success → Auto-login → Redirect to /approval-pending
```

### Approval Pending Screen
```typescript
// Poll for status updates
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await api.get('/residents/my-join-request');
    
    if (response.data.status === 'APPROVED') {
      // Refresh user data
      await refetchUser();
      
      // Check if status is now ACTIVE
      if (user.status === 'ACTIVE') {
        navigate('/dashboard');
      }
    } else if (response.data.status === 'REJECTED') {
      // Show rejection message
      setRejectionReason(response.data.rejectionReason);
    }
  }, 30000); // Poll every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

### Admin Approval Flow
```typescript
const handleApprove = async (requestId: string) => {
  try {
    await api.patch(`/residents/join-requests/${requestId}/approve`);
    toast.success('Resident approved successfully');
    refetch(); // Refresh list
  } catch (error) {
    toast.error('Failed to approve resident');
  }
};

const handleReject = async (requestId: string, reason?: string) => {
  try {
    await api.patch(`/residents/join-requests/${requestId}/reject`, {
      rejectionReason: reason,
    });
    toast.success('Resident request rejected');
    refetch();
  } catch (error) {
    toast.error('Failed to reject request');
  }
};
```

## ⚠️ Important Considerations

### 1. Unit Selection UI

**Public Endpoints for Registration:**
- `GET /societies/public` - Get all active societies (no auth required)
- `GET /units/available/:societyId` - Get available units for a society (no auth required)

**Implementation:**
- Show only available units (no active resident) using `/units/available/:societyId`
- Filter units by selected society
- Display unit details: buildingName, unitNumber, unitType, floorNumber
- Show "No available units" message if all units are occupied

### 2. Error Handling
- **409 Conflict**: Email exists → Show "Email already registered"
- **409 Conflict**: Unit occupied → Show "Unit already has an active resident"
- **404 Not Found**: Society/Unit not found → Show "Invalid selection"
- **400 Bad Request**: Unit doesn't belong to society → Show "Invalid unit selection"

### 3. Edge Cases
- **Multiple Pending Requests**: Multiple users can request same unit, but only first approval wins
- **Rejected User Re-applying**: Rejected user can create new request (old one remains REJECTED)
- **Unit Vacancy**: When resident is suspended/deleted, unit becomes available

### 4. Data Integrity
- Use database transactions for atomic operations
- Ensure foreign key constraints are in place
- Validate all relationships before assignment

## 🔄 Alternative Flows (Future Enhancements)

### Direct Assignment (Admin Creates Resident)
Currently not implemented, but could be added:
```typescript
// Admin directly creates resident (no approval needed)
POST /residents
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password",
  "societyId": "uuid",
  "unitId": "uuid"
}
// User created with status: ACTIVE immediately
```

### Bulk Import
For future: Allow admin to import multiple residents via CSV/Excel

## 📝 Summary

**Key Points:**
1. ✅ Resident registration is **public** (no auth required)
2. ✅ User is **immediately linked** to society and unit (even in PENDING_APPROVAL)
3. ✅ Only **one ACTIVE resident** per unit (enforced)
4. ✅ **Approval required** from Society Admin
5. ✅ Status changes from `PENDING_APPROVAL` → `ACTIVE` on approval
6. ✅ Transaction ensures data consistency
7. ✅ Rejection doesn't remove user, just marks request as REJECTED

This workflow ensures data integrity, prevents duplicate assignments, and maintains proper access control throughout the resident onboarding process.

