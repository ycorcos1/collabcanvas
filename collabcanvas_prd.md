# HØRIZON (CollabCanvas) - Complete Product Requirements Document

**App Name**: HØRIZON  
**Project Name**: CollabCanvas  
**Document Version**: 3.0  
**Last Updated**: October 19, 2025  
**Status**: PRODUCTION READY ✅

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Context & Timeline](#project-context--timeline)
3. [User Stories](#user-stories)
4. [Technical Stack](#technical-stack)
5. [Core Features](#core-features)
   - [Authentication](#1-authentication)
   - [Homepage](#2-homepage)
   - [Dashboard](#3-dashboard)
   - [Canvas System](#4-canvas-system)
   - [Collaboration Features](#5-collaboration-features)
   - [AI Agent](#6-ai-agent-natural-language-canvas-manipulation)
6. [Design System](#design-system)
7. [Performance & Accessibility](#performance--accessibility)
8. [Security](#security)
9. [Testing Strategy](#testing-strategy)
10. [Deployment & Success Metrics](#deployment--success-metrics)
11. [Roadmap](#roadmap)

---

## Executive Summary

**HØRIZON** is a real-time collaborative canvas application that enables multiple users to simultaneously create, manipulate, and design together. The application combines a professional UI/UX with robust real-time infrastructure and AI-powered natural language canvas manipulation.

### Key Features

- 🎨 Real-time collaborative canvas with shapes, text, and drawing tools
- 👥 Multiplayer presence with cursor tracking and user awareness
- 🤖 AI agent for natural language canvas manipulation (function calling)
- 📊 Project management dashboard with smart organization
- 🌓 System-aware dark mode with user preferences
- 🔗 Human-readable URLs for easy sharing
- 📱 Mobile-responsive design

### What Sets HØRIZON Apart

- **AI-First Design**: Natural language commands to manipulate canvas elements
- **True Real-Time**: Sub-100ms synchronization across all users
- **Collaborative Locking**: Prevents conflicts when multiple users edit simultaneously
- **Sunrise Theme**: Beautiful gradient design with pink/purple/orange hues

---

## Project Context & Timeline

### Development Phases

**Phase 1: MVP (Completed)**

- ✅ Real-time collaborative canvas
- ✅ User authentication
- ✅ Shape creation and manipulation
- ✅ Multiplayer cursors and presence
- ✅ State persistence
- ✅ Deployed on Vercel

**Phase 2: v1.0 UI/UX Redesign (Completed)**

- ✅ Professional homepage with sunrise theme
- ✅ Feature-rich dashboard with project management
- ✅ Smart routing with readable URLs (slug-based)
- ✅ Dark mode support with persistence
- ✅ Trash system with recovery
- ✅ User settings and preferences
- ✅ Shared projects and collaboration invitations

**Phase 3: Advanced Canvas Features (Completed)**

- ✅ Multiple shape types (rect, circle, triangle, line, arrow)
- ✅ Text tool with inline editing
- ✅ Brush/drawing tool with customization and line smoothing
- ✅ Zoom and pan controls (100% - 200%)
- ✅ Layers panel with drag-to-reorder and visibility toggle
- ✅ Smart alignment guides with visual feedback
- ✅ Snap-to-grid with configurable grid sizes
- ✅ Canvas dimension customization (500 - 5000px)

**Phase 4: Polish & Production Readiness (Completed)**

- ✅ AI Agent - Natural language canvas manipulation
- ✅ Unified AI (dashboard + canvas commands)
- ✅ Function calling with OpenAI GPT-4o-mini
- ✅ Memory bank for context persistence
- ✅ 15+ command tools for shape and project operations
- ✅ Lifecycle save system (auto-save on navigate/refresh/close)
- ✅ TypeScript compilation: 0 errors
- ✅ Comprehensive testing documentation (270+ test cases)
- ✅ Security hardening and permissions enforcement

---

## User Stories

### New User

- As a new visitor, I want to see what HØRIZON offers so I can decide to sign up
- As a new user, I want a simple sign-up process so I can start creating quickly
- As a new user, I want to see an empty state with guidance so I know what to do first

### Canvas Creator

- As a designer, I want to create shapes, text, and drawings so I can build my design
- As a designer, I want to use natural language to manipulate elements so I can work faster
- As a designer, I want to pan and zoom the canvas so I can navigate my workspace
- As a designer, I want my work to auto-save so I don't lose progress

### Collaborator

- As a collaborator, I want to see other users' cursors with their names so I know where they're working
- As a collaborator, I want to see changes made by others in real-time so we can work together seamlessly
- As a collaborator, I want objects locked when another user is editing them so we don't conflict
- As a collaborator, I want to receive and accept project invitations so I can join shared projects

### Power User

- As a returning user, I want to see my recent projects immediately so I can resume work
- As a power user, I want to manage all my projects in one place so I stay organized
- As a careful user, I want to recover deleted projects so I don't lose work accidentally
- As a user, I want dark mode so I can work comfortably at any time

---

## Technical Stack

### Frontend

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Canvas**: Konva.js with React-Konva
- **Styling**: CSS Modules with CSS Variables (sunrise theme)
- **AI**: OpenAI GPT-4o-mini (function calling)

### Backend

- **Authentication**: Firebase Authentication
- **Database**: Firestore (projects, shapes, metadata)
- **Real-Time**: Firebase Realtime Database (cursors, presence)
- **Storage**: Firebase Storage (avatars, thumbnails)
- **Security**: Firestore Security Rules + RTDB Rules

### Deployment

- **Hosting**: Vercel (frontend)
- **Functions**: Firebase Cloud Functions (optional)
- **Domain**: Custom domain (optional)

### Key Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "firebase": "^10.x",
  "konva": "^9.x",
  "react-konva": "^18.x",
  "openai": "^4.x",
  "date-fns": "^2.x"
}
```

### Architecture Principles

- **Modular Components**: Feature-based organization
- **Custom Hooks**: Reusable logic (useShapes, useCanvas, useAIAgent)
- **Real-Time First**: Firebase listeners for instant updates
- **Security First**: All secrets in .env, never committed
- **Performance**: Throttled updates, memoization, lazy loading

---

## Core Features

## 1. Authentication

### Sign Up (`/signup`)

**Layout**: Centered card (400px max-width)

**Form Fields**:

- Display Name (required, 3-30 chars)
- Email (required, valid email format)
- Password (required, min 8 chars, show/hide toggle)
- Confirm Password (must match password)
- "Create Account" button (full width, primary)
- "Already have an account? Sign in" link

**Validation**:

- Real-time inline validation
- Clear error messages below fields
- Disabled submit until valid
- Password confirmation match check

**Success Flow**:

1. Create Firebase Auth user
2. Create Firestore user profile with defaults (theme: "system")
3. Redirect to `/dashboard/recent`
4. Show welcome toast

**Error Handling**:

- "Email already in use" → Clear message + link to sign in
- "Passwords do not match" → Show error under confirm password field only
- Network error → Retry button

### Sign In (`/signin`)

**Layout**: Centered card (400px max-width)

**Form Fields**:

- Email (required)
- Password (required, show/hide toggle)
- "Sign In" button (full width, primary)
- "Don't have an account? Sign up" link

**Success Flow**:

1. Authenticate with Firebase
2. Load user preferences (theme, etc.)
3. Redirect to `/dashboard/recent`

**Error Handling**:

- "Invalid credentials" → Single error message (security best practice)
- Too many attempts → "Too many failed attempts. Try again later."

### Theme Enforcement

- Sign-in and sign-up pages: **Always light mode** (forced)
- User preferences (dark/light/system): Only apply after authentication
- Homepage: Light mode by default

---

## 2. Homepage (`/`)

**Route**: Public (accessible without authentication)  
**Redirect**: If authenticated → `/dashboard/recent`

### Layout

```
┌─────────────────────────────────────────────┐
│ [HØRIZON]                    [Sign In]      │
├─────────────────────────────────────────────┤
│                                             │
│         [Sunrise Gradient Animation]        │
│         Real-time collaboration             │
│          for creative teams                 │
│                                             │
│            [Get Started →]                  │
│                                             │
└─────────────────────────────────────────────┘
```

### Header (Fixed, 60px)

- Logo: "HØRIZON" (custom wordmark with Ø)
- Actions: "Sign In" button (darker text for visibility)
- Background: Translucent with backdrop blur on scroll

### Hero Section

- Min height: 80vh
- **Sunrise Animation**:
  - Gradient from top-right (sun position)
  - Colors: Pink, purple, orange, yellow (lighter near sun)
  - Smooth animated transitions
  - Respects `prefers-reduced-motion`
- Headline: "Real-time collaboration for creative teams"
- CTA: "Get Started" → Links to `/signup`

### Design Notes

- No footer (removed "Created by Yahav Corcos")
- Clean, minimal design
- Sunrise theme throughout

---

## 3. Dashboard (`/dashboard/*`)

**Authentication**: Protected (redirect to `/signin` if unauthenticated)

### Route Structure

```
/dashboard → Redirects to /dashboard/recent
  /recent     - 10 most recent projects
  /all        - All projects with pagination
  /shared     - Projects shared with user + collaboration invitations
  /trash      - Soft-deleted projects
  /settings   - User preferences
```

### Layout Structure

```
┌──────────┬──────────────────────────────────┐
│          │  [Create New Project +]          │
│  HØRIZON │                                  │
│          ├──────────────────────────────────┤
├──────────┤                                  │
│ Recent   │   [Projects Area]                │
│ All      │                                  │
│ Shared   │   [Card] [Card] [Card]           │
│ Trash    │   [Card] [Card] [Card]           │
│ Settings │                                  │
│          │                                  │
│ [Avatar] │                                  │
│  Name    │                                  │
│ Sign Out │                                  │
└──────────┴──────────────────────────────────┘
```

### Sidebar (Fixed, 240px)

**Sections**:

1. **Logo**: "HØRIZON" wordmark → Clickable → `/dashboard/recent`
2. **Create Button**: "+ Create New Project" → `/canvas/[new-project-id]`
3. **Navigation Links** (no icons):
   - Recent
   - All Projects
   - Shared
   - Trash
   - Settings
   - Active state: Background highlight + bold text
4. **User Section** (bottom):
   - Avatar (circular, 40px) - Initials-based, no upload
   - Display name
   - "Sign Out" button

**Mobile Behavior** (<768px):

- Sidebar collapses to hamburger menu
- Overlay sidebar on open

---

### Recent Projects (`/dashboard/recent`)

**Display**:

- Show 10 most recent projects (sorted by `updatedAt` DESC)
- Exclude soft-deleted projects (`deletedAt === null`)

**Empty State**:

```
No recent projects
Create your first canvas to get started
[Create New Project]
```

**Project Card** (Grid: 3 columns desktop, 2 tablet, 1 mobile):

```
┌────────────────────┐
│   [Thumbnail]      │ ← 16:9, canvas snapshot
├────────────────────┤
│ Project Name       │
│ Edited 2h ago      │
│               [···]│ ← Actions menu
└────────────────────┘
```

**Thumbnail**:

- Generated from canvas using `generateKonvaThumbnail`
- Fallback: Gradient with project initial
- Lazy loading

**Click Behavior**:

- Click card → Navigate to `/canvas/[project-id]` (uses static UUID)

**Actions Menu (···)**:

- Open in New Tab
- Send Project Access (opens collaboration modal)
- Delete Project (moves to trash)

---

### All Projects (`/dashboard/all`)

**Display**:

- Show all non-deleted projects owned by or shared with user
- Pagination: 20 projects per page
- Sorted by `updatedAt` DESC

**Controls Bar**:

```
[Search: ________] [Sort: Last Modified ▼]
```

**Search**:

- Debounced (300ms)
- Filters by project name (case-insensitive)

**Sort Options**:

- Last Modified (default)
- Name (A-Z)
- Name (Z-A)
- Date Created (newest/oldest)

**Empty State**:

```
No projects yet
Create your first canvas to get started
[Create New Project]
```

---

### Shared Projects (`/dashboard/shared`)

**Display**:

- Projects where user is in `collaborators` array
- Badge indicating role: "Collaborator" or "Host"

**Collaboration Invitations Section** (minimizable):

- Shows pending invitations chronologically
- Unread count indicator
- Accept/Deny buttons
- Accept → Adds user to project, redirects to canvas

**Empty State**:

```
No shared projects
When someone shares a project with you, it will appear here
```

**Project Access**:

- Users can open shared projects from this page
- Only host can delete projects
- All collaborators can edit

---

### Trash (`/dashboard/trash`)

**Display**:

- Projects where `deletedAt !== null`
- Sorted by `deletedAt` DESC
- List view (not grid)

**Layout**:

```
┌─────────────────────────────────────────────┐
│ Project Name        Deleted 2 days ago      │
│ [Recover] [Delete Forever]                  │
└─────────────────────────────────────────────┘
```

**Actions**:

- **Recover**: Sets `deletedAt = null`, returns to All Projects
- **Delete Forever**:
  - Popup confirmation (not alert): "Type project name to confirm"
  - Permanently deletes project + all data
  - Only owner can delete forever

**Empty State**:

```
Trash is empty
Deleted projects will appear here
```

---

### Settings (`/dashboard/settings`)

**Layout**: Single column form, max-width 600px

#### Profile Section

```
┌─────────────────────────────────────┐
│ Profile                             │
├─────────────────────────────────────┤
│ [Avatar]    (Initials-based)        │
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

**Display Name**:

- Editable text input
- 3-30 characters
- Updates in real-time for other users

**Email**: Read-only (Firebase Auth restriction)

#### Preferences Section

```
┌─────────────────────────────────────┐
│ Preferences                         │
├─────────────────────────────────────┤
│ Theme                               │
│ ○ Auto (system)                     │
│ ○ Light                             │
│ ○ Dark                              │
│                                     │
│ [Save Preferences]                  │
└─────────────────────────────────────┘
```

**Theme Toggle**:

- Radio buttons (single choice)
- **Default for new users**: System
- **Persistence**: localStorage + Firestore
- Apply immediately (no page reload)
- **Sign-in/Sign-up pages**: Always light mode (theme not applied)

#### Account Section

```
┌─────────────────────────────────────┐
│ Account                             │
├─────────────────────────────────────┤
│ Change Password                     │
│                                     │
│ Current Password                    │
│ [________________]                  │
│                                     │
│ New Password                        │
│ [________________]                  │
│                                     │
│ Confirm New Password                │
│ [________________]                  │
│                                     │
│ [Update Password] [Cancel]          │
│                                     │
│ [Delete Account]                    │
└─────────────────────────────────────┘
```

**Change Password**:

- Inline form (not modal)
- Current password (required for reauthentication)
- New password (min 8 chars)
- Confirm new password (must match)
- Firebase Auth password update
- No alert on success (silent update)

**Delete Account**:

- Popup confirmation: Type "DELETE" to confirm
- Deletes all user projects
- Deletes user auth + profile
- Signs out and redirects to homepage

---

## 4. Canvas System

### URL Structure

**Pattern**: `/canvas/[project-id]`

- Uses static UUID for project identification
- Never changes, even when project is renamed
- Enables reliable sharing and bookmarking

### Canvas Page Layout

**Left Sidebar** (240px):

```
┌─────────────────────┐
│ File Menu           │
│ ─────────────────── │
│ Save                │
│ Copy                │
│ Paste               │
│ Undo                │
│ Redo                │
│ New Project         │
│ Export as PNG       │
│ Export as PDF       │
│                     │
│ ─────────────────── │
│ Pages               │
│ ─────────────────── │
│ ➕ Add New Page     │
│ ▸ Page 1            │
│ ▸ Page 2            │
│                     │
└─────────────────────┘
```

**File Menu**:

- Dropdown with keyboard shortcuts
- All options follow standard logic
- Save: Manual save (also auto-saves on changes)
- Copy/Paste: Clipboard operations
- Undo/Redo: History management
- New Project: Create new blank canvas
- Export: PNG/PDF download

**Pages Section**:

- User can add multiple pages per project
- Default name: "Page 1", "Page 2", etc.
- Renameable (click to edit)
- Each page has its own canvas
- Three-dot menu per page: Rename, Copy, Delete
- Right-click empty space: Paste copied page
- Pages persist across sessions (saved to project)
- Unique names enforced (no duplicates)
- First page always selected on project open

**Top Bar** (Fixed, 60px):

```
┌─────────────────────────────────────────────┐
│ [← Back] Project Name    [Add Collaborators]│
└─────────────────────────────────────────────┘
```

- **Back Button**: `←` → `/dashboard/recent`
- **Project Name**:
  - Click to edit inline
  - Auto-saves on blur/enter
  - Default for new: "Untitled Project #"
  - Unsaved indicator (\*) appears when changes pending
- **Add Collaborators**: Opens invitation modal (email-based)

**Bottom Toolbar** (Fixed, 60px):

```
┌──────────────────────────────────────────────┐
│ [Cursor▼] [Shape▼] [Text] [Brush▼] [Zoom▼] [Delete] [Color]│
└──────────────────────────────────────────────┘
```

**Tools**:

1. **Cursor Tool** (dropdown):

   - Move: Select, move, resize, rotate objects
   - Hand: Pan around canvas
   - Split button: Click icon for last used, click arrow for dropdown
   - Persistent selection across sessions

2. **Shape Tool** (dropdown):

   - Rectangle, Circle, Triangle, Line, Arrow
   - Image Upload (special option)
   - Crosshair cursor when active
   - Default color: Red
   - Split button behavior
   - Can select color before creating

3. **Text Tool** (no dropdown):

   - Click and drag to create text box
   - Inline editing with toolbar

4. **Brush Tool** (dropdown):

   - Free-form drawing
   - Brush icon (actual brush, not pencil)
   - Cursor shows circle matching color/size
   - Settings: Color, size, opacity
   - Toolbar appears when active

5. **Zoom Tool** (dropdown):

   - 50%, 75%, 100% (default), 125%, 150%, 200%
   - Zoom to Fit
   - Functional zoom in/out
   - Resets to 100% on page refresh

6. **Delete Button**: Deletes selected object(s)

7. **Color Picker**: Select color for shapes/text/brush

**Right Panel** (280px, draggable & minimizable):

**Tabs**:

1. **Design Tab** (dynamic based on selection):

   - **No selection**: Canvas settings
     - Background color
     - Canvas width/height (500-5000px, auto-correct)
     - Export buttons
   - **Shape selected**: Shape properties
     - Width/height manipulation
     - Color
   - **Text selected**: Text properties
     - Width/height manipulation
     - Font selection
     - Bold, Italic, Underline
     - Font color
     - Font size
   - **Multiple selection**: Group actions
     - Delete button
   - **Brush tool**: No design panel (uses floating toolbar)

2. **Online Tab** (shows active user count):
   - List of all users currently on this project
   - Avatar + name
   - Real-time updates
   - Clean, presentable layout
   - No hover states

**Canvas Area**:

```
┌──────────────────────────────────────┐
│ ░░░░░░ [Canvas Workspace] ░░░░░░░░░ │
│ ░░░░┌────────────────────┐░░░░░░░░░ │
│ ░░░░│                    │░░░░░░░░░ │
│ ░░░░│   Canvas (White)   │░░░░░░░░░ │
│ ░░░░│                    │░░░░░░░░░ │
│ ░░░░└────────────────────┘░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────┘
```

- **Background**: Dark gray (not editable)
- **Canvas**: Document-style page (default 800x1200px, white)
- **Default View**: Canvas centered, padding on all sides
- **Scrolling**: Vertical scroll if canvas exceeds viewport
- **Panning**: Hand tool for all directions
- **Zooming**: Smooth zoom with proper centering

### Canvas Dimensions

**Defaults**: 800x1200px (document-style)
**Range**: 500 - 5000px (width and height)
**Auto-Correction**: Values outside range automatically corrected on blur
**Persistence**: Saved to project, loaded on open

### Canvas Tools Behavior

**Move Tool**:

- Select shapes by clicking
- Multi-select by drag-box
- Resize from corners/edges
- Rotate from corner handles
- Move by dragging
- Deselect by clicking background

**Hand Tool**:

- Click and drag to pan
- Works in any direction
- Required when canvas exceeds viewport

**Shape Creation**:

- Crosshair cursor
- Click and drag to create
- Default color: Red (or selected color)
- Immediately added to canvas and synced

**Text Tool**:

- Click and drag to size text box
- Auto-focus for typing
- Rich text editing
- Font controls in right panel

**Brush Tool**:

- Draws only when mouse button held
- Floating toolbar with:
  - Color picker
  - Size slider
  - Opacity slider
- Cursor preview matches settings

**Image Upload**:

- File picker (PNG, JPG, JPEG)
- Appears on canvas at scale
- Resizable with move tool

### Keyboard & Context Menu

**Keyboard Shortcuts**:

- Copy: Cmd/Ctrl+C
- Paste: Cmd/Ctrl+V
- Cut: Cmd/Ctrl+X
- Delete: Delete/Backspace
- Undo: Cmd/Ctrl+Z
- Redo: Cmd/Ctrl+Shift+Z

**Right-Click Menu**:

- On empty space: Paste (if clipboard has content)
- On selected object: Cut, Copy, Delete

---

## 5. Collaboration Features

### Real-Time Synchronization

**Shape Updates**:

- Broadcast all changes to Firestore
- All users receive updates via `onSnapshot`
- Sub-100ms latency for operations

**Cursor Tracking**:

- Firebase Realtime Database for low latency
- Throttled to 2 updates/second
- Computer arrow icon (bigger size)
- Color-coded per user

**Presence System**:

- Real-time user join/leave detection
- Auto-cleanup on disconnect
- Shows in Online tab

### Collaborative Object Locking

**Locking Mechanism**:

- Shape has `selectedBy`, `selectedByName`, `selectedByColor`, `selectedAt` fields
- When User A selects object, fields set to User A's info
- Other users cannot select/edit locked objects
- Visual indicator: Locked objects show user's name/color

**Selection Rules**:

- Only one user can select an object at a time
- Click background to deselect (clears lock)
- Lock automatically clears on deselection
- Real-time lock status synced across all users

**Conflict Prevention**:

- Move tool: Check lock before allowing interaction
- Delete: Only owner of lock can delete
- Update: Only owner of lock can modify

### Collaboration Invitations

**Sending Invitations**:

- "Add Collaborators" button in canvas top bar
- Modal popup with email input
- Validates email format
- Checks for duplicate pending invitations
- Creates notification for recipient
- Project must be saved before sharing

**Receiving Invitations**:

- Appears in Shared page under "Collaboration Invitations"
- Also shows in Notifications panel
- Accept/Deny buttons
- Accept → Adds user to `collaborators` array, redirects to canvas
- Deny → Removes invitation, allows resend

**Invitation Rules**:

- Cannot send duplicate invitations (pending or accepted)
- Can resend after user denies
- Invitation persists until accepted/denied
- Only valid emails accepted

### Project Permissions

**Owner** (creator):

- Full edit access
- Can delete project
- Can add/remove collaborators
- Can rename project

**Collaborator** (invited):

- Full edit access to canvas
- Cannot delete project
- Can view all collaborators
- Project appears in Shared, Recent, All Projects pages

---

## 6. AI Agent: Natural Language Canvas Manipulation

**Status**: 🎯 Current Phase  
**Model**: OpenAI GPT-4o-mini  
**Purpose**: Allow users to manipulate canvas through natural language commands

### Overview

The AI Agent enables users to interact with the canvas using natural language, powered by OpenAI's function calling capabilities. It follows the **ReAct** (Reason-Act-Observe) pattern and integrates seamlessly with existing canvas state management.

### Core Principles

- **Tool Calling**: Bridge between reasoning and execution
- **Agent Loop**: Reason → Act → Observe → Think again
- **Memory Bank**: Maintain context about canvas state and user intent
- **Determinism**: Ensure accuracy through structured function calls
- **Security**: API key protected, serverless proxy recommended for production

### Technical Architecture

#### Components

**AICommandBar** (new component):

- Floating command input bar
- Keyboard shortcut: `Cmd/Ctrl+K`
- Real-time status feedback
- Error handling and retry logic
- Positioned non-intrusively on canvas

#### AI Service Layer

**Configuration**:

- **Model**: `gpt-4o-mini` (fast, cost-effective)
- **Max Tokens**: 1000 per request
- **Temperature**: 0.2 (deterministic)
- **Latency Target**: <2s per command
- **Security**:
  - API key in `.env` (`VITE_OPENAI_API_KEY`)
  - Feature flag: `VITE_ENABLE_AI_AGENT=true`
  - Serverless proxy recommended for production (see SECURITY.md)

#### Function Calling Tools

Minimum 8 tools required for excellent implementation:

**Shape Manipulation**:

1. **createShape**

   ```typescript
   (type: 'rect'|'circle'|'triangle', x: number, y: number,
    width: number, height: number, color?: string)
   ```

   Example: "Create a red rectangle at 100,100 with size 200x150"

2. **deleteShape**

   ```typescript
   (id: string)
   ```

   Example: "Delete the selected shape"

3. **updateShape**

   ```typescript
   (id: string, updates: Partial<Shape>)
   ```

   Example: "Make it blue" or "Move it to 300,200"

4. **duplicateShape**
   ```typescript
   (id: string, offsetX?: number, offsetY?: number)
   ```
   Example: "Duplicate this shape 50 pixels to the right"

**Selection & Organization**:

5. **selectShape**

   ```typescript
   (query: string) // e.g., "the blue circle", "all rectangles"
   ```

   Uses fuzzy matching on shape properties

6. **selectAll**

   ```typescript
   (type?: ShapeType)
   ```

   Example: "Select all circles"

7. **clearSelection**
   ```typescript
   ()
   ```
   Example: "Deselect everything"

**Advanced Operations**:

8. **rotateSelection**

   ```typescript
   (degrees: number)
   ```

   Example: "Rotate the selected shape 45 degrees"

9. **alignShapes** (bonus)

   ```typescript
   (alignment: 'left'|'center'|'right'|'top'|'middle'|'bottom')
   ```

   Example: "Align all selected shapes to the left"

10. **distributeShapes** (bonus)
    ```typescript
    (direction: 'horizontal'|'vertical')
    ```
    Example: "Distribute them evenly horizontally"

### Memory Bank Integration

**Directory Structure**:

```
memoryBank/
  defaults.json        # Default canvas settings, color palette
  templates/
    card.json          # Template for card shapes
  context.md           # Current project context, user preferences
```

**Memory Updates**:

- After each command execution
- Maintains state continuity across commands
- Stores user preferences and patterns

### User Experience

#### Activation

- **Keyboard**: `Cmd/Ctrl+K` opens command bar
- **UI**: Floating button in canvas area
- **Feature Flag**: Must be enabled in `.env`

#### Interaction Flow

1. User types natural language command
2. AI reasons about intent and available tools
3. Function(s) executed on canvas
4. Visual feedback + confirmation message
5. Context updated in memory bank

#### Example Commands

- "Create a blue rectangle at the center"
- "Make all circles red"
- "Delete the shape at 500,300"
- "Duplicate this and move it 100px right"
- "Rotate the selected triangle 90 degrees"
- "Align all shapes to the top"
- "Create a card template" (uses templates/card.json)

### Error Handling

- **Invalid Commands**: Provide suggestions for correct syntax
- **Ambiguous Queries**: Ask for clarification (e.g., "Which circle?")
- **Locked Shapes**: Inform user if shape is locked by another collaborator
- **Rate Limits**: Queue commands and show progress indicator

### Evaluation Criteria

**Excellent** (Target):

- ✅ 8+ distinct tools implemented
- ✅ Latency <2s for 90% of commands
- ✅ Handles ambiguous queries gracefully
- ✅ Memory bank persists context
- ✅ Error handling with actionable feedback
- ✅ Works seamlessly with real-time collaboration (respects locks)
- ✅ Includes templates for common shapes
- ✅ Comprehensive logging for debugging

### Security Considerations

- **API Key Protection**: Never commit `VITE_OPENAI_API_KEY` to Git
- **Production Setup**: Use serverless proxy (Vercel API route) to hide key from browser
- **Rate Limiting**: Implement user-based rate limits (e.g., 50 commands/hour)
- **Input Validation**: Sanitize user input before passing to LLM

### Performance Targets

- Command parsing: <500ms
- Function execution: <1s
- Total latency: <2s
- Memory bank update: <200ms (async)

### Implementation Phases

**Phase 1: Core Infrastructure** (2-3 hours)

- Set up OpenAI client with function calling
- Create `useAIAgent` hook
- Implement 4 basic tools (create, delete, update, select)
- Build `AICommandBar` component

**Phase 2: Advanced Tools** (1-2 hours)

- Add rotation, duplication, alignment
- Integrate memory bank (defaults.json, templates)
- Implement fuzzy selection queries

**Phase 3: Polish & Testing** (1-2 hours)

- Error handling and retries
- Latency optimization
- Integration with collaboration (lock detection)
- Add logging and observability

### Files to Create

```
src/
  components/
    AICommandBar/
      AICommandBar.tsx
      AICommandBar.css
  hooks/
    useAIAgent.ts
  services/
    aiAgent.ts
    openai.ts
  types/
    ai.ts
memoryBank/
  defaults.json
  templates/
    card.json
  context.md
```

### Integration Points

- **CanvasPage.tsx**: Wire `AICommandBar` below toolbar
- **useShapes.ts**: Expose shape manipulation functions to AI service
- **useProjectManagement.ts**: Update memory bank after saves
- **Canvas.tsx**: Highlight shapes selected by AI commands

---

## Design System

### Brand Identity

**Name**: HØRIZON (with Ø character)  
**Theme**: Sunrise-inspired with gradient hues

### Color Palette

**Sunrise Colors**:

```css
/* Light Mode */
--sunrise-pink: #ff6b9d;
--sunrise-purple: #c44569;
--sunrise-orange: #ffa502;
--sunrise-yellow: #ffc048;
--sunrise-light: #ffeaa7;

/* Sunrise Gradient (from sun in top-right) */
background: radial-gradient(
  circle at top right,
  var(--sunrise-yellow) 0%,
  var(--sunrise-orange) 25%,
  var(--sunrise-pink) 50%,
  var(--sunrise-purple) 100%
);
```

**Base Colors**:

```css
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-elevated: #ffffff;
  --border: #e0e0e0;

  /* Text */
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #999999;

  /* Accent */
  --accent: #ffa502;
  --accent-hover: #ff8c00;

  /* Status */
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
  --accent: #ffa502;
  --accent-hover: #ffb732;
  --danger: #ef4444;
  --success: #22c55e;
  --warning: #fbbf24;
}
```

### Typography

```css
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

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing & Layout

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */

--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

### Z-Index Hierarchy

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

## Performance & Accessibility

### Performance Requirements

**Metrics Targets**:

- Lighthouse Performance: >90
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s
- Cumulative Layout Shift: <0.1

**Optimization Strategies**:

- Route-based code splitting
- Lazy loading for images and thumbnails
- Virtual scrolling for long project lists (>100 items)
- Memoization for expensive components
- Debounced search queries (300ms)
- Throttled cursor updates (2 updates/second)

### Accessibility (WCAG 2.1 AA)

**Keyboard Navigation**:

- Logical tab order
- Visible focus indicators
- Keyboard shortcuts documented

**Screen Reader Support**:

- Semantic HTML elements
- ARIA labels on icon-only buttons
- ARIA live regions for notifications
- Skip links for navigation

**Color Contrast**:

- Text: Minimum 4.5:1 ratio
- UI components: Minimum 3:1 ratio
- Tested in both light and dark modes

**Forms**:

- All inputs have visible labels
- Error messages use `aria-describedby`
- Required fields marked with `aria-required`

---

## Security

### Firebase Security Rules

**Firestore Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    // User profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId;
    }

    // Projects
    match /projects/{projectId} {
      allow read: if isAuthenticated();

      allow create: if isAuthenticated() &&
        request.resource.data.ownerId == request.auth.uid;

      allow update: if isAuthenticated() && (
        resource.data.ownerId == request.auth.uid ||
        request.auth.uid in resource.data.collaborators ||
        (request.auth.uid in request.resource.data.collaborators &&
         !(request.auth.uid in resource.data.collaborators))
      );

      allow delete: if isAuthenticated() &&
        resource.data.ownerId == request.auth.uid;
    }
  }
}
```

**Realtime Database Rules**:

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

### Environment Variables

**Required in `.env`**:

```bash
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com

# AI Agent
VITE_ENABLE_AI_AGENT=true
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Security Best Practices

- ✅ All secrets in `.env`, never committed
- ✅ `.env` and `.env.*` in `.gitignore` and `.cursorignore`
- ✅ Input sanitization for user-generated content
- ✅ Firebase security rules enforce access control
- ✅ Rate limiting for critical operations (future)
- ✅ Serverless proxy for AI API key in production (recommended)

**See `SECURITY.md` for detailed security guidelines.**

---

## Testing Strategy

### Unit Tests

- Utility functions (slug generation, validation, alignment)
- React hooks (useCanvas, useShapes, useAIAgent)
- Form validation logic
- AI agent tool functions

### Integration Tests

- Authentication flow (sign up, sign in, sign out)
- Project CRUD operations
- Routing and navigation
- Dark mode toggle
- Collaboration invitations

### End-to-End Tests

**Critical User Flows**:

1. Sign up → Create project → Add shapes → Save
2. Invite collaborator → Accept invitation → Edit together
3. Use AI agent commands → Verify execution
4. Move project to trash → Recover
5. Multi-user real-time sync test

### Manual Testing Checklist

- [ ] Homepage animations and sunrise theme
- [ ] Sign up/sign in flows
- [ ] Create, rename, delete projects
- [ ] All canvas tools (shape, text, brush, zoom)
- [ ] Multi-user collaboration with locking
- [ ] AI agent commands (8+ tools)
- [ ] Dark mode persistence
- [ ] Mobile responsiveness
- [ ] Keyboard shortcuts
- [ ] Performance on slow network

---

## Deployment & Success Metrics

### Deployment

**Platform**: Vercel  
**Build Command**: `npm run build`  
**Output Directory**: `dist`  
**Environment Variables**: Set in Vercel dashboard

**Pre-Launch Checklist**:

- [ ] All features implemented and tested
- [ ] Performance audit passed (Lighthouse >90)
- [ ] Security rules deployed
- [ ] Environment variables configured
- [ ] Cross-browser testing complete
- [ ] Mobile testing on iOS/Android

### Success Metrics

**Primary KPIs**:

1. User Activation: % creating first project (Target: >80%)
2. Retention: % returning within 7 days (Target: >40%)
3. Collaboration: % of projects with >1 user (Target: >20%)
4. AI Adoption: % of users trying AI agent (Target: >50%)

**Technical Metrics**:

1. Lighthouse score (Target: >90)
2. Uptime (Target: >99.5%)
3. Error rate per session (Target: <0.1%)
4. AI command latency (Target: <2s for 90%)

---

## Roadmap

### Completed Features ✅

**MVP**:

- Real-time collaborative canvas
- User authentication
- Shape creation and manipulation
- Multiplayer cursors and presence
- State persistence

**v1.0**:

- Professional homepage with sunrise theme
- Dashboard with project management
- Smart routing with slugs
- Dark mode support
- Trash system with recovery
- Shared projects and collaboration

**v1.5**:

- Multiple shape types
- Text and brush tools
- Zoom and pan controls
- Multi-page canvas projects
- Canvas customization

### Current Phase 🎯

**AI Agent Feature**:

- Natural language canvas manipulation
- 8+ function calling tools
- Memory bank integration
- <2s latency target

### Future Enhancements 🔮

**v2.0** (Post-AI Agent):

- Voice input for AI commands
- Multi-step command chains
- Custom user templates
- LangSmith integration for observability
- Advanced shape tools (bezier curves, custom polygons)

**v2.5**:

- Comments and mentions
- Version history
- Advanced grid and guides
- Snap-to-grid
- Component library

**v3.0**:

- Component system (reusable elements)
- Design tokens
- Developer handoff
- API access
- Team workspaces

---

## Appendix

### Known Limitations

**Accepted for Current Version**:

- Desktop-focused (mobile functional but not optimized)
- English only
- No offline mode
- Basic shape types (no bezier curves)
- Single canvas workspace per page

### Glossary

- **Slug**: URL-friendly version of project name (now deprecated, using UUID)
- **Soft Delete**: Marking item as deleted without removing from database
- **Presence**: Real-time indication of online users
- **Function Calling**: LLM technique for executing structured commands
- **Memory Bank**: Persistent context storage for AI agents
- **ReAct**: Reasoning and Acting loop for AI agents

### Resources

- **GitHub Repository**: https://github.com/yahavco/collabcanvas
- **Firebase Console**: https://console.firebase.google.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **OpenAI API Docs**: https://platform.openai.com/docs

### Document History

- **v1.0** (MVP): Initial collaborative canvas
- **v1.5** (UI/UX): Dashboard and advanced features
- **v2.0** (Current): AI Agent integration

---

**Document Owner**: Yahav Corcos  
**Last Review**: October 17, 2025  
**Next Review**: After AI Agent Implementation

---

_This PRD is a living document and will be updated as the project evolves._
