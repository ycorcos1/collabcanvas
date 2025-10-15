# CollabCanvas v1.0 - Product Requirements Document

## UI/UX Redesign & Navigation Overhaul

---

## Executive Summary

**Project**: CollabCanvas v1.0 Redesign  
**Timeline**: 2-3 weeks  
**Status**: MVP Complete → Production UI/UX  
**Focus**: Transform functional MVP into polished, production-ready collaborative design tool

### What's Changing

- Professional landing page with marketing presence
- Intuitive project management dashboard with nested routes
- Human-readable URLs (`/canvas/project-name` instead of IDs)
- Comprehensive trash and settings management
- System-aware dark mode with user preferences
- Mobile-responsive design

### What's Staying

- All existing collaborative features (cursor sync, real-time updates, presence)
- Canvas functionality (pan, zoom, shapes)
- Firebase backend architecture
- Core tech stack (React, TypeScript, Vercel)

---

## Project Context

### Current State (MVP)

✅ Real-time collaborative canvas  
✅ User authentication  
✅ Shape creation and manipulation  
✅ Multiplayer cursors and presence  
✅ State persistence  
✅ Deployed on Vercel

### Target State (v1.0)

🎯 Professional homepage  
🎯 Feature-rich dashboard with project management  
🎯 Smart routing with readable URLs  
🎯 Dark mode support  
🎯 Trash system with recovery  
🎯 User settings and preferences  
🎯 Mobile responsive

---

## User Stories

### New User

- As a new visitor, I want to see what CollabCanvas offers so I can decide to sign up
- As a new user, I want a simple sign-up process so I can start creating quickly
- As a new user, I want to see an empty state with guidance so I know what to do first

### Existing User

- As a returning user, I want to see my recent projects immediately so I can resume work
- As a power user, I want to manage all my projects in one place so I stay organized
- As a collaborator, I want shareable project URLs so I can easily invite others
- As a careful user, I want to recover deleted projects so I don't lose work accidentally
- As a user, I want dark mode so I can work comfortably at any time

---

## Technical Requirements

### Tech Stack (Unchanged)

- **Frontend**: React 18+, TypeScript, Vite
- **Routing**: React Router v6
- **Backend**: Firebase (Auth, Firestore, Realtime DB)
- **Canvas**: Konva.js with React-Konva
- **Styling**: CSS Modules or Tailwind CSS (developer choice)
- **Deployment**: Vercel

### New Dependencies

```json
{
  "react-router-dom": "^6.x",
  "date-fns": "^2.x" // for relative timestamps
}
```

### Database Schema Updates

**Projects Collection Enhancement**

```typescript
interface Project {
  id: string; // Canonical ID (Firebase doc ID)
  name: string; // Display name
  slug: string; // URL-friendly slug (NEW)
  slugHistory: string[]; // Previous slugs for redirects (NEW)
  ownerId: string;
  collaborators: string[]; // User IDs with access
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null; // Soft delete flag (NEW)
  thumbnailUrl?: string; // Canvas preview (optional)
}
```

**User Profile Enhancement**

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences: {
    darkMode: "auto" | "light" | "dark"; // NEW
    language: "en"; // Placeholder for future
  };
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}
```

---

## Feature Specifications

## 1. Homepage (`/`)

**Priority**: CRITICAL  
**Route**: Public (accessible without authentication)

### Layout

```
┌─────────────────────────────────────────────┐
│ [CollabCanvas]           [Sign In] [Sign Up] │
├─────────────────────────────────────────────┤
│                                             │
│              [Hero Animation]               │
│         Real-time collaboration             │
│          for creative teams                 │
│                                             │
│            [Get Started →]                  │
│                                             │
├─────────────────────────────────────────────┤
│          Created by Yahav Corcos            │
└─────────────────────────────────────────────┘
```

### Header (Fixed)

- Height: 60px
- Background: Translucent with backdrop blur on scroll
- Logo: "CollabCanvas" (custom wordmark, left-aligned)
- Actions: "Sign In" (secondary) + "Sign Up" (primary button)

### Hero Section

- Min height: 80vh
- Background: Subtle gradient (brand colors)
- Animation:
  - Show 2-3 cursors moving with names
  - Shapes appearing and transforming
  - Use CSS animations or Framer Motion
  - Respect `prefers-reduced-motion`
- Headline: "Real-time collaboration for creative teams"
- Subheadline: "Design together, ship faster"
- CTA: "Get Started" → Links to `/signup`

### Footer

- Height: 60px
- Content: "Created by Yahav Corcos" (centered)
- Optional: GitHub link, docs link

### Behavior

- Unauthenticated: Show homepage
- Authenticated: Redirect to `/dashboard/recent`

---

## 2. Authentication

### Sign Up (`/signup`)

**Layout**: Centered card (400px max-width, 600px max-height)

**Form Fields**:

- Display Name (required, 3-30 chars, alphanumeric + spaces)
- Email (required, valid email format)
- Password (required, min 8 chars, show/hide toggle)
- "Create Account" button (full width, primary)
- "Already have an account? Sign in" link

**Validation**:

- Real-time inline validation
- Clear error messages below fields
- Disabled submit until valid

**Success Flow**:

- Create Firebase Auth user
- Create Firestore user profile with defaults
- Redirect to `/dashboard/recent`
- Show welcome toast

**Error Handling**:

- "Email already in use" → Clear message + link to sign in
- Network error → Retry button
- Firebase errors → User-friendly translations

### Sign In (`/signin`)

**Layout**: Centered card (400px max-width)

**Form Fields**:

- Email (required)
- Password (required, show/hide toggle)
- "Remember me" checkbox
- "Sign In" button (full width, primary)
- "Don't have an account? Sign up" link
- "Forgot password?" link (can be placeholder for v1)

**Success Flow**:

- Authenticate with Firebase
- Redirect to `/dashboard/recent`

**Error Handling**:

- "Invalid credentials" → Single error message (security best practice)
- Account not found → Same message
- Too many attempts → "Too many failed attempts. Try again later."

### Shared Requirements

- Dark mode compatible
- Responsive (mobile-friendly)
- Loading states on submit (button shows spinner)
- Focus management (auto-focus first field)
- Enter key submits form

---

## 3. Dashboard (`/dashboard/*`)

**Priority**: CRITICAL  
**Authentication**: Protected (redirect to `/signin` if unauthenticated)

### Route Structure

```
/dashboard → Redirects to /dashboard/recent
  /recent     - 5 most recent projects
  /all        - All projects with pagination
  /trash      - Soft-deleted projects
  /settings   - User preferences
```

### Layout Structure

```
┌──────────┬──────────────────────────────────┐
│          │  [Create New Project +]          │
│  Logo    ├──────────────────────────────────┤
│          │                                  │
├──────────┤   [Projects Area]                │
│ Recent   │                                  │
│ All      │   [Card] [Card] [Card]           │
│ Trash    │   [Card] [Card] [Card]           │
│ Settings │                                  │
│          │                                  │
│          │                                  │
│ [Avatar] │                                  │
│  Name    │                                  │
│ Sign Out │                                  │
└──────────┴──────────────────────────────────┘
```

### Sidebar (Fixed, 240px)

**Sections**:

1. **Logo** (top)

   - "CollabCanvas" wordmark
   - Clickable → `/dashboard/recent`

2. **Create Button** (prominent)

   - Large button: "+ Create New Project"
   - Opens canvas at `/canvas/untitled`
   - Primary color, full width

3. **Navigation Links**

   - Recent (icon: clock)
   - All Projects (icon: grid)
   - Trash (icon: trash)
   - Settings (icon: gear)
   - Active state: Background highlight + bold text

4. **User Section** (bottom)
   - Avatar (circular, 40px)
   - Display name (truncate if long)
   - "Sign Out" button (secondary)

**Mobile Behavior** (<768px):

- Sidebar collapses to hamburger menu
- Overlay sidebar on open
- Close on route change

---

### Recent Projects (`/dashboard/recent`)

**Display**:

- Show 5 most recent projects (sorted by `updatedAt` DESC)
- Exclude soft-deleted projects (`deletedAt === null`)

**Empty State**:

```
[Illustration or icon]
No recent projects
Create your first canvas to get started
[Create New Project]
```

**Project Card** (Grid layout, 3 columns desktop, 2 tablet, 1 mobile):

```
┌────────────────────┐
│                    │
│   [Thumbnail]      │ ← 16:9 aspect ratio
│                    │
├────────────────────┤
│ Project Name       │ ← Truncate if >30 chars
│ Edited 2h ago      │ ← Relative timestamp
│               [···]│ ← Actions menu
└────────────────────┘
```

**Thumbnail**:

- 16:9 aspect ratio
- Canvas snapshot (use Konva `toDataURL()`)
- Fallback: Gradient with first letter of project name
- Lazy loading for performance

**Hover State**:

- Subtle elevation (`box-shadow`)
- Show quick actions overlay

**Click Behavior**:

- Click anywhere on card → Navigate to `/canvas/[slug]`

**Actions Menu (···)**:

- Open in New Tab
- Rename
- Duplicate (optional for v1)
- Move to Trash

---

### All Projects (`/dashboard/all`)

**Display**:

- Show all non-deleted projects
- Pagination: 20 projects per page
- Initial load: First 20, sorted by `updatedAt` DESC

**Controls Bar**:

```
[Search: ________] [Sort: Last Modified ▼] [View: ▦ ▤]
```

**Search**:

- Placeholder: "Search projects..."
- Debounced (300ms)
- Filters by project name (case-insensitive)
- Client-side filtering if <100 projects, else Firestore query

**Sort Options**:

- Last Modified (default)
- Name (A-Z)
- Name (Z-A)
- Date Created (newest)
- Date Created (oldest)

**View Toggle**:

- Grid (default): 3 columns desktop
- List: Single column with more details

**Pagination**:

- "Load More" button (infinite scroll optional)
- Show count: "Showing 20 of 47 projects"

**Empty State**:

```
No projects yet
Create your first canvas to get started
[Create New Project]
```

---

### Trash (`/dashboard/trash`)

**Display**:

- Show all projects where `deletedAt !== null`
- Sorted by `deletedAt` DESC (most recent deletions first)

**Layout**: List view (not grid)

```
┌─────────────────────────────────────────────┐
│ Project Name        Deleted 2 days ago      │
│ [Recover] [Delete Forever]                  │
├─────────────────────────────────────────────┤
│ Another Project     Deleted 1 week ago      │
│ [Recover] [Delete Forever]                  │
└─────────────────────────────────────────────┘
```

**Bulk Actions** (top of list):

- [Recover All] - Recovers all trashed projects (no confirmation)
- [Delete All Forever] - Requires typed confirmation

**Individual Actions**:

- **Recover**:
  - Sets `deletedAt = null`
  - Returns to All Projects
  - Shows toast: "Project recovered"
- **Delete Forever**:
  - Confirmation modal: "Are you sure? This cannot be undone."
  - Input required: Type project name to confirm
  - Permanently deletes project document + all subcollections
  - Shows toast: "Project permanently deleted"

**Delete All Forever Confirmation**:

```
┌─────────────────────────────────────────┐
│  ⚠️ Delete All Projects Forever?        │
│                                         │
│  This will permanently delete X         │
│  projects. This cannot be undone.       │
│                                         │
│  Type DELETE ALL to confirm:            │
│  [________________]                     │
│                                         │
│  [Cancel] [Delete All Forever]          │
└─────────────────────────────────────────┘
```

**Empty State**:

```
[Trash icon]
Trash is empty
Deleted projects will appear here
```

**Auto-Delete** (Optional for v1):

- Firebase Cloud Function deletes projects after 30 days
- Can be implemented post-launch

---

### Settings (`/dashboard/settings`)

**Layout**: Single column form, max-width 600px

**Sections**:

#### 1. Profile

```
┌─────────────────────────────────────┐
│ Profile                             │
├─────────────────────────────────────┤
│ [Avatar]    [Upload New Photo]      │
│                                     │
│ Display Name                        │
│ [John Doe____________]              │
│                                     │
│ Email                               │
│ john@example.com (read-only)        │
│                                     │
│ [Save Changes]                      │
└─────────────────────────────────────┘
```

**Avatar Upload** (Optional for v1):

- Click to upload
- Max 2MB, JPG/PNG
- Crop to square
- Fallback: Show initials in colored circle

**Display Name**:

- Editable text input
- 3-30 characters
- Updates in real-time for other users

**Email**:

- Read-only (Firebase Auth restriction)
- Link to change email (can be placeholder)

#### 2. Preferences

```
┌─────────────────────────────────────┐
│ Preferences                         │
├─────────────────────────────────────┤
│ Theme                               │
│ ○ Auto (system)                     │
│ ○ Light                             │
│ ○ Dark                              │
│                                     │
│ Language                            │
│ [English ▼] (disabled for v1)       │
│                                     │
│ [Save Preferences]                  │
└─────────────────────────────────────┘
```

**Theme Toggle**:

- Radio buttons (single choice)
- Auto: Follows `prefers-color-scheme`
- Light: Force light mode
- Dark: Force dark mode
- Save to localStorage + Firestore user profile
- Apply immediately (no page reload)

#### 3. Account

```
┌─────────────────────────────────────┐
│ Account                             │
├─────────────────────────────────────┤
│ [Change Password]                   │
│ [Delete Account]                    │
└─────────────────────────────────────┘
```

**Change Password**:

- Opens modal with form
- Current password (required)
- New password (min 8 chars)
- Confirm new password
- Firebase Auth password update

**Delete Account**:

- Confirmation modal with warning
- Type "DELETE" to confirm
- Deletes all user projects
- Deletes user auth + profile
- Signs out and redirects to homepage

#### 4. About

```
┌─────────────────────────────────────┐
│ About                               │
├─────────────────────────────────────┤
│ Version: 1.0.0                      │
│ [Documentation] [GitHub]            │
└─────────────────────────────────────┘
```

---

## 4. Canvas (`/canvas/[project-slug]`)

**Priority**: CRITICAL  
**Authentication**: Protected

### URL Scheme

**Pattern**: `/canvas/my-awesome-design`

**Slug Generation**:

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Multiple hyphens to single
    .replace(/^-+|-+$/g, ""); // Trim hyphens
}
```

**Conflict Resolution**:

- Check if slug exists for another project
- If conflict: Append `-2`, `-3`, etc.
- Example: `my-design` → `my-design-2` → `my-design-3`

**Renaming Flow**:

1. User renames project
2. Generate new slug
3. Add old slug to `slugHistory` array
4. Update URL to new slug (use `history.replaceState()`)
5. Set up redirect: Old slug → New slug (302 redirect)

**Redirect Logic**:

```typescript
// In Canvas component
const { projectSlug } = useParams();
const project = await getProjectBySlug(projectSlug);

if (!project) {
  // Check slug history
  const projectByOldSlug = await getProjectByOldSlug(projectSlug);
  if (projectByOldSlug) {
    navigate(`/canvas/${projectByOldSlug.slug}`, { replace: true });
  } else {
    navigate("/dashboard/recent"); // Not found
    showToast("Project not found");
  }
}
```

### Canvas Layout

**Top Bar** (Fixed, 60px height):

```
┌─────────────────────────────────────────────┐
│ [← Back] Project Name    [Share] [👤👤+3]   │
└─────────────────────────────────────────────┘
```

**Components**:

- **Back Button**: `←` icon → Navigate to `/dashboard/recent`
- **Project Name**:
  - Editable inline (click to edit, or pencil icon)
  - Auto-save on blur
  - Updates slug on save
- **Share Button**:
  - Copy link to clipboard
  - Show collaborator list (future feature)
- **User Avatars**:
  - Show first 5 online users
  - Overlap styling
  - "+3" badge if more than 5
  - Tooltip with all names

**Canvas Area**:

- Full viewport minus top bar
- All existing MVP features remain:
  - Pan and zoom
  - Shape creation
  - Shape manipulation
  - Real-time cursor sync
  - Presence indicators
  - Selection system
  - Collaborative editing

**New Canvas Behavior**:

- On mount: Check if project exists by slug
- If new (`/canvas/untitled`): Create project doc with default name
- Auto-save project name changes
- Update `updatedAt` on any canvas change

**Project Metadata Auto-Update**:

```typescript
// Update on any shape change
onShapeChange(() => {
  updateProject(projectId, {
    updatedAt: Timestamp.now(),
    thumbnailUrl: generateThumbnail(), // Optional
  });
});
```

---

## 5. Dark Mode

**Priority**: HIGH

### Implementation Strategy

**Default Behavior**:

- Check system preference: `window.matchMedia('(prefers-color-scheme: dark)')`
- If user hasn't set preference: Follow system
- If user has set preference: Use saved value

**Persistence**:

- localStorage: `darkMode` key ('auto' | 'light' | 'dark')
- Firestore: User profile `preferences.darkMode`
- Priority: localStorage (instant) → Firestore (backup/sync)

**Application Scope**:

- Global: All pages and components
- Canvas: Background, UI elements, cursors
- Syntax highlighting (if code features added later)

### Color System

**CSS Variables Approach**:

```css
/* root.css */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-elevated: #ffffff;
  --border: #e0e0e0;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --accent: #0066ff;
  --accent-hover: #0052cc;
  --danger: #dc2626;
  --success: #16a34a;
  --warning: #f59e0b;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #242424;
  --bg-elevated: #2e2e2e;
  --border: #3a3a3a;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-tertiary: #666666;
  --accent: #4d94ff;
  --accent-hover: #6ba6ff;
  --danger: #ef4444;
  --success: #22c55e;
  --warning: #fbbf24;
}
```

**Theme Application**:

```typescript
// Apply theme to <html> element
document.documentElement.setAttribute("data-theme", theme);
```

**Transition**:

```css
* {
  transition: background-color 0.3s ease, border-color 0.3s ease,
    color 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none;
  }
}
```

### Canvas Dark Mode Considerations

- Canvas background: Use theme variable
- Shape colors: Preserve user-selected colors
- Grid/guides: Subtle, theme-aware
- Selection indicators: High contrast in both modes
- Cursor labels: Dark background in light mode, light background in dark mode

---

## 6. Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  mobile: "0-767px",
  tablet: "768-1023px",
  desktop: "1024px+",
};
```

### Mobile Adaptations (<768px)

**Homepage**:

- Stack hero content vertically
- Reduce heading size
- Full-width CTA button

**Dashboard**:

- Sidebar: Collapses to hamburger menu
- Overlay sidebar (full height, 280px width)
- Close sidebar on navigation
- Project cards: Single column
- Top bar: Reduce padding

**Canvas**:

- Hide non-essential top bar items
- Reduce avatar sizes
- Touch gestures for pan/zoom
- Larger tap targets (min 44x44px)

**Forms** (Auth, Settings):

- Full width inputs
- Larger font sizes (16px minimum to prevent zoom)
- Increase touch target sizes

### Tablet Adaptations (768-1023px)

- Dashboard sidebar: Visible but narrower (200px)
- Project cards: 2-column grid
- Canvas: All features visible

---

## Design System

### Brand Colors

```css
--brand-primary: #0066ff;
--brand-secondary: #4d94ff;
--brand-dark: #0052cc;
```

### Typography

```css
/* Fonts */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;

/* Sizes */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.2);

/* Dark mode versions */
[data-theme="dark"] {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);
}
```

### Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

---

## Performance Requirements

### Metrics Targets

- **Lighthouse Performance**: >90
- **Lighthouse Accessibility**: >95
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Time to Interactive**: <3.5s
- **Cumulative Layout Shift**: <0.1
- **First Input Delay**: <100ms

### Optimization Strategies

**Code Splitting**:

```typescript
// Route-based splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Canvas = lazy(() => import("./pages/Canvas"));
const Settings = lazy(() => import("./pages/Settings"));
```

**Image Optimization**:

- Use WebP with fallbacks
- Lazy load project thumbnails
- Implement intersection observer
- Compress avatars (max 200KB)

**Bundle Size**:

- Initial JS bundle: <200KB (gzipped)
- Use tree shaking
- Analyze with `vite-bundle-visualizer`

**Render Optimization**:

```typescript
// Memoize expensive components
const ProjectCard = memo(ProjectCardComponent);

// Virtual scrolling for long lists (if >100 projects)
import { FixedSizeGrid } from "react-window";
```

**Database Queries**:

- Use Firestore indexes for sorting
- Implement pagination (20 items per page)
- Cache user profile data
- Debounce search queries (300ms)

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

- **Tab order**: Logical and predictable
- **Focus indicators**: Visible on all interactive elements
- **Shortcuts** (Future):
  - `/` → Focus search
  - `N` → New project
  - `Esc` → Close modal/menu

### Screen Reader Support

- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<button>`
- ARIA labels: All icon-only buttons
- ARIA live regions: Toast notifications, status updates
- Skip links: "Skip to main content"

### Color Contrast

- Text: Minimum 4.5:1 ratio
- UI components: Minimum 3:1 ratio
- Accent colors: Pass contrast in both light and dark modes
- Test with tools: axe DevTools, WAVE

### Forms

- All inputs have visible labels
- Error messages associated with fields (`aria-describedby`)
- Required fields marked with asterisk + `aria-required`
- Validation messages clear and specific

### Focus Management

- Modal open: Trap focus inside modal
- Modal close: Return focus to trigger element
- Route change: Focus main content (skip navigation)

---

## Error Handling & Edge Cases

### Network Errors

```typescript
// Connection lost
<ConnectionBanner>
  ⚠️ Connection lost. Changes may not be saved.
  [Retry Now]
</ConnectionBanner>

// Auto-retry with exponential backoff
retryConnection({
  maxAttempts: 5,
  delay: [1s, 2s, 4s, 8s, 16s]
});
```

### Authentication Errors

- Session expired: Redirect to sign-in with return URL
- Insufficient permissions: "You don't have access to this project"
- Account disabled: "Your account has been disabled. Contact support."

### Project Errors

- Project not found: Redirect to dashboard + toast notification
- Slug conflict: Append number automatically
- Invalid characters in name: Strip on save

### Canvas Errors

- Failed to load: Retry button with error details
- Sync failure: Show warning banner, queue changes
- Canvas too large: Warn before creating (optional)

### Form Validation

```typescript
const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : "Please enter a valid email address";
};

const validateDisplayName = (name: string) => {
  if (name.length < 3) return "Name must be at least 3 characters";
  if (name.length > 30) return "Name must be less than 30 characters";
  return null;
};
```

---

## Security Considerations

### Firebase Security Rules

**Firestore Rules** (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Projects
    match /projects/{projectId} {
      allow read: if request.auth != null &&
        (resource.data.ownerId == request.auth.uid ||
         request.auth.uid in resource.data.collaborators);

      allow create: if request.auth != null &&
        request.resource.data.ownerId == request.auth.uid;

      allow update: if request.auth != null &&
        (resource.data.ownerId == request.auth.uid ||
         request.auth.uid in resource.data.collaborators);

      allow delete: if request.auth != null &&
        resource.data.ownerId == request.auth.uid;

      // Shapes subcollection
      match /shapes/{shapeId} {
        allow read, write: if request.auth != null &&
          (get(/databases/$(database)/documents/projects/$(projectId)).data.ownerId == request.auth.uid ||
           request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.collaborators);
      }
    }
  }
}
```

**Realtime Database Rules** (`database.rules.json`):

```json
{
  "rules": {
    "cursors": {
      "$canvasId": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    },
    "presence": {
      "$canvasId": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    }
  }
}
```

### Input Sanitization

- Escape HTML in user-generated content (project names, display names)
- Validate file uploads (avatars, thumbnails)
- Limit string lengths in database writes
- Prevent XSS in project names displayed in URLs

### Rate Limiting (Optional for v1)

- Limit project creation: 10 per hour per user
- Limit password reset attempts: 3 per hour per email
- Implement with Firebase Cloud Functions

---

## Testing Strategy

### Unit Tests

- Utility functions (slug generation, validation)
- React hooks (useCanvas, useShapes, useCursors)
- Form validation logic

### Integration Tests

- Authentication flow (sign up, sign in, sign out)
- Project CRUD operations
- Routing and navigation
- Dark mode toggle

### End-to-End Tests (Playwright or Cypress)

```typescript
// Critical user flows
test("Complete user journey", async () => {
  // Sign up
  await signUp("test@example.com", "password123", "Test User");

  // Create project
  await clickButton("Create New Project");
  await expect(page).toHaveURL(/\/canvas\/untitled/);

  // Rename project
  await renameProject("My First Design");
  await expect(page).toHaveURL(/\/canvas\/my-first-design/);

  // Return to dashboard
  await clickButton("Back");
  await expect(page).toHaveURL("/dashboard/recent");

  // Verify project appears
  await expect(page.locator("text=My First Design")).toBeVisible();

  // Move to trash
  await moveToTrash("My First Design");
  await navigateToTrash();
  await expect(page.locator("text=My First Design")).toBeVisible();

  // Recover
  await clickButton("Recover");
  await navigateToRecent();
  await expect(page.locator("text=My First Design")).toBeVisible();
});
```

### Manual Testing Checklist

- [ ] Homepage loads and animations play
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Create new project from dashboard
- [ ] Rename project and verify URL updates
- [ ] Navigate between dashboard sections
- [ ] Move project to trash
- [ ] Recover project from trash
- [ ] Delete project permanently
- [ ] Toggle dark mode and verify persistence
- [ ] Test on mobile device
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Test slow 3G network

---

## Migration Plan

### Phase 1: Database Schema Migration

**Objective**: Add new fields to existing projects

```typescript
// Migration script (run once)
async function migrateProjects() {
  const projectsRef = collection(db, "projects");
  const snapshot = await getDocs(projectsRef);

  const batch = writeBatch(db);

  for (const doc of snapshot.docs) {
    const project = doc.data();
    const slug = generateSlug(project.name);
    const uniqueSlug = await getUniqueSlug(slug, doc.id);

    batch.update(doc.ref, {
      slug: uniqueSlug,
      slugHistory: [],
      deletedAt: null, // Explicitly set for soft delete
    });
  }

  await batch.commit();
  console.log(`Migrated ${snapshot.size} projects`);
}
```

**Rollout**:

1. Deploy migration script to Cloud Functions
2. Run migration (estimated: 1-2 seconds per 100 projects)
3. Verify all projects have slugs
4. Deploy new frontend code

### Phase 2: URL Redirect Support

**Objective**: Support old URLs during transition

```typescript
// Temporary redirect support (remove after 30 days)
function CanvasRoute() {
  const { projectSlug } = useParams();
  const [searchParams] = useSearchParams();
  const legacyId = searchParams.get("id");

  // Support old URL: /canvas?id=abc123
  if (legacyId && !projectSlug) {
    const project = await getProjectById(legacyId);
    if (project) {
      return <Navigate to={`/canvas/${project.slug}`} replace />;
    }
  }

  // Normal flow
  return <Canvas />;
}
```

### Phase 3: User Communication

**In-App Announcement** (dismiss-able banner):

```
🎉 New Feature: Shareable Project URLs!
Your projects now have easy-to-share links like
/canvas/my-awesome-design
[Learn More] [Dismiss]
```

**Email** (optional, if user base exists):

- Subject: "New shareable project URLs in CollabCanvas"
- Body: Explain new feature, benefits, no action required

---

## Launch Checklist

### Pre-Launch (1 week before)

- [ ] All features implemented and tested
- [ ] Database migration completed
- [ ] Performance audit passed (Lighthouse >90)
- [ ] Accessibility audit passed (axe DevTools)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS Safari, Chrome Android)
- [ ] Security rules deployed and tested
- [ ] Error tracking configured (Sentry optional)
- [ ] Analytics configured (Google Analytics optional)

### Launch Day

- [ ] Deploy to production
- [ ] Smoke test critical flows
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Announce on social media (optional)
- [ ] Update documentation

### Post-Launch (1 week after)

- [ ] Gather user feedback
- [ ] Monitor support requests
- [ ] Fix critical bugs (hotfix if needed)
- [ ] Analyze usage metrics
- [ ] Plan v1.1 features

---

## Success Metrics

### Primary KPIs

1. **User Activation**: % of new users who create first project (Target: >80%)
2. **Retention**: % of users who return within 7 days (Target: >40%)
3. **Project Creation**: Average projects per active user (Target: >3)
4. **Collaboration**: % of projects with >1 collaborator (Target: >20%)

### Technical Metrics

1. **Performance**: Lighthouse score (Target: >90)
2. **Uptime**: Service availability (Target: >99.5%)
3. **Error Rate**: JS errors per session (Target: <0.1%)
4. **Load Time**: Average page load (Target: <2s)

### User Satisfaction

1. **Net Promoter Score**: (Target: >40)
2. **Feature Adoption**: % using dark mode, trash recovery
3. **Support Tickets**: Issues per 100 users (Target: <5)

---

## Known Limitations

### Accepted for v1.0

- Single canvas per project (no pages/artboards)
- Basic shape types only (from MVP)
- No advanced permissions (owner only, collaborators in v1.1)
- No real-time comments/chat
- No version history
- No offline mode
- Desktop-focused (mobile is functional but not optimized)
- English only

### Future Roadmap

**v1.1 (1 month after v1.0)**

- [ ] Advanced shape tools (polygons, lines, arrows)
- [ ] Color picker UI
- [ ] Shape resize and rotate
- [ ] Layer management (z-index control)
- [ ] Keyboard shortcuts

**v1.2 (2 months after v1.0)**

- [ ] Team permissions (owner/editor/viewer)
- [ ] Project templates
- [ ] Duplicate project
- [ ] Export to PNG/SVG
- [ ] Project search and tags

**v1.3 (3 months after v1.0)**

- [ ] Comments and mentions
- [ ] Version history
- [ ] Advanced grid and guides
- [ ] Snap-to-grid
- [ ] Component library

**v2.0 (6 months after v1.0)**

- [ ] Multiple pages per project
- [ ] Component system (reusable elements)
- [ ] Design tokens
- [ ] Developer handoff
- [ ] API access

---

## Risk Assessment

### High Risk

**Risk**: Real-time sync breaks with new routing  
**Mitigation**: Thorough testing with multiple users, maintain existing Firebase listeners, no changes to sync logic

**Risk**: Slug conflicts cause data loss  
**Mitigation**: Unique constraint with automatic numbering, maintain canonical IDs, comprehensive testing

**Risk**: Migration fails for existing projects  
**Mitigation**: Dry-run migration script, backup database, rollback plan, gradual rollout

### Medium Risk

**Risk**: Performance degrades with dashboard features  
**Mitigation**: Lazy loading, pagination, virtual scrolling for large lists, performance monitoring

**Risk**: Dark mode causes visual bugs  
**Mitigation**: Comprehensive theming system, test all components in both modes, use CSS variables

**Risk**: Mobile UX is poor  
**Mitigation**: Responsive design testing, touch-friendly controls, accept desktop-first for v1.0

### Low Risk

**Risk**: Users don't understand new navigation  
**Mitigation**: Clear onboarding, intuitive UI, tooltips, documentation

---

## Appendix

### Glossary

- **Slug**: URL-friendly version of project name (e.g., "my-project")
- **Soft Delete**: Marking item as deleted without removing from database
- **Canonical ID**: The permanent, unchanging identifier for a project
- **Presence**: Real-time indication of online users
- **Throttle**: Limit frequency of function execution
- **Debounce**: Delay function execution until after input stops

### Resources

- [Figma Design Files](https://figma.com/...) (create these)
- [GitHub Repository](https://github.com/yahavco/collabcanvas)
- [Firebase Console](https://console.firebase.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Documentation Site](https://docs.collabcanvas.app) (future)

### Contact

- **Product Owner**: Yahav Corcos
- **Support**: support@collabcanvas.app (optional)
- **Feedback**: feedback@collabcanvas.app (optional)

---

**Document Version**: 1.0  
**Last Updated**: October 15, 2025  
**Status**: APPROVED FOR DEVELOPMENT  
**Next Review**: Post v1.0 Launch
