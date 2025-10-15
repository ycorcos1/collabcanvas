# CollabCanvas v1.0 - Implementation Task List

## UI/UX Redesign & Navigation Overhaul

---

## Overview

**Total Estimated Time**: 2-3 weeks  
**Prerequisite**: MVP must be complete (all features from original PRD working)  
**Goal**: Transform MVP into production-ready app with professional UI/UX

**Work Phases**:

1. Foundation & Setup (2-3 days)
2. Routing & Navigation (3-4 days)
3. Dashboard Implementation (4-5 days)
4. UI Polish & Dark Mode (2-3 days)
5. Testing & Deployment (2-3 days)

---

## Project File Structure

```
collabcanvas/
├── public/
│   ├── favicon.ico
│   └── og-image.png (new)
├── src/
│   ├── components/
│   │   ├── Canvas/          (existing - minor updates)
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasTopBar.tsx (new)
│   │   │   └── Shape.tsx
│   │   ├── Auth/            (existing - redesign)
│   │   │   ├── SignIn.tsx (redesign)
│   │   │   ├── SignUp.tsx (redesign)
│   │   │   └── AuthProvider.tsx
│   │   ├── Dashboard/       (new)
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectGrid.tsx
│   │   │   ├── RecentProjects.tsx
│   │   │   ├── AllProjects.tsx
│   │   │   ├── Trash.tsx
│   │   │   └── Settings.tsx
│   │   ├── Homepage/        (new)
│   │   │   ├── Homepage.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Hero.tsx
│   │   │   └── Footer.tsx
│   │   ├── shared/          (new)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── ConnectionBanner.tsx
│   │   └── ...existing components
│   ├── hooks/               (existing + new)
│   │   ├── useProjects.ts (new)
│   │   ├── useTheme.ts (new)
│   │   ├── useSlug.ts (new)
│   │   └── ...existing hooks
│   ├── services/            (existing + updates)
│   │   ├── projects.ts (update)
│   │   ├── slugs.ts (new)
│   │   └── ...existing services
│   ├── pages/               (new)
│   │   ├── HomePage.tsx
│   │   ├── SignInPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── CanvasPage.tsx
│   ├── routes/              (new)
│   │   ├── AppRouter.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── PublicRoute.tsx
│   ├── styles/              (new)
│   │   ├── variables.css
│   │   ├── themes.css
│   │   ├── reset.css
│   │   └── globals.css
│   ├── utils/               (existing + new)
│   │   ├── slugify.ts (new)
│   │   ├── validation.ts (new)
│   │   ├── formatDate.ts (new)
│   │   └── ...existing utils
│   ├── types/               (existing + updates)
│   │   ├── project.ts (update)
│   │   ├── user.ts (update)
│   │   └── ...existing types
│   ├── App.tsx              (major update)
│   ├── main.tsx             (minor update)
│   └── index.css            (replace with globals.css)
├── database/                (new)
│   └── migration.ts
├── .env.example
├── package.json
├── vite.config.ts
└── README.md

```

---

## Phase 1: Foundation & Setup

### PR #1: Project Dependencies & Configuration

**Estimated Time**: 2 hours  
**Goal**: Install new dependencies and update configuration

#### Tasks:

- [ ] Install React Router

  - **Command**: `npm install react-router-dom@6`
  - **Files modified**: `package.json`

- [ ] Install date utilities

  - **Command**: `npm install date-fns`
  - **Files modified**: `package.json`

- [ ] Install development dependencies

  - **Command**: `npm install -D @types/react-router-dom`
  - **Files modified**: `package.json`

- [ ] Update Vite config for routing

  - **Files modified**: `vite.config.ts`
  - **Content**: Configure history fallback for SPA routing

- [ ] Create environment variables documentation

  - **Files modified**: `.env.example`
  - **Content**: Add any new required variables

- [ ] Verify builds successfully
  - **Command**: `npm run dev` and `npm run build`

**Testing**:

- [ ] Development server starts without errors
- [ ] Production build completes successfully

---

### PR #2: Design System & CSS Variables

**Estimated Time**: 4 hours  
**Goal**: Establish design system with dark mode support

#### Tasks:

- [ ] Create CSS variables file

  - **Files created**: `src/styles/variables.css`
  - **Content**: Typography, spacing, radius, shadows, z-index scales

- [ ] Create theme system

  - **Files created**: `src/styles/themes.css`
  - **Content**: Light and dark mode color variables, transition definitions

- [ ] Create CSS reset

  - **Files created**: `src/styles/reset.css`
  - **Content**: Normalize browser styles, box-sizing, focus outlines

- [ ] Create global styles

  - **Files created**: `src/styles/globals.css`
  - **Content**: Import all style files, base body styles

- [ ] Update main.tsx to import global styles

  - **Files modified**: `src/main.tsx`
  - **Content**: Import `./styles/globals.css`

- [ ] Remove old index.css

  - **Files deleted**: `src/index.css`

- [ ] Create useTheme hook

  - **Files created**: `src/hooks/useTheme.ts`
  - **Content**: Hook to manage dark mode state, localStorage, system preference

- [ ] Test theme switching
  - Verify CSS variables update on theme change
  - Verify localStorage persistence

**Testing**:

- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] Theme preference persists on reload
- [ ] System preference detection works

---

### PR #3: Shared UI Components

**Estimated Time**: 6 hours  
**Goal**: Build reusable component library

#### Tasks:

- [ ] Create Button component

  - **Files created**: `src/components/shared/Button.tsx`
  - **Props**: variant, size, loading, disabled, onClick
  - **Variants**: primary, secondary, danger, ghost
  - **Sizes**: sm, md, lg

- [ ] Create Input component

  - **Files created**: `src/components/shared/Input.tsx`
  - **Props**: type, label, error, placeholder, value, onChange
  - **Features**: Error states, icons, password toggle

- [ ] Create Modal component

  - **Files created**: `src/components/shared/Modal.tsx`
  - **Props**: isOpen, onClose, title, children
  - **Features**: Focus trap, ESC to close, backdrop click to close

- [ ] Create Toast notification system

  - **Files created**: `src/components/shared/Toast.tsx`, `src/hooks/useToast.ts`
  - **Features**: Success, error, warning, info types
  - **Auto-dismiss**: 3 seconds default

- [ ] Create Avatar component

  - **Files created**: `src/components/shared/Avatar.tsx`
  - **Props**: src, name, size
  - **Fallback**: Show initials if no image

- [ ] Create ConnectionBanner component

  - **Files created**: `src/components/shared/ConnectionBanner.tsx`
  - **Features**: Show when Firebase connection lost
  - **Actions**: Retry button

- [ ] Document component APIs
  - **Files modified**: `README.md`
  - **Content**: Add component usage examples

**Testing**:

- [ ] All components render in light and dark mode
- [ ] Button states work (hover, focus, disabled, loading)
- [ ] Modal focus trap works
- [ ] Toast notifications appear and auto-dismiss
- [ ] Avatar fallback shows initials correctly

---

## Phase 2: Routing & Navigation

### PR #4: Routing Infrastructure

**Estimated Time**: 4 hours  
**Goal**: Set up React Router with protected routes

#### Tasks:

- [ ] Create route configuration

  - **Files created**: `src/routes/AppRouter.tsx`
  - **Content**: Define all routes with lazy loading

- [ ] Create ProtectedRoute component

  - **Files created**: `src/routes/ProtectedRoute.tsx`
  - **Content**: Check authentication, redirect to /signin if not authenticated

- [ ] Create PublicRoute component

  - **Files created**: `src/routes/PublicRoute.tsx`
  - **Content**: Redirect to /dashboard if authenticated

- [ ] Update App.tsx

  - **Files modified**: `src/App.tsx`
  - **Content**: Replace existing routing with AppRouter, add BrowserRouter

- [ ] Create placeholder page components

  - **Files created**:
    - `src/pages/HomePage.tsx` (temp placeholder)
    - `src/pages/SignInPage.tsx` (temp placeholder)
    - `src/pages/SignUpPage.tsx` (temp placeholder)
    - `src/pages/DashboardPage.tsx` (temp placeholder)
    - `src/pages/CanvasPage.tsx` (temp placeholder)

- [ ] Configure Vite for SPA routing

  - **Files modified**: `vite.config.ts`
  - **Content**: Add `historyApiFallback: true`

- [ ] Update Vercel config
  - **Files created**: `vercel.json`
  - **Content**: Configure rewrites for SPA

**Testing**:

- [ ] Navigate to / shows homepage
- [ ] Navigate to /signin shows sign in page
- [ ] Navigate to /dashboard redirects if not authenticated
- [ ] Navigate to /canvas/:slug redirects if not authenticated
- [ ] Authenticated user visiting / redirects to /dashboard
- [ ] Browser back/forward buttons work correctly

---

### PR #5: Slug System & Database Migration

**Estimated Time**: 5 hours  
**Goal**: Implement URL slug system for projects

#### Tasks:

- [ ] Create slug utilities

  - **Files created**: `src/utils/slugify.ts`
  - **Functions**: `generateSlug(name)`, `getUniqueSlug(baseSlug, projectId)`

- [ ] Update Project type

  - **Files modified**: `src/types/project.ts`
  - **Content**: Add `slug: string`, `slugHistory: string[]`

- [ ] Create slug service

  - **Files created**: `src/services/slugs.ts`
  - **Functions**: `getProjectBySlug`, `updateProjectSlug`, `slugExists`

- [ ] Create migration script

  - **Files created**: `database/migration.ts`
  - **Content**: Script to add slugs to existing projects

- [ ] Run migration (development)

  - **Command**: `npm run migrate` (add script to package.json)
  - **Verify**: All projects have unique slugs

- [ ] Update projects service

  - **Files modified**: `src/services/projects.ts`
  - **Content**: Include slug in create operations, add slug update function

- [ ] Create useSlug hook
  - **Files created**: `src/hooks/useSlug.ts`
  - **Content**: Hook to fetch project by slug, handle redirects

**Testing**:

- [ ] Generate slug from project name: "My Project" → "my-project"
- [ ] Handle special characters: "Test!@#" → "test"
- [ ] Handle conflicts: "test" → "test-2" → "test-3"
- [ ] Migration script works on sample data
- [ ] Old project IDs still accessible during transition

---

## Phase 3: Dashboard Implementation

### PR #6: Dashboard Layout & Sidebar

**Estimated Time**: 6 hours  
**Goal**: Build dashboard shell with navigation

#### Tasks:

- [ ] Create DashboardLayout component

  - **Files created**: `src/components/Dashboard/DashboardLayout.tsx`
  - **Content**: Two-column layout (sidebar + main content)

- [ ] Create Sidebar component

  - **Files created**: `src/components/Dashboard/Sidebar.tsx`
  - **Sections**: Logo, Create button, Navigation links, User profile

- [ ] Implement mobile hamburger menu

  - **Files modified**: `src/components/Dashboard/Sidebar.tsx`
  - **Content**: Collapsible sidebar for <768px, overlay on mobile

- [ ] Create navigation links

  - **Content**: Recent, All Projects, Trash, Settings
  - **Features**: Active state highlighting, icons

- [ ] Create user profile section

  - **Content**: Avatar, display name, sign out button
  - **Features**: Dropdown menu with settings link

- [ ] Update DashboardPage

  - **Files modified**: `src/pages/DashboardPage.tsx`
  - **Content**: Render DashboardLayout with Outlet for nested routes

- [ ] Configure nested dashboard routes
  - **Files modified**: `src/routes/AppRouter.tsx`
  - **Routes**:
    - `/dashboard` → redirect to `/dashboard/recent`
    - `/dashboard/recent` → RecentProjects component
    - `/dashboard/all` → AllProjects component
    - `/dashboard/trash` → Trash component
    - `/dashboard/settings` → Settings component

**Testing**:

- [ ] Sidebar renders correctly
- [ ] Navigation links highlight active route
- [ ] Mobile hamburger menu opens/closes
- [ ] Mobile sidebar closes on route change
- [ ] Sign out button works
- [ ] Nested routes render correct content

---

### PR #7: Project Cards & Grid

**Estimated Time**: 5 hours  
**Goal**: Build project card component and grid layout

#### Tasks:

- [ ] Create ProjectCard component

  - **Files created**: `src/components/Dashboard/ProjectCard.tsx`
  - **Props**: project, onOpen, onRename, onDelete
  - **Features**: Thumbnail, name, last edited timestamp, actions menu

- [ ] Implement project thumbnail generation

  - **Files modified**: `src/services/projects.ts`
  - **Content**: Use Konva `toDataURL()` to generate thumbnail on save

- [ ] Create ProjectGrid component

  - **Files created**: `src/components/Dashboard/ProjectGrid.tsx`
  - **Props**: projects, emptyState
  - **Features**: Responsive grid (3/2/1 columns), loading state

- [ ] Implement actions menu

  - **Files modified**: `src/components/Dashboard/ProjectCard.tsx`
  - **Actions**: Open in new tab, Rename, Move to trash
  - **Features**: Dropdown menu, keyboard accessible

- [ ] Add rename functionality

  - **Component**: Modal with input field
  - **Validation**: 1-100 characters, no special chars in slug
  - **Update**: Project name and slug

- [ ] Format relative timestamps
  - **Files created**: `src/utils/formatDate.ts`
  - **Use**: date-fns `formatDistanceToNow`
  - **Examples**: "2 hours ago", "3 days ago"

**Testing**:

- [ ] Project cards render correctly
- [ ] Grid is responsive (test all breakpoints)
- [ ] Actions menu opens/closes
- [ ] Rename updates project and URL
- [ ] Click card navigates to canvas
- [ ] Timestamps format correctly

---

### PR #8: Recent Projects View

**Estimated Time**: 3 hours  
**Goal**: Implement recent projects page

#### Tasks:

- [ ] Create RecentProjects component

  - **Files created**: `src/components/Dashboard/RecentProjects.tsx`
  - **Content**: "Create New Project" button + ProjectGrid

- [ ] Create useProjects hook

  - **Files created**: `src/hooks/useProjects.ts`
  - **Content**: Fetch projects from Firestore, real-time updates

- [ ] Implement recent projects query

  - **Query**:
    - Where: `deletedAt == null`
    - Order by: `updatedAt DESC`
    - Limit: 5

- [ ] Create empty state

  - **Content**: Illustration, message, "Create New Project" CTA
  - **Design**: Centered, friendly

- [ ] Implement create new project flow
  - **Action**: Create project document in Firestore
  - **Fields**:
    - `name: "Untitled"`
    - `slug: "untitled-{timestamp}"`
    - `ownerId: currentUser.uid`
    - `createdAt: now()`
    - `updatedAt: now()`
  - **Navigate**: `/canvas/untitled-{timestamp}`

**Testing**:

- [ ] Empty state shows when no projects
- [ ] Recent projects load (max 5)
- [ ] Projects sorted by last modified
- [ ] Create new project opens canvas
- [ ] Real-time updates work (test with second browser)

---

### PR #9: All Projects View with Pagination

**Estimated Time**: 5 hours  
**Goal**: Implement all projects page with search and sorting

#### Tasks:

- [ ] Create AllProjects component

  - **Files created**: `src/components/Dashboard/AllProjects.tsx`
  - **Content**: Search bar, sort dropdown, view toggle, ProjectGrid

- [ ] Implement search functionality

  - **Features**: Debounced input (300ms), filter by project name
  - **Method**: Client-side if <100 projects, else Firestore where query

- [ ] Implement sort dropdown

  - **Options**: Last Modified, Name A-Z, Name Z-A, Date Created
  - **Update**: Re-query or re-sort locally

- [ ] Implement view toggle

  - **Options**: Grid (default), List
  - **List view**: Show more metadata (created date, owner, collaborators)

- [ ] Create pagination

  - **Method**: "Load More" button (infinite scroll optional)
  - **Page size**: 20 projects
  - **Query**: Use Firestore `startAfter` for cursor pagination

- [ ] Add projects count

  - **Display**: "Showing 20 of 47 projects"
  - **Update**: Real-time with Firestore count

- [ ] Implement list view component
  - **Files created**: `src/components/Dashboard/ProjectList.tsx` (optional)
  - **Content**: Table-like layout with more details

**Testing**:

- [ ] Search filters projects correctly
- [ ] Debounce prevents excessive queries
- [ ] Sort updates project order
- [ ] View toggle switches between grid and list
- [ ] Pagination loads more projects
- [ ] Count displays correctly

---

### PR #10: Trash System

**Estimated Time**: 5 hours  
**Goal**: Implement trash with recovery and permanent deletion

#### Tasks:

- [ ] Create Trash component

  - **Files created**: `src/components/Dashboard/Trash.tsx`
  - **Content**: List view of deleted projects, bulk actions

- [ ] Implement soft delete

  - **Files modified**: `src/services/projects.ts`
  - **Function**: `moveToTrash(projectId)` - Sets `deletedAt: Timestamp.now()`

- [ ] Query trashed projects

  - **Query**: Where `deletedAt != null`, order by `deletedAt DESC`

- [ ] Implement recover functionality

  - **Function**: `recoverProject(projectId)` - Sets `deletedAt: null`
  - **Feedback**: Toast notification "Project recovered"

- [ ] Implement permanent deletion

  - **Function**: `deleteProjectPermanently(projectId)`
  - **Steps**:
    1. Show confirmation modal: "Type project name to confirm"
    2. Delete shapes subcollection
    3. Delete project document
    4. Show toast: "Project permanently deleted"

- [ ] Create confirmation modal for permanent delete

  - **Component**: Modal with text input
  - **Validation**: Input must match project name exactly
  - **Disabled submit**: Until input matches

- [ ] Implement "Recover All" bulk action

  - **Function**: Batch update all trashed projects
  - **Feedback**: Toast with count: "5 projects recovered"

- [ ] Implement "Delete All Forever" bulk action

  - **Confirmation**: Modal with "DELETE ALL" typed confirmation
  - **Function**: Batch delete all trashed projects
  - **Feedback**: Toast with count: "5 projects permanently deleted"

- [ ] Create empty state for trash
  - **Content**: Icon, "Trash is empty" message

**Testing**:

- [ ] Move project to trash (soft delete)
- [ ] Project appears in trash list
- [ ] Recover individual project
- [ ] Delete individual project permanently
- [ ] Recover all projects
- [ ] Delete all projects permanently
- [ ] Confirmation modals prevent accidental deletion

---

### PR #11: Settings Page

**Estimated Time**: 6 hours  
**Goal**: Build user settings with profile, preferences, and account management

#### Tasks:

- [ ] Create Settings component

  - **Files created**: `src/components/Dashboard/Settings.tsx`
  - **Layout**: Single column, sectioned form

- [ ] Implement Profile section

  - **Fields**:
    - Avatar upload (optional for v1, can show initials)
    - Display name (editable)
    - Email (read-only)
  - **Save**: Update Firestore user profile + Firebase Auth display name

- [ ] Implement avatar upload (optional)

  - **Service**: Firebase Storage
  - **Features**: Crop to square, max 2MB, compress
  - **Fallback**: Colored circle with initials

- [ ] Implement Preferences section

  - **Fields**:
    - Theme toggle (Auto/Light/Dark radio buttons)
    - Language dropdown (English only, disabled for v1)
  - **Save**: Update localStorage + Firestore user profile
  - **Apply**: Theme changes immediately

- [ ] Connect theme toggle to useTheme hook

  - **Files modified**: `src/hooks/useTheme.ts`
  - **Content**: Add function to set theme explicitly

- [ ] Implement Account section

  - **Actions**:
    - Change password button → Opens modal
    - Delete account button → Opens confirmation modal

- [ ] Create change password modal

  - **Fields**: Current password, new password, confirm new password
  - **Validation**: Min 8 chars, passwords match
  - **Submit**: Firebase Auth `updatePassword`

- [ ] Create delete account modal

  - **Warning**: "This will permanently delete your account and all projects"
  - **Confirmation**: Type "DELETE" to confirm
  - **Submit**:
    1. Delete all user projects
    2. Delete user profile from Firestore
    3. Delete Firebase Auth account
    4. Sign out and redirect to homepage

- [ ] Add About section

  - **Content**: Version number, links to docs/GitHub

- [ ] Implement form validation
  - **Files created**: `src/utils/validation.ts`
  - **Functions**: `validateDisplayName`, `validatePassword`

**Testing**:

- [ ] Update display name successfully
- [ ] Theme toggle changes theme immediately
- [ ] Theme preference persists on reload
- [ ] Change password works
- [ ] Delete account confirmation prevents accidental deletion
- [ ] Delete account removes all user data

---

## Phase 4: Pages Implementation

### PR #12: Homepage

**Estimated Time**: 6 hours  
**Goal**: Build professional landing page

#### Tasks:

- [ ] Create Homepage component

  - **Files created**: `src/components/Homepage/Homepage.tsx`
  - **Sections**: Header, Hero, Footer

- [ ] Create Header component

  - **Files created**: `src/components/Homepage/Header.tsx`
  - **Content**: Logo (left), Sign In + Sign Up buttons (right)
  - **Features**: Fixed position, backdrop blur on scroll

- [ ] Create Hero component

  - **Files created**: `src/components/Homepage/Hero.tsx`
  - **Content**:
    - Animated canvas preview
    - Headline: "Real-time collaboration for creative teams"
    - Subheadline: "Design together, ship faster"
    - CTA button: "Get Started" → `/signup`

- [ ] Implement hero animation

  - **Method**: CSS animations or Framer Motion
  - **Content**:
    - 2-3 cursors moving with names
    - Shapes appearing and transforming
    - Subtle and performant
  - **Fallback**: Static illustration for `prefers-reduced-motion`

- [ ] Create Footer component

  - **Files created**: `src/components/Homepage/Footer.tsx`
  - **Content**: "Created by Yahav Corcos" (centered)
  - **Optional**: GitHub link, docs link

- [ ] Update HomePage page

  - **Files modified**: `src/pages/HomePage.tsx`
  - **Content**: Render Homepage component

- [ ] Add gradient background

  - **Files created**: `src/styles/homepage.css` (module)
  - **Content**: Subtle gradient, responsive

- [ ] Implement redirect logic
  - **Files modified**: `src/pages/HomePage.tsx`
  - **Logic**: If authenticated, redirect to `/dashboard/recent`

**Testing**:

- [ ] Homepage loads quickly (<2s)
- [ ] Hero animation plays smoothly
- [ ] CTA button navigates to sign up
- [ ] Header buttons navigate correctly
- [ ] Authenticated users redirect to dashboard
- [ ] Works in light and dark mode
- [ ] Mobile responsive

---

### PR #13: Authentication Pages Redesign

**Estimated Time**: 5 hours  
**Goal**: Redesign sign in and sign up pages

#### Tasks:

- [ ] Redesign SignIn component

  - **Files modified**: `src/components/Auth/SignIn.tsx`
  - **Layout**: Centered card (400px max-width)
  - **Fields**: Email, password (with show/hide toggle)
  - **Actions**: "Remember me" checkbox, "Sign In" button
  - **Links**: "Don't have an account? Sign up", "Forgot password?" (placeholder)

- [ ] Redesign SignUp component

  - **Files modified**: `src/components/Auth/SignUp.tsx`
  - **Layout**: Centered card (400px max-width)
  - **Fields**: Display name, email, password (with show/hide toggle)
  - **Actions**: "Create Account" button
  - **Links**: "Already have an account? Sign in"

- [ ] Implement inline validation

  - **Files modified**: Both sign in and sign up components
  - **Features**: Show error messages below fields, disable submit until valid

- [ ] Add loading states

  - **Content**: Spinner in button on submit, disable form during submission

- [ ] Update SignInPage

  - **Files modified**: `src/pages/SignInPage.tsx`
  - **Content**: Render SignIn component

- [ ] Update SignUpPage

  - **Files modified**: `src/pages/SignUpPage.tsx`
  - **Content**: Render SignUp component

- [ ] Implement success flow

  - **Sign Up**: Create user profile in Firestore, redirect to `/dashboard/recent`
  - **Sign In**: Redirect to `/dashboard/recent`

- [ ] Handle authentication errors

  - **Errors**: Email in use, invalid credentials, network error
  - **Display**: Toast notifications or inline error messages

- [ ] Add password strength indicator (optional)
  - **Component**: Progress bar showing password strength
  - **Criteria**: Length, uppercase, lowercase, numbers, special chars

**Testing**:

- [ ] Sign up with valid data creates account
- [ ] Sign in with valid credentials works
- [ ] Validation prevents invalid submissions
- [ ] Error messages display correctly
- [ ] Loading states show during submission
- [ ] Redirect after successful auth
- [ ] Remember me persists session
- [ ] Works in light and dark mode
- [ ] Mobile responsive

---

### PR #14: Canvas Page Updates

**Estimated Time**: 4 hours  
**Goal**: Update canvas page with new top bar and slug support

#### Tasks:

- [ ] Create CanvasTopBar component

  - **Files created**: `src/components/Canvas/CanvasTopBar.tsx`
  - **Content**: Back button, project name, share button, user avatars

- [ ] Implement back button

  - **Action**: Navigate to `/dashboard/recent`
  - **Icon**: Left arrow

- [ ] Implement inline project name editing

  - **Features**: Click to edit, auto-save on blur
  - **Update**: Project name in Firestore, regenerate slug

- [ ] Add share button (placeholder)

  - **Action**: Copy link to clipboard
  - **Feedback**: Toast "Link copied!"
  - **Future**: Add collaborator management modal

- [ ] Display online user avatars

  - **Source**: Presence system (existing)
  - **Display**: First 5 avatars, "+X" badge if more
  - **Tooltip**: Show all user names on hover

- [ ] Update CanvasPage with slug routing

  - **Files modified**: `src/pages/CanvasPage.tsx`
  - **Logic**:
    1. Get slug from URL params
    2. Fetch project by slug using `useSlug` hook
    3. If not found, check slug history for redirect
    4. If still not found, redirect to dashboard with error toast
    5. Load canvas with project ID

- [ ] Handle new project creation

  - **Route**: `/canvas/untitled-{timestamp}`
  - **Logic**: Create project document on mount if doesn't exist
  - **Fields**: Default name "Untitled", generate slug

- [ ] Update project on canvas changes

  - **Update**: `updatedAt` timestamp on any shape modification
  - **Throttle**: Max once per 5 seconds to reduce writes

- [ ] Implement project rename flow
  - **Trigger**: Edit name in top bar
  - **Steps**:
    1. Update project name in Firestore
    2. Generate new slug
    3. Add old slug to slugHistory
    4. Update URL with `navigate(..., {replace: true})`

**Testing**:

- [ ] Canvas loads with existing slug
- [ ] Back button returns to dashboard
- [ ] Rename project updates name and URL
- [ ] Old URLs redirect to new slug
- [ ] Share button copies link
- [ ] User avatars display correctly
- [ ] New project creation works
- [ ] All existing canvas features still work

---

## Phase 5: Polish & Optimization

### PR #15: Dark Mode Final Implementation

**Estimated Time**: 4 hours  
**Goal**: Ensure dark mode works perfectly across all components

#### Tasks:

- [ ] Audit all components for dark mode

  - **Check**: Homepage, auth pages, dashboard, canvas, modals
  - **Fix**: Any hardcoded colors or missing CSS variables

- [ ] Update canvas for dark mode

  - **Files modified**: `src/components/Canvas/Canvas.tsx`
  - **Changes**:
    - Background color: Use `--bg-primary`
    - Grid color: Theme-aware
    - Selection indicators: High contrast in both modes

- [ ] Update cursor labels for dark mode

  - **Files modified**: `src/components/Cursors/Cursor.tsx`
  - **Logic**: Dark background in light mode, light background in dark mode

- [ ] Test all transitions

  - **Verify**: 300ms smooth transition on theme toggle
  - **Verify**: Respects `prefers-reduced-motion`

- [ ] Add theme toggle to canvas (optional)

  - **Location**: Top bar user menu
  - **Feature**: Quick toggle without going to settings

- [ ] Persist theme to Firestore user profile

  - **Files modified**: `src/hooks/useTheme.ts`
  - **Logic**: Update Firestore when theme changes

- [ ] Handle theme on initial load
  - **Logic**:
    1. Check localStorage
    2. If not set, check Firestore user profile
    3. If not set, use system preference
    4. Apply theme before first render (prevent flash)

**Testing**:

- [ ] All pages render correctly in dark mode
- [ ] Canvas background changes with theme
- [ ] Cursor labels are readable in both modes
- [ ] Theme toggle in settings works
- [ ] Theme persists across sessions
- [ ] No flash of wrong theme on page load
- [ ] Transitions are smooth

---

### PR #16: Responsive Design & Mobile Optimization

**Estimated Time**: 5 hours  
**Goal**: Ensure all pages work well on mobile devices

#### Tasks:

- [ ] Test homepage on mobile

  - **Fix**: Stack hero content, adjust font sizes, full-width CTA

- [ ] Test dashboard on mobile

  - **Fix**: Hamburger menu, single-column project grid, touch-friendly targets

- [ ] Test canvas on mobile

  - **Fix**: Condensed top bar, touch gestures for pan/zoom, larger tap targets

- [ ] Test auth pages on mobile

  - **Fix**: Full-width inputs, larger text (min 16px to prevent zoom)

- [ ] Test modals on mobile

  - **Fix**: Full-screen or near-full-screen on small devices

- [ ] Implement mobile navigation

  - **Component**: Hamburger icon, slide-out sidebar
  - **Close**: On route change or outside click

- [ ] Add touch gestures to canvas

  - **Gestures**: Pinch to zoom, two-finger pan
  - **Library**: Use existing Konva touch support

- [ ] Increase tap target sizes

  - **Minimum**: 44x44px for all interactive elements
  - **Check**: Buttons, links, dropdown triggers

- [ ] Test on real devices
  - **Devices**: iPhone, Android phone, iPad
  - **Browsers**: Safari, Chrome mobile

**Testing**:

- [ ] All pages render correctly on mobile
- [ ] Navigation is usable with touch
- [ ] Forms are easy to fill out
- [ ] No horizontal scrolling
- [ ] Tap targets are large enough
- [ ] Text is readable (no zoom required except user preference)

---

### PR #17: Performance Optimization

**Estimated Time**: 4 hours  
**Goal**: Optimize for fast load times and smooth interactions

#### Tasks:

- [ ] Implement code splitting

  - **Files modified**: `src/routes/AppRouter.tsx`
  - **Method**: Use `React.lazy()` for route components
  - **Add**: `<Suspense>` with loading spinner

- [ ] Optimize project thumbnails

  - **Compression**: Reduce quality to 70%, max dimensions 400x300
  - **Format**: Use WebP if browser supports, fallback to JPEG
  - **Lazy load**: Use Intersection Observer

- [ ] Implement virtual scrolling (if needed)

  - **Use case**: If >100 projects in All Projects view
  - **Library**: `react-window` or `react-virtual`

- [ ] Memoize expensive components

  - **Components**: ProjectCard, Cursor, Shape
  - **Method**: `React.memo()` with custom comparison

- [ ] Optimize Firestore queries

  - **Indexes**: Create composite indexes for sorting + filtering
  - **Pagination**: Use cursor-based pagination (startAfter)
  - **Cache**: Enable offline persistence

- [ ] Debounce search input

  - **Delay**: 300ms
  - **Method**: Use debounce utility or hook

- [ ] Throttle cursor position updates

  - **Existing**: Already implemented in MVP (50ms)
  - **Verify**: Still working after redesign

- [ ] Analyze bundle size

  - **Tool**: `vite-bundle-visualizer`
  - **Action**: Remove unused dependencies, optimize imports

- [ ] Run Lighthouse audit
  - **Target**: >90 performance, >95 accessibility
  - **Fix**: Any issues identified

**Testing**:

- [ ] Homepage loads in <2s (LCP)
- [ ] Dashboard loads in <1.5s
- [ ] Canvas loads in <2s
- [ ] Route transitions feel instant (<300ms)
- [ ] No jank during scrolling or animations
- [ ] 60 FPS maintained during canvas interactions
- [ ] Lighthouse score meets targets

---

### PR #18: Error Handling & Edge Cases

**Estimated Time**: 4 hours  
**Goal**: Handle errors gracefully and test edge cases

#### Tasks:

- [ ] Implement error boundary

  - **Files created**: `src/components/ErrorBoundary.tsx`
  - **Features**: Catch React errors, show fallback UI, log to console

- [ ] Add connection status monitoring

  - **Files modified**: `src/services/firebase.ts`
  - **Feature**: Monitor Firebase connection state
  - **UI**: Show ConnectionBanner when offline

- [ ] Handle authentication errors

  - **Scenarios**: Session expired, invalid token, network error
  - **Action**: Redirect to sign in with return URL

- [ ] Handle project not found

  - **Scenario**: Invalid slug, deleted project, no access
  - **Action**: Redirect to dashboard with error toast

- [ ] Handle Firestore errors

  - **Scenarios**: Permission denied, network timeout, quota exceeded
  - **UI**: Toast notification with retry option

- [ ] Add loading states everywhere

  - **Locations**: Dashboard projects, canvas load, auth forms
  - **Component**: Skeleton screens or spinners

- [ ] Test edge cases

  - **Cases**:
    - Very long project names (>100 chars)
    - Special characters in names
    - Rapid project creation
    - Simultaneous editing by multiple users
    - Slow network (throttle to 3G)
    - Offline mode
    - Browser refresh during operation

- [ ] Add user feedback for all actions
  - **Method**: Toast notifications
  - **Examples**: "Project created", "Project deleted", "Changes saved"

**Testing**:

- [ ] Error boundary catches and displays errors
- [ ] Connection banner appears when offline
- [ ] Auth errors redirect to sign in
- [ ] Project not found handles gracefully
- [ ] All loading states show correctly
- [ ] Edge cases don't break the app
- [ ] User feedback is clear and timely

---

## Phase 6: Testing & Deployment

### PR #19: Integration Testing

**Estimated Time**: 6 hours  
**Goal**: Test complete user journeys

#### Tasks:

- [ ] Set up testing framework (optional)

  - **Tool**: Playwright or Cypress
  - **Config**: Install and configure

- [ ] Write critical path tests

  - **Tests**:
    1. Sign up → Create project → Edit → Sign out
    2. Sign in → View recent → Open project → Rename
    3. Create → Move to trash → Recover → Delete forever
    4. Toggle dark mode → Verify persistence
    5. Create multiple projects → Search → Sort

- [ ] Manual testing checklist

  - [ ] Complete sign up flow
  - [ ] Complete sign in flow
  - [ ] Create new project from dashboard
  - [ ] Rename project and verify URL updates
  - [ ] Move project to trash
  - [ ] Recover project from trash
  - [ ] Delete project permanently
  - [ ] Toggle dark mode in settings
  - [ ] Update display name in settings
  - [ ] Change password
  - [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - [ ] Test on mobile devices
  - [ ] Test with slow network (throttle to 3G)
  - [ ] Test keyboard navigation
  - [ ] Test with screen reader (basic check)

- [ ] Cross-browser testing

  - **Browsers**: Chrome, Firefox, Safari, Edge
  - **Features**: Focus on CSS compatibility, routing, Firebase

- [ ] Accessibility audit

  - **Tool**: axe DevTools
  - **Check**: Color contrast, keyboard nav, ARIA labels, focus management

- [ ] Performance audit

  - **Tool**: Lighthouse
  - **Target**: >90 performance, >95 accessibility
  - **Test**: Homepage, dashboard, canvas

- [ ] Document known issues
  - **File**: `KNOWN_ISSUES.md`
  - **Content**: Any bugs or limitations to fix post-v1.0

**Testing**:

- [ ] All critical user flows work end-to-end
- [ ] No console errors in production build
- [ ] Lighthouse targets met
- [ ] Accessibility standards met
- [ ] Works across all target browsers

---

### PR #20: Database Migration (Production)

**Estimated Time**: 2 hours  
**Goal**: Migrate production database to add slugs

#### Tasks:

- [ ] Review migration script

  - **File**: `database/migration.ts`
  - **Verify**: Logic is correct and safe

- [ ] Backup production database

  - **Method**: Firestore export
  - **Command**: `gcloud firestore export gs://[BUCKET]`

- [ ] Deploy migration as Cloud Function (recommended)

  - **File**: `functions/src/migrate.ts`
  - **Deploy**: `firebase deploy --only functions:migrate`
  - **Trigger**: HTTP trigger, secured with auth

- [ ] Alternative: Run migration locally

  - **Method**: Node script with production credentials
  - **Safety**: Dry-run mode first

- [ ] Execute migration

  - **Monitor**: Watch Firestore console for updates
  - **Verify**: All projects have slugs, no duplicates

- [ ] Verify migration success

  - **Check**: Random sample of projects
  - **Test**: Access projects by slug in production

- [ ] Update Firebase security rules
  - **File**: `firestore.rules`
  - **Deploy**: `firebase deploy --only firestore:rules`

**Testing**:

- [ ] Migration completes successfully
- [ ] All projects have unique slugs
- [ ] No data loss or corruption
- [ ] Old URLs still accessible (if implemented redirect support)

---

### PR #21: Final Deployment

**Estimated Time**: 3 hours  
**Goal**: Deploy v1.0 to production

#### Tasks:

- [ ] Update version number

  - **Files modified**: `package.json`, `src/config.ts` (if exists)
  - **Version**: `1.0.0`

- [ ] Update README

  - **Content**:
    - Project overview
    - Features list
    - Setup instructions
    - Deployment URL
    - Known limitations
    - Roadmap (v1.1, v1.2)

- [ ] Create CHANGELOG

  - **File**: `CHANGELOG.md`
  - **Content**: All changes from MVP to v1.0

- [ ] Build production bundle

  - **Command**: `npm run build`
  - **Verify**: No errors, check bundle size

- [ ] Test production build locally

  - **Command**: `npm run preview`
  - **Test**: Critical flows work correctly

- [ ] Deploy to Vercel

  - **Method**: Git push to main branch (auto-deploy) or manual deploy
  - **Verify**: Deployment successful

- [ ] Smoke test production

  - **Tests**:
    - [ ] Homepage loads
    - [ ] Sign up works
    - [ ] Sign in works
    - [ ] Create project works
    - [ ] Canvas loads
    - [ ] Real-time sync works (test with 2 users)
    - [ ] Dark mode works

- [ ] Set up monitoring (optional)

  - **Tool**: Sentry, LogRocket, or Firebase Performance Monitoring
  - **Config**: Error tracking, performance metrics

- [ ] Update domain DNS (if custom domain)

  - **Provider**: Namecheap, Cloudflare, etc.
  - **Records**: Point to Vercel

- [ ] Announce launch (optional)
  - **Channels**: Social media, email, Product Hunt
  - **Content**: Feature highlights, demo video, live demo

**Testing**:

- [ ] Production site is accessible
- [ ] All features work in production
- [ ] No console errors
- [ ] Real-time features work across different networks
- [ ] Performance is acceptable
- [ ] SSL certificate is valid

---

## Post-Launch Tasks

### Week 1: Monitoring & Bug Fixes

**Estimated Time**: Ongoing

#### Tasks:

- [ ] Monitor error rates

  - **Tool**: Sentry, Firebase console
  - **Action**: Fix critical bugs immediately

- [ ] Monitor performance metrics

  - **Tool**: Lighthouse, Web Vitals
  - **Action**: Optimize if metrics degrade

- [ ] Gather user feedback

  - **Method**: In-app feedback form, email, social media
  - **Document**: User requests and pain points

- [ ] Fix priority bugs

  - **Criteria**: Breaks critical functionality, affects many users
  - **Process**: Hotfix → test → deploy

- [ ] Update documentation
  - **Content**: Add FAQs, troubleshooting guide
  - **Location**: README, docs site (if exists)

**Success Criteria**:

- [ ] Uptime >99%
- [ ] Error rate <0.1%
- [ ] All critical bugs fixed within 24 hours

---

### Week 2-4: Plan v1.1

**Estimated Time**: Planning phase

#### Tasks:

- [ ] Analyze usage data

  - **Metrics**: User activation, retention, feature adoption
  - **Tool**: Firebase Analytics, Vercel Analytics

- [ ] Prioritize v1.1 features

  - **Method**: User feedback + strategic goals
  - **Candidates**: Advanced shapes, color picker, layer management

- [ ] Create v1.1 PRD

  - **Content**: Feature specifications, user stories, success metrics

- [ ] Estimate v1.1 timeline
  - **Target**: 1 month after v1.0

---

## Testing Checklist (Final QA)

### Functional Testing

- [ ] **Authentication**

  - [ ] Sign up creates account
  - [ ] Sign in works
  - [ ] Sign out works
  - [ ] Session persists on refresh
  - [ ] Password validation works

- [ ] **Dashboard**

  - [ ] Recent projects load
  - [ ] All projects load with pagination
  - [ ] Search filters projects
  - [ ] Sort changes order
  - [ ] Create new project opens canvas
  - [ ] Project cards navigate correctly

- [ ] **Canvas**

  - [ ] Canvas loads with slug
  - [ ] Project name editable
  - [ ] Rename updates URL
  - [ ] Back button works
  - [ ] Share button copies link
  - [ ] All MVP features still work (shapes, cursors, presence)

- [ ] **Trash**

  - [ ] Move to trash soft deletes
  - [ ] Recover restores project
  - [ ] Delete forever removes permanently
  - [ ] Bulk actions work

- [ ] **Settings**
  - [ ] Update display name works
  - [ ] Theme toggle works
  - [ ] Theme persists
  - [ ] Change password works
  - [ ] Delete account works

### Non-Functional Testing

- [ ] **Performance**

  - [ ] Homepage LCP <3s
  - [ ] Dashboard loads <1.5s
  - [ ] Canvas loads <2s
  - [ ] 60 FPS during animations
  - [ ] Lighthouse score >90

- [ ] **Accessibility**

  - [ ] Keyboard navigation works
  - [ ] Focus indicators visible
  - [ ] Screen reader announces correctly
  - [ ] Color contrast passes WCAG AA
  - [ ] No accessibility errors in axe

- [ ] **Responsiveness**

  - [ ] Works on mobile (<768px)
  - [ ] Works on tablet (768-1023px)
  - [ ] Works on desktop (>1024px)
  - [ ] No horizontal scroll

- [ ] **Browser Compatibility**

  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Security**
  - [ ] Firebase rules enforce auth
  - [ ] No sensitive data in console
  - [ ] HTTPS enforced
  - [ ] No XSS vulnerabilities

### Edge Cases

- [ ] Long project names handled
- [ ] Special characters in names handled
- [ ] Many projects (>100) perform well
- [ ] Slow network (3G) works
- [ ] Offline shows appropriate message
- [ ] Rapid clicking doesn't break UI
- [ ] Multiple tabs don't conflict

---

## Time Estimates Summary

| Phase                     | PRs        | Estimated Time |
| ------------------------- | ---------- | -------------- |
| Phase 1: Foundation       | #1-3       | 2-3 days       |
| Phase 2: Routing          | #4-5       | 3-4 days       |
| Phase 3: Dashboard        | #6-11      | 4-5 days       |
| Phase 4: Pages            | #12-14     | 3-4 days       |
| Phase 5: Polish           | #15-18     | 3-4 days       |
| Phase 6: Testing & Deploy | #19-21     | 3-4 days       |
| **Total**                 | **21 PRs** | **18-24 days** |

**Recommended Schedule**: 3 weeks with buffer for unexpected issues

---

## Branch & Commit Conventions

### Branch Naming

```
feature/v1-PR#-short-description
```

Examples:

- `feature/v1-PR1-dependencies-setup`
- `feature/v1-PR6-dashboard-layout`
- `feature/v1-PR12-homepage`

### Commit Messages

```
[v1-PR#] Description

Examples:
- [v1-PR1] Install React Router and date-fns
- [v1-PR6] Create dashboard layout with sidebar
- [v1-PR12] Implement homepage hero animation
```

### PR Description Template

```markdown
## PR #X: Title

### Changes

- Bullet list of changes

### Testing

- How to test this PR

### Screenshots

- Before/after images (if UI changes)

### Checklist

- [ ] Code builds without errors
- [ ] All tests pass
- [ ] Works in light and dark mode
- [ ] Mobile responsive (if applicable)
- [ ] No console errors
```

---

## Notes

- **MVP Features**: All existing collaborative features (cursor sync, presence, real-time updates) must continue working after redesign
- **No Breaking Changes**: Existing projects should load correctly after migration
- **Backward Compatibility**: Support old URLs for 30 days (optional)
- **Progressive Enhancement**: Build core features first, polish later
- **Deploy Often**: Deploy after completing each major phase
- **Test Continuously**: Don't wait until the end to test

---

**Document Version**: 1.0  
**Last Updated**: October 15, 2025  
**Status**: Ready for Implementation
