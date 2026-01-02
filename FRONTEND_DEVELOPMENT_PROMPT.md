# ResidentHub Frontend Development Prompt

## 🎯 Project Overview

You are building **ResidentHub** - a Residential Society Management System (MVP) using React with TypeScript. This is a production-ready, mobile-first Progressive Web App (PWA) that enables residential societies to digitally manage residents, maintenance billing, issues, and announcements.

## 📋 Core Requirements

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **State Management**: redux
- **Routing**: React Router v6
- **UI Library**: Bootstrap + Headless UI or Radix UI
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **PWA**: Workbox for service workers

### Design System
- **Color Palette**:
  - Primary: `#2563EB` (Blue)
  - Success: `#10B981` (Green)
  - Warning: `#F59E0B` (Amber)
  - Error: `#EF4444` (Red)
  - Text: `#111827` (Gray-900)
  - Background: `#F9FAFB` (Gray-50)
- **Typography**:
  - Title: 20-24px, font-semibold
  - Heading: 16-18px, font-medium
  - Body: 14-15px, font-normal
  - Caption: 12px, font-normal
- **Layout**: Mobile-first, card-based design
- **Spacing**: 4px base unit (Tailwind spacing scale)

## 🏗️ Architecture & Performance Requirements

### 1. Code Splitting & Lazy Loading
```typescript
// Implement route-based code splitting - example
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Issues = lazy(() => import('./pages/Issues'));

// Component-level code splitting for heavy components - example
const DataTable = lazy(() => import('./components/DataTable'));
const Chart = lazy(() => import('./components/Chart'));
```

**Requirements:**
- All routes must be lazy-loaded
- Heavy components (>50KB) must be code-split
- Use `React.Suspense` with loading fallbacks
- Implement preloading for critical routes on hover/focus

### 2. Performance Optimization

#### React Performance
- Use `React.memo` for expensive components
- Implement `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Avoid unnecessary re-renders with proper dependency arrays
- Implement virtual scrolling for long lists (react-window or react-virtual)

#### Bundle Optimization
- Tree-shake unused code
- Use dynamic imports for large libraries
- Optimize images (WebP format, lazy loading)
- Implement service worker caching strategy
- Code splitting by route and feature

#### Network Optimization
- Implement request deduplication with React Query
- Use optimistic updates for better UX
- Implement pagination for large datasets
- Use infinite scroll for lists where appropriate
- Cache API responses appropriately

### 3. State Management Strategy

```typescript
// Server State (React Query)
const { data, isLoading, error } = useQuery({
  queryKey: ['maintenance', userId],
  queryFn: () => fetchMaintenance(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Client State (Zustand)
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, token: null }),
}));
```

**Requirements:**
- Server state: React Query (automatic caching, refetching, deduplication)
- Client state: Zustand or Context API (auth, UI state)
- Avoid prop drilling - use context for deeply nested props
- Normalize API responses for efficient state updates

## 🔐 Authentication & Authorization

### Authentication Flow
1. **Login**: POST `/auth/login`
   - Store JWT token in httpOnly cookie (preferred) or secure localStorage
   - Store user data in state
   - Redirect based on role and status

2. **Account Status Handling**:
   ```typescript
   // Check user status after login
   if (user.status === 'PENDING_APPROVAL') {
     // Show approval pending screen
     // Poll /residents/my-join-request for status updates
   } else if (user.status === 'ACTIVE') {
     // Redirect to dashboard
   } else if (user.status === 'SUSPENDED') {
     // Show suspended message
   }
   ```

3. **Protected Routes**:
   ```typescript
   // Route guard component
   <ProtectedRoute
     requiredRole={['SOCIETY_ADMIN', 'PLATFORM_OWNER']}
     requiredStatus="ACTIVE"
   >
     <AdminPanel />
   </ProtectedRoute>
   ```

4. **Token Refresh**: Implement automatic token refresh before expiration
5. **Logout**: Clear token, user state, and redirect to login

### Role-Based Access Control (RBAC)
- Implement route guards for each role
- Hide/show UI elements based on user role
- Disable actions user cannot perform
- Show appropriate error messages for unauthorized actions

## 📱 Pages & Routes Structure

### Public Routes
```
/login - Login page
/signup/admin - Society Admin registration
/signup/resident - Resident registration
/forgot-password - Password reset request
/reset-password - Password reset with token
```

### Protected Routes (ACTIVE status required)
```
/dashboard - Role-based dashboard
  ├─ /dashboard/resident - Resident dashboard
  ├─ /dashboard/admin - Society Admin dashboard
  └─ /dashboard/platform - Platform Owner dashboard

/maintenance - Maintenance management
  ├─ /maintenance/list - All maintenance records
  ├─ /maintenance/create - Create maintenance (Admin only)
  ├─ /maintenance/my-dues - My dues (Resident)
  └─ /maintenance/history - Payment history (Resident)

/issues - Issue management
  ├─ /issues/list - All issues
  ├─ /issues/create - Raise issue
  └─ /issues/:id - Issue details

/announcements - Announcements
  ├─ /announcements/list - All announcements
  └─ /announcements/create - Create (Admin only)

/residents - Resident management (Admin only)
  ├─ /residents/requests - Join requests
  └─ /residents/list - All residents

/societies - Society management
  ├─ /societies/list - All societies
  ├─ /societies/create - Create society (Admin)
  └─ /societies/:id - Society details

/units - Unit management
  ├─ /units/list - All units
  ├─ /units/create - Create unit (Admin)
  └─ /units/:id - Unit details

/profile - User profile
  └─ /profile/edit - Edit profile
```

### Special Routes
```
/approval-pending - Show for PENDING_APPROVAL users
/unauthorized - Show for unauthorized access
/not-found - 404 page
```

## 🎨 Component Architecture

### Component Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── EmptyState.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   └── Layout.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── maintenance/
│   │   ├── MaintenanceCard.tsx
│   │   ├── MaintenanceList.tsx
│   │   ├── MaintenanceForm.tsx
│   │   └── PaymentStatusBadge.tsx
│   ├── issues/
│   │   ├── IssueCard.tsx
│   │   ├── IssueList.tsx
│   │   ├── IssueForm.tsx
│   │   └── IssueStatusBadge.tsx
│   └── dashboard/
│       ├── StatCard.tsx
│       ├── DashboardChart.tsx
│       └── RecentActivity.tsx
├── pages/
├── hooks/
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useDebounce.ts
│   └── useInfiniteScroll.ts
├── services/
│   ├── api.ts (Axios instance)
│   ├── auth.service.ts
│   ├── maintenance.service.ts
│   ├── issues.service.ts
│   └── dashboard.service.ts
├── store/
│   ├── authStore.ts
│   └── uiStore.ts
├── utils/
│   ├── format.ts
│   ├── validation.ts
│   └── constants.ts
└── types/
    ├── api.types.ts
    ├── user.types.ts
    └── index.ts
```

### Component Best Practices
1. **Atomic Design**: Build from atoms → molecules → organisms
2. **Composition over Configuration**: Use compound components pattern
3. **Accessibility**: All interactive elements must be keyboard accessible, ARIA labels
4. **Error Boundaries**: Wrap route components in error boundaries
5. **Loading States**: Show skeletons, not spinners for better UX
6. **Empty States**: Provide helpful empty state messages

## 🔌 API Integration

### API Configuration
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token
api.interceptors.request.use((config) => {
  const token = getToken(); // From cookie or storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      logout();
    }
    return Promise.reject(error);
  }
);
```

### React Query Setup
```typescript
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

### API Service Examples
```typescript
// services/maintenance.service.ts
export const maintenanceService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/maintenance', { params }),
  
  getMyDues: () => api.get('/maintenance/my-dues'),
  
  create: (data: CreateMaintenanceDto) =>
    api.post('/maintenance', data),
  
  markPaid: (id: string, data: MarkPaidDto) =>
    api.patch(`/maintenance/${id}/mark-paid`, data),
};

// Usage in component
const { data, isLoading } = useQuery({
  queryKey: ['maintenance', 'my-dues'],
  queryFn: maintenanceService.getMyDues,
});
```

## 📊 Dashboard Implementation

### Resident Dashboard
```typescript
// Show:
- Outstanding maintenance balance (card)
- Active issues count (card)
- Latest announcements (list)
- Pending dues (table/list)
- Recent payments (table/list)

// API: GET /dashboard
```

### Society Admin Dashboard
```typescript
// Show:
- Pending maintenance dues total (card)
- Pending join requests count (card)
- Open issues count (card)
- Total units & residents (cards)
- Recent announcements (list)

// API: GET /dashboard
```

### Platform Owner Dashboard
```typescript
// Show:
- Total societies (card)
- Active vs inactive societies (chart)
- Total users breakdown (cards)
- Total units (card)
- Recent societies (table)

// API: GET /dashboard
```

## 🎯 Key Features Implementation

### 1. Resident Registration & Approval Flow
```typescript
// Flow:
1. User fills registration form (society, building, unit selection)
2. POST /residents/join-request
3. User status: PENDING_APPROVAL
4. Show "Waiting for approval" screen
5. Poll /residents/my-join-request every 30 seconds
6. Once approved, status becomes ACTIVE
7. Auto-redirect to dashboard
```

### 2. Maintenance Management
```typescript
// Admin:
- Create maintenance: POST /maintenance
- View all: GET /maintenance
- Mark as paid: PATCH /maintenance/:id/mark-paid

// Resident:
- View dues: GET /maintenance/my-dues
- View history: GET /maintenance/my-history
```

### 3. Issue Management
```typescript
// Resident:
- Raise issue: POST /issues
- View my issues: GET /issues (auto-filtered)
- Update priority: PATCH /issues/:id

// Admin:
- View all issues: GET /issues
- Filter by status: GET /issues/by-status?status=OPEN
- Update status: PATCH /issues/:id
- Add resolution notes when resolving
```

### 4. Announcements
```typescript
// Admin:
- Create: POST /announcements
- Update: PATCH /announcements/:id
- Delete: DELETE /announcements/:id

// All:
- View: GET /announcements (auto-filtered by society)
```

## 🎨 UI/UX Guidelines

### Mobile-First Design
- Start with mobile layout (320px width)
- Use responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly buttons (min 44x44px)
- Swipe gestures for mobile interactions

### Card-Based Layout
```typescript
// Card component example
<Card>
  <Card.Header>
    <Card.Title>Maintenance Dues</Card.Title>
  </Card.Header>
  <Card.Body>
    {/* Content */}
  </Card.Body>
  <Card.Footer>
    {/* Actions */}
  </Card.Footer>
</Card>
```

### Loading States
- Use skeleton loaders, not spinners
- Show progressive loading for lists
- Optimistic updates for better perceived performance

### Error Handling
```typescript
// Error display component
<ErrorDisplay
  error={error}
  onRetry={() => refetch()}
  message="Failed to load data"
/>
```

### Form Validation
- Use React Hook Form + Zod
- Show inline validation errors
- Disable submit button when invalid
- Show success/error toasts

## 🚀 Performance Checklist

### Must Implement
- [ ] Route-based code splitting
- [ ] Component lazy loading for heavy components
- [ ] Image optimization (WebP, lazy loading)
- [ ] Service worker for offline support
- [ ] React Query for server state (caching, deduplication)
- [ ] Memoization for expensive components
- [ ] Virtual scrolling for long lists
- [ ] Debouncing for search inputs
- [ ] Request deduplication
- [ ] Optimistic updates
- [ ] Bundle size optimization (< 200KB initial load)

### Performance Targets
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- Lighthouse Score: > 90

## 📱 PWA Requirements

### Service Worker
- Cache API responses
- Cache static assets
- Offline fallback page
- Background sync for failed requests

### Manifest
```json
{
  "name": "ResidentHub",
  "short_name": "ResidentHub",
  "description": "Residential Society Management System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🧪 Testing Strategy

### Unit Tests
- Test utility functions
- Test custom hooks
- Test form validation

### Integration Tests
- Test API integration
- Test authentication flow
- Test role-based access

### E2E Tests (Optional)
- Critical user flows
- Cross-browser testing

## 📝 Code Quality

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Proper type definitions for all API responses
- Type-safe API client

### Code Style
- ESLint + Prettier
- Consistent naming conventions
- Component props interface definitions
- JSDoc comments for complex functions

### File Organization
- One component per file
- Co-locate related files
- Barrel exports (index.ts) for clean imports

## 🔒 Security Best Practices

1. **Token Storage**: Use httpOnly cookies (preferred) or secure localStorage
2. **XSS Prevention**: Sanitize user inputs, use React's built-in escaping
3. **CSRF Protection**: Include CSRF tokens in requests
4. **Input Validation**: Validate on both client and server
5. **Error Messages**: Don't expose sensitive information in errors

## 📚 API Documentation Reference

Refer to `API_DOCUMENTATION.md` for complete API reference including:
- All endpoints with request/response formats
- Error codes and messages
- Role-based access requirements
- Authentication requirements

## 🎯 Implementation Priority

### Phase 1: Core Setup
1. Project setup (Vite + React + TypeScript)
2. Routing structure
3. Authentication flow
4. API client setup
5. Basic layout components

### Phase 2: Authentication & Onboarding
1. Login/Signup pages
2. Protected routes
3. Role-based navigation
4. Approval pending flow

### Phase 3: Core Features
1. Dashboard (all roles)
2. Maintenance management
3. Issue management
4. Announcements

### Phase 4: Polish & Optimization
1. Performance optimization
2. PWA setup
3. Error handling improvements
4. Loading states
5. Responsive design refinement

## 🚨 Critical Requirements

1. **Mobile-First**: Design and develop for mobile first
2. **Performance**: Must meet performance targets
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Error Handling**: Graceful error handling throughout
5. **Loading States**: Never show blank screens
6. **Type Safety**: Full TypeScript coverage
7. **Code Quality**: Clean, maintainable, well-documented code

## 📞 Support

- API Base URL: Configure via `VITE_API_BASE_URL` environment variable
- API Documentation: See `API_DOCUMENTATION.md`
- Backend Team: Contact for API issues or clarifications

---

**Start building with these guidelines and create a production-ready, performant, and user-friendly ResidentHub application!**

