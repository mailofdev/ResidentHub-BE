# Frontend Integration Guide - Resident Registration & Unit Selection

This guide explains how to integrate the resident registration flow with unit selection in your frontend application.

## 📋 Overview

The resident registration process involves:
1. **Selecting a Society** - From list of active societies
2. **Selecting a Unit** - From available units in that society
3. **Submitting Registration** - Creating join request
4. **Waiting for Approval** - Polling for status updates

## 🔌 New Public Endpoints

### 1. Get Active Societies (Public)
**GET** `/societies/public`

**Purpose:** Load societies for registration form dropdown

**No Authentication Required**

**Response:**
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

### 2. Get Available Units (Public)
**GET** `/units/available/:societyId`

**Purpose:** Load available units (no active resident) for selected society

**No Authentication Required**

**Path Parameter:** `societyId` (UUID)

**Response:**
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
    "isAvailable": true,
    "createdAt": "2024-12-28T10:00:00Z",
    "updatedAt": "2024-12-28T10:00:00Z"
  }
]
```

**Important:** Only returns units that don't have an active resident. Units with pending approval residents are still available.

## 🎯 Implementation Guide

### Step 1: Registration Form Setup

#### Using React Query (Recommended)

```typescript
// hooks/useRegistrationData.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const useSocieties = () => {
  return useQuery({
    queryKey: ['societies', 'public'],
    queryFn: async () => {
      const response = await api.get('/societies/public');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAvailableUnits = (societyId: string | null) => {
  return useQuery({
    queryKey: ['units', 'available', societyId],
    queryFn: async () => {
      if (!societyId) return [];
      const response = await api.get(`/units/available/${societyId}`);
      return response.data;
    },
    enabled: !!societyId, // Only fetch when society is selected
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

#### Using Redux (Alternative)

```typescript
// store/slices/registrationSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchSocieties = createAsyncThunk(
  'registration/fetchSocieties',
  async () => {
    const response = await api.get('/societies/public');
    return response.data;
  }
);

export const fetchAvailableUnits = createAsyncThunk(
  'registration/fetchAvailableUnits',
  async (societyId: string) => {
    const response = await api.get(`/units/available/${societyId}`);
    return response.data;
  }
);

const registrationSlice = createSlice({
  name: 'registration',
  initialState: {
    societies: [],
    availableUnits: [],
    selectedSociety: null,
    selectedUnit: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedSociety: (state, action) => {
      state.selectedSociety = action.payload;
      state.selectedUnit = null; // Reset unit when society changes
      state.availableUnits = []; // Clear units
    },
    setSelectedUnit: (state, action) => {
      state.selectedUnit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocieties.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSocieties.fulfilled, (state, action) => {
        state.societies = action.payload;
        state.loading = false;
      })
      .addCase(fetchAvailableUnits.fulfilled, (state, action) => {
        state.availableUnits = action.payload;
      });
  },
});

export const { setSelectedSociety, setSelectedUnit } = registrationSlice.actions;
export default registrationSlice.reducer;
```

### Step 2: Registration Form Component

```typescript
// components/ResidentRegistrationForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSocieties, useAvailableUnits } from '../hooks/useRegistrationData';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  societyId: z.string().uuid('Please select a society'),
  unitId: z.string().uuid('Please select a unit'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const ResidentRegistrationForm = () => {
  const navigate = useNavigate();
  const [selectedSocietyId, setSelectedSocietyId] = useState<string | null>(null);
  
  const { data: societies, isLoading: societiesLoading } = useSocieties();
  const { data: availableUnits, isLoading: unitsLoading } = useAvailableUnits(selectedSocietyId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const selectedUnitId = watch('unitId');

  const handleSocietyChange = (societyId: string) => {
    setSelectedSocietyId(societyId);
    setValue('societyId', societyId);
    setValue('unitId', ''); // Reset unit selection
  };

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      // Submit registration
      const response = await api.post('/residents/join-request', {
        name: data.name,
        email: data.email,
        password: data.password,
        societyId: data.societyId,
        unitId: data.unitId,
      });

      // Auto-login after registration
      const loginResponse = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      // Store token
      localStorage.setItem('token', loginResponse.data.accessToken);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(loginResponse.data.user));

      // Show success message
      alert('Registration successful! Waiting for admin approval.');

      // Redirect to approval pending page
      navigate('/approval-pending');
    } catch (error: any) {
      // Handle errors
      if (error.response?.status === 409) {
        if (error.response.data.message.includes('email')) {
          alert('Email already registered. Please use a different email.');
        } else if (error.response.data.message.includes('active resident')) {
          alert('This unit already has an active resident. Please select another unit.');
        }
      } else if (error.response?.status === 404) {
        alert('Society or unit not found. Please refresh and try again.');
      } else {
        alert('Registration failed. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Full Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className="mt-1 block w-full rounded-md border-gray-300"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="mt-1 block w-full rounded-md border-gray-300"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="mt-1 block w-full rounded-md border-gray-300"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Society Selection */}
      <div>
        <label htmlFor="society" className="block text-sm font-medium">
          Select Society
        </label>
        <select
          id="society"
          disabled={societiesLoading}
          onChange={(e) => handleSocietyChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="">-- Select Society --</option>
          {societies?.map((society) => (
            <option key={society.id} value={society.id}>
              {society.name} ({society.code}) - {society.city}, {society.state}
            </option>
          ))}
        </select>
        {errors.societyId && (
          <p className="mt-1 text-sm text-red-600">{errors.societyId.message}</p>
        )}
        <input type="hidden" {...register('societyId')} />
      </div>

      {/* Unit Selection */}
      <div>
        <label htmlFor="unit" className="block text-sm font-medium">
          Select Unit
        </label>
        <select
          id="unit"
          disabled={!selectedSocietyId || unitsLoading}
          {...register('unitId')}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="">
            {!selectedSocietyId
              ? '-- Select Society First --'
              : unitsLoading
              ? 'Loading units...'
              : availableUnits?.length === 0
              ? 'No available units'
              : '-- Select Unit --'}
          </option>
          {availableUnits?.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.buildingName} - {unit.unitNumber} ({unit.unitType}) - Floor {unit.floorNumber}
            </option>
          ))}
        </select>
        {errors.unitId && (
          <p className="mt-1 text-sm text-red-600">{errors.unitId.message}</p>
        )}
        {selectedSocietyId && availableUnits?.length === 0 && !unitsLoading && (
          <p className="mt-1 text-sm text-yellow-600">
            No available units in this society. Please contact the admin.
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};
```

### Step 3: Approval Pending Screen

```typescript
// pages/ApprovalPending.tsx
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ApprovalPending = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Poll for join request status
  const { data: joinRequest } = useQuery({
    queryKey: ['join-request', 'my'],
    queryFn: async () => {
      const response = await api.get('/residents/my-join-request');
      return response.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    enabled: user?.status === 'PENDING_APPROVAL',
  });

  // Check if user status changed
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await api.get('/auth/me');
        const updatedUser = response.data;
        
        if (updatedUser.status === 'ACTIVE') {
          setUser(updatedUser);
          navigate('/dashboard');
        } else if (updatedUser.status === 'SUSPENDED') {
          navigate('/suspended');
        }
      } catch (error) {
        console.error('Failed to check user status:', error);
      }
    };

    // Check immediately and then every 30 seconds
    checkUserStatus();
    const interval = setInterval(checkUserStatus, 30000);

    return () => clearInterval(interval);
  }, [navigate, setUser]);

  // Handle rejection
  useEffect(() => {
    if (joinRequest?.status === 'REJECTED') {
      setRejectionReason(joinRequest.rejectionReason || 'No reason provided');
    }
  }, [joinRequest]);

  if (joinRequest?.status === 'REJECTED') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Registration Rejected</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your registration request has been rejected.
            </p>
            {rejectionReason && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  <strong>Reason:</strong> {rejectionReason}
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/signup/resident')}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Register Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <h2 className="text-xl font-semibold text-gray-900">Waiting for Approval</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your registration request is pending admin approval.
          </p>
          {joinRequest && (
            <div className="mt-4 rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Society:</strong> {joinRequest.society?.name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Unit:</strong> {joinRequest.unit?.buildingName} - {joinRequest.unit?.unitNumber}
              </p>
              <p className="mt-2 text-xs text-blue-600">
                Request submitted on {new Date(joinRequest.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-500">
            We'll notify you once your request is reviewed. This page will automatically update.
          </p>
        </div>
      </div>
    </div>
  );
};
```

## 🔄 Complete Registration Flow

```
┌─────────────────────────────────────┐
│  1. User visits /signup/resident    │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  2. Load Societies                  │
│     GET /societies/public           │
│     (No auth required)              │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  3. User selects Society            │
│     → Set selectedSocietyId         │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  4. Load Available Units            │
│     GET /units/available/:societyId  │
│     (No auth required)              │
│     (Only when society selected)    │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  5. User selects Unit               │
│     → Set selectedUnitId            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  6. User fills form & submits       │
│     POST /residents/join-request    │
│     { name, email, password,        │
│       societyId, unitId }           │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  7. Auto-login                      │
│     POST /auth/login                │
│     → Store token & user            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  8. Redirect to /approval-pending   │
│     → Show waiting screen           │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  9. Poll for status                 │
│     GET /residents/my-join-request  │
│     (Every 30 seconds)              │
└─────────────────────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
┌─────────────┐ ┌─────────────┐
│  APPROVED   │ │  REJECTED   │
│  → ACTIVE   │ │  → Show     │
│  → Dashboard│ │    reason   │
└─────────────┘ └─────────────┘
```

## 🎨 UI/UX Best Practices

### 1. Society Selection
- Show loading state while fetching societies
- Display society name, code, city, and state
- Group by city/state if many societies
- Add search/filter functionality for large lists

### 2. Unit Selection
- Disable unit dropdown until society is selected
- Show loading state: "Loading units..."
- Show empty state: "No available units"
- Display unit details: Building, Unit Number, Type, Floor
- Group units by building name
- Add search/filter for large lists

### 3. Form Validation
- Validate on blur for better UX
- Show inline error messages
- Disable submit button when form is invalid
- Show success/error toasts

### 4. Approval Pending Screen
- Show clear waiting message
- Display society and unit info
- Show submission date
- Auto-refresh status (polling)
- Handle rejection gracefully
- Provide option to re-register if rejected

## ⚠️ Error Handling

### Common Errors

#### 1. Email Already Exists (409)
```typescript
if (error.response?.status === 409 && 
    error.response.data.message.includes('email')) {
  // Show: "Email already registered. Please use a different email."
}
```

#### 2. Unit Already Occupied (409)
```typescript
if (error.response?.status === 409 && 
    error.response.data.message.includes('active resident')) {
  // Show: "This unit already has an active resident. Please select another unit."
  // Refresh available units list
  queryClient.invalidateQueries(['units', 'available', societyId]);
}
```

#### 3. Society/Unit Not Found (404)
```typescript
if (error.response?.status === 404) {
  // Show: "Society or unit not found. Please refresh and try again."
  // Reload form data
}
```

#### 4. Network Errors
```typescript
if (!error.response) {
  // Show: "Network error. Please check your connection and try again."
}
```

## 🔐 State Management

### Recommended Approach

**Server State (React Query):**
- Societies list
- Available units list
- Join request status

**Client State (Zustand/Redux):**
- Selected society
- Selected unit
- Form data
- User authentication state

### Example Store Structure

```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

// store/registrationStore.ts
interface RegistrationState {
  selectedSociety: Society | null;
  selectedUnit: Unit | null;
  setSelectedSociety: (society: Society | null) => void;
  setSelectedUnit: (unit: Unit | null) => void;
  reset: () => void;
}
```

## 📱 Mobile Considerations

### Responsive Design
- Use full-width selects on mobile
- Stack form fields vertically
- Large touch targets (min 44x44px)
- Show keyboard-appropriate input types

### Performance
- Debounce society selection (if using search)
- Lazy load units (only when society selected)
- Cache societies list (5 minutes)
- Cache units list (2 minutes)

## 🧪 Testing Checklist

- [ ] Societies load correctly
- [ ] Units load when society is selected
- [ ] Unit dropdown is disabled until society selected
- [ ] Form validation works
- [ ] Registration submission works
- [ ] Error messages display correctly
- [ ] Auto-login after registration
- [ ] Approval pending screen shows
- [ ] Status polling works
- [ ] Auto-redirect on approval
- [ ] Rejection handling works
- [ ] Mobile responsive

## 📝 TypeScript Types

```typescript
// types/registration.types.ts
export interface Society {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  societyType: 'APARTMENT' | 'VILLA' | 'ROW_HOUSE';
}

export interface AvailableUnit {
  id: string;
  societyId: string;
  buildingName: string;
  unitNumber: string;
  floorNumber: number | null;
  unitType: 'ONE_BHK' | 'TWO_BHK' | 'THREE_BHK' | 'FOUR_BHK' | 'VILLA';
  areaSqFt: number | null;
  ownershipType: 'OWNER' | 'TENANT';
  status: 'OCCUPIED' | 'VACANT';
  isAvailable: true;
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  societyId: string;
  unitId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  society: {
    id: string;
    name: string;
    code: string;
  };
  unit: {
    id: string;
    buildingName: string;
    unitNumber: string;
  };
}

export interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  societyId: string;
  unitId: string;
}
```

## 🚀 Quick Start Example

```typescript
// Complete example component
import { ResidentRegistrationForm } from './components/ResidentRegistrationForm';

function SignupResidentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-2xl font-bold">Resident Registration</h1>
          <ResidentRegistrationForm />
        </div>
      </div>
    </div>
  );
}

export default SignupResidentPage;
```

## 📚 Additional Resources

- **API Documentation**: See `API_DOCUMENTATION.md` for complete API reference
- **Backend Logic**: See `RESIDENT_ASSIGNMENT_LOGIC.md` for detailed flow explanation
- **Frontend Prompt**: See `FRONTEND_DEVELOPMENT_PROMPT.md` for overall frontend guidelines

## ❓ Common Questions

### Q: What if no units are available?
**A:** Show a message: "No available units in this society. Please contact the admin." Disable the submit button.

### Q: Can multiple residents request the same unit?
**A:** Yes, but only the first approval will succeed. Others will be rejected when admin tries to approve.

### Q: How long should we poll for status?
**A:** Poll every 30 seconds. Stop polling if status is APPROVED or REJECTED.

### Q: What if user closes the approval pending page?
**A:** On next login, check user status. If ACTIVE, redirect to dashboard. If still PENDING_APPROVAL, show approval pending screen.

### Q: Should we cache societies and units?
**A:** Yes, cache societies for 5 minutes and units for 2 minutes. Invalidate when society changes.

---

**Need Help?** Contact the backend team for API-related questions or clarifications.

