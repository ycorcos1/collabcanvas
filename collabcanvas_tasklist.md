# CollabCanvas MVP - Task List & PR Breakdown

## Project File Structure

```
collabcanvas/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasControls.tsx
│   │   │   └── Shape.tsx
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── AuthProvider.tsx
│   │   ├── Cursors/
│   │   │   ├── MultipleCursors.tsx
│   │   │   └── Cursor.tsx
│   │   ├── Presence/
│   │   │   └── UserPresence.tsx
│   │   └── Toolbar/
│   │       └── Toolbar.tsx
│   ├── hooks/
│   │   ├── useCanvas.ts
│   │   ├── useCursors.ts
│   │   ├── usePresence.ts
│   │   └── useShapes.ts
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   ├── cursors.ts
│   │   ├── shapes.ts
│   │   └── presence.ts
│   ├── types/
│   │   ├── canvas.ts
│   │   ├── shape.ts
│   │   ├── user.ts
│   │   └── cursor.ts
│   ├── utils/
│   │   ├── throttle.ts
│   │   └── canvasHelpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── firebase.json
├── .firebaserc
└── README.md
```

---

## PR #1: Project Setup & Initial Configuration
**Goal:** Set up the React + TypeScript + Vite project with Firebase integration

### Tasks:
- [ ] Initialize Vite project with React + TypeScript template
  - **Command:** `npm create vite@latest collabcanvas -- --template react-ts`
  - **Files created:** `package.json`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`

- [ ] Install core dependencies
  - **Command:** `npm install firebase react-konva konva`
  - **Files modified:** `package.json`

- [ ] Install dev dependencies
  - **Command:** `npm install -D @types/node`
  - **Files modified:** `package.json`

- [ ] Create Firebase project in Firebase Console
  - Create new project
  - Enable Authentication (Email/Password)
  - Create Firestore database
  - Create Realtime Database
  - Copy configuration

- [ ] Set up Firebase configuration
  - **Files created:** `src/services/firebase.ts`, `.env.example`, `.env`
  - **Content:** Initialize Firebase app, export auth, firestore, and database instances

- [ ] Create TypeScript type definitions
  - **Files created:** `src/types/user.ts`, `src/types/canvas.ts`, `src/types/shape.ts`, `src/types/cursor.ts`
  - **Content:** Define User, Shape, Cursor, and Canvas types

- [ ] Set up basic file structure
  - **Directories created:** `src/components/`, `src/hooks/`, `src/services/`, `src/types/`, `src/utils/`

- [ ] Update .gitignore
  - **Files modified:** `.gitignore`
  - **Content:** Add `.env`, `node_modules/`, `dist/`, `.firebase/`

- [ ] Create README with setup instructions
  - **Files created:** `README.md`
  - **Content:** Project overview, setup steps, environment variables needed

- [ ] Initial commit and verify build
  - **Command:** `npm run dev` (verify it works)
  - **Command:** `npm run build` (verify it builds)

---

## PR #2: Authentication System
**Goal:** Implement user authentication with Firebase Auth

### Tasks:
- [ ] Create authentication service
  - **Files created:** `src/services/auth.ts`
  - **Content:** Functions for login, logout, signup, getCurrentUser

- [ ] Create AuthProvider component
  - **Files created:** `src/components/Auth/AuthProvider.tsx`
  - **Content:** Context provider for auth state, hooks for auth methods

- [ ] Create Login component
  - **Files created:** `src/components/Auth/Login.tsx`
  - **Content:** Simple login/signup form (email + password + display name)

- [ ] Update App.tsx with authentication flow
  - **Files modified:** `src/App.tsx`
  - **Content:** Wrap app in AuthProvider, show Login if not authenticated

- [ ] Add auth state persistence
  - **Files modified:** `src/services/auth.ts`
  - **Content:** Use Firebase's onAuthStateChanged listener

- [ ] Test authentication flow
  - Verify login works
  - Verify signup works
  - Verify logout works
  - Verify refresh maintains auth state

---

## PR #3: Basic Canvas with Pan & Zoom
**Goal:** Implement canvas rendering with Konva.js and pan/zoom controls

### Tasks:
- [ ] Create Canvas component
  - **Files created:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Konva Stage and Layer setup, basic 3000x3000 workspace

- [ ] Implement pan functionality
  - **Files modified:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Add draggable Stage, handle mouse drag events

- [ ] Implement zoom functionality
  - **Files modified:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Add wheel event listener, zoom to mouse pointer

- [ ] Create canvas utilities
  - **Files created:** `src/utils/canvasHelpers.ts`
  - **Content:** Helper functions for coordinate transformations, zoom calculations

- [ ] Add visual grid or background
  - **Files modified:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Optional grid or background color for orientation

- [ ] Create useCanvas hook
  - **Files created:** `src/hooks/useCanvas.ts`
  - **Content:** Hook to manage canvas state (position, scale, etc.)

- [ ] Test performance
  - Verify 60 FPS during pan
  - Verify 60 FPS during zoom
  - Test on slower devices/browsers

---

## PR #4: Shape Creation & Local Manipulation
**Goal:** Add ability to create and move rectangles (no sync yet)

### Tasks:
- [ ] Create Shape component
  - **Files created:** `src/components/Canvas/Shape.tsx`
  - **Content:** Konva Rect component with drag handlers

- [ ] Create Toolbar component
  - **Files created:** `src/components/Toolbar/Toolbar.tsx`
  - **Content:** Simple button to create rectangles

- [ ] Implement shape creation
  - **Files modified:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Add click handler to create shape at mouse position

- [ ] Add shape state management
  - **Files created:** `src/hooks/useShapes.ts`
  - **Content:** Local state for shapes array, add/update/remove functions

- [ ] Implement shape dragging
  - **Files modified:** `src/components/Canvas/Shape.tsx`
  - **Content:** Add onDragMove and onDragEnd handlers

- [ ] Add shape selection
  - **Files modified:** `src/components/Canvas/Shape.tsx`
  - **Content:** Click to select, show visual indicator (stroke/highlight)

- [ ] Generate unique IDs for shapes
  - **Files modified:** `src/hooks/useShapes.ts`
  - **Content:** Use crypto.randomUUID() or similar for shape IDs

- [ ] Test local shape manipulation
  - Verify shapes can be created
  - Verify shapes can be moved
  - Verify shapes can be selected

---

## PR #5: Firebase Database Schema & Services
**Goal:** Set up Firestore structure and service layer for shapes

### Tasks:
- [ ] Design Firestore schema
  - **Structure:** 
    - `/canvases/{canvasId}` (document)
    - `/canvases/{canvasId}/shapes/{shapeId}` (subcollection)

- [ ] Create shapes service
  - **Files created:** `src/services/shapes.ts`
  - **Content:** CRUD functions for shapes (create, update, delete, subscribe)

- [ ] Set up Firestore security rules
  - **Files created:** `firestore.rules`
  - **Content:** Basic rules allowing authenticated users to read/write

- [ ] Deploy Firestore rules
  - **Command:** `firebase deploy --only firestore:rules`

- [ ] Create shape sync utilities
  - **Files modified:** `src/services/shapes.ts`
  - **Content:** Functions to convert between Firestore data and local shape objects

- [ ] Test Firestore connection
  - Verify writes work
  - Verify reads work
  - Verify authentication is enforced

---

## PR #6: Real-Time Shape Synchronization
**Goal:** Sync shape creation and movement across all users

### Tasks:
- [ ] Implement shape creation sync
  - **Files modified:** `src/hooks/useShapes.ts`
  - **Content:** Call Firebase service on shape creation, update local state

- [ ] Implement shape listener
  - **Files modified:** `src/hooks/useShapes.ts`
  - **Content:** Subscribe to Firestore onSnapshot for shapes collection

- [ ] Handle shape updates from other users
  - **Files modified:** `src/hooks/useShapes.ts`
  - **Content:** Update local state when remote changes detected

- [ ] Implement shape movement sync
  - **Files modified:** `src/components/Canvas/Shape.tsx`
  - **Content:** Update Firestore on dragEnd event

- [ ] Add optimistic updates
  - **Files modified:** `src/hooks/useShapes.ts`
  - **Content:** Update local state immediately, then sync to Firebase

- [ ] Implement conflict resolution (last write wins)
  - **Files modified:** `src/hooks/useShapes.ts`
  - **Content:** Accept all remote updates as source of truth

- [ ] Add loading states
  - **Files modified:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Show loading indicator while fetching initial shapes

- [ ] Test multi-user shape sync
  - Open two browser windows
  - Create shape in window 1, verify it appears in window 2
  - Move shape in window 2, verify it updates in window 1
  - Test with 3+ windows

---

## PR #7: Multiplayer Cursors
**Goal:** Show real-time cursor positions for all connected users

### Tasks:
- [ ] Set up Firebase Realtime Database schema
  - **Structure:** `/cursors/{canvasId}/{userId}` with {x, y, name, color}

- [ ] Create cursors service
  - **Files created:** `src/services/cursors.ts`
  - **Content:** Functions to update and subscribe to cursor positions

- [ ] Create throttle utility
  - **Files created:** `src/utils/throttle.ts`
  - **Content:** Throttle function to limit cursor update frequency

- [ ] Create Cursor component
  - **Files created:** `src/components/Cursors/Cursor.tsx`
  - **Content:** SVG cursor with username label

- [ ] Create MultipleCursors component
  - **Files created:** `src/components/Cursors/MultipleCursors.tsx`
  - **Content:** Container that renders all user cursors

- [ ] Create useCursors hook
  - **Files created:** `src/hooks/useCursors.ts`
  - **Content:** Hook to manage cursor positions, subscribe to updates

- [ ] Implement cursor position tracking
  - **Files modified:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Add onMouseMove handler, throttle updates to 50ms

- [ ] Broadcast cursor position to Firebase
  - **Files modified:** `src/hooks/useCursors.ts`
  - **Content:** Update Realtime DB on throttled mouse move

- [ ] Render other users' cursors
  - **Files modified:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Render MultipleCursors component overlay

- [ ] Add cursor cleanup on disconnect
  - **Files modified:** `src/services/cursors.ts`
  - **Content:** Use onDisconnect() to remove cursor when user leaves

- [ ] Test cursor sync
  - Open two windows
  - Move mouse in window 1, verify cursor appears in window 2
  - Verify cursor disappears when window closes
  - Test latency (should be <50ms)

---

## PR #8: Presence System
**Goal:** Show list of currently online users

### Tasks:
- [ ] Set up presence schema in Realtime Database
  - **Structure:** `/presence/{canvasId}/{userId}` with {name, color, online, lastSeen}

- [ ] Create presence service
  - **Files created:** `src/services/presence.ts`
  - **Content:** Functions to set online status, subscribe to presence

- [ ] Create UserPresence component
  - **Files created:** `src/components/Presence/UserPresence.tsx`
  - **Content:** List of online users with colored indicators

- [ ] Create usePresence hook
  - **Files created:** `src/hooks/usePresence.ts`
  - **Content:** Hook to manage presence state and online users list

- [ ] Implement presence on connection
  - **Files modified:** `src/hooks/usePresence.ts`
  - **Content:** Set user to online when authenticated and canvas loads

- [ ] Implement presence cleanup on disconnect
  - **Files modified:** `src/services/presence.ts`
  - **Content:** Use onDisconnect() to set offline status

- [ ] Add presence to UI
  - **Files modified:** `src/App.tsx`
  - **Content:** Render UserPresence component in sidebar or header

- [ ] Test presence system
  - Open two windows, verify both users show as online
  - Close one window, verify user goes offline in other window
  - Refresh page, verify presence persists

---

## PR #9: State Persistence & Reconnection Handling
**Goal:** Ensure canvas state persists and handles disconnects gracefully

### Tasks:
- [ ] Implement initial canvas state load
  - **Files modified:** `src/hooks/useShapes.ts`
  - **Content:** Fetch all shapes on component mount

- [ ] Add connection state monitoring
  - **Files modified:** `src/services/firebase.ts`
  - **Content:** Monitor Firebase connection state

- [ ] Add reconnection logic
  - **Files modified:** `src/hooks/useShapes.ts`, `src/hooks/useCursors.ts`
  - **Content:** Re-subscribe to listeners on reconnection

- [ ] Implement offline indicator
  - **Files created:** `src/components/ConnectionStatus.tsx`
  - **Content:** Show banner when connection is lost

- [ ] Add error boundaries
  - **Files created:** `src/components/ErrorBoundary.tsx`
  - **Content:** Catch and display React errors gracefully

- [ ] Test persistence scenarios
  - Create shapes, refresh page, verify shapes persist
  - Create shapes, close all tabs, reopen, verify shapes persist
  - Disconnect internet, verify offline indicator
  - Reconnect internet, verify sync resumes

---

## PR #10: Performance Optimization
**Goal:** Ensure 60 FPS and optimize for 500+ shapes and 5+ users

### Tasks:
- [ ] Add React.memo to Shape component
  - **Files modified:** `src/components/Canvas/Shape.tsx`
  - **Content:** Wrap component in memo, implement comparison function

- [ ] Add React.memo to Cursor component
  - **Files modified:** `src/components/Cursors/Cursor.tsx`
  - **Content:** Wrap component in memo

- [ ] Optimize canvas rendering
  - **Files modified:** `src/components/Canvas/Canvas.tsx`
  - **Content:** Use Konva's listening and perfectDrawEnabled optimizations

- [ ] Implement cursor position throttling
  - **Files modified:** `src/hooks/useCursors.ts`
  - **Content:** Ensure 50ms throttle is working correctly

- [ ] Add shape update batching
  - **Files modified:** `src/hooks/useShapes.ts`
  - **Content:** Batch multiple shape updates into single render

- [ ] Profile performance with React DevTools
  - Identify unnecessary re-renders
  - Fix performance bottlenecks

- [ ] Load test with multiple shapes
  - Create 500+ shapes programmatically
  - Verify 60 FPS maintained during pan/zoom
  - Verify drag performance with many shapes

- [ ] Load test with multiple users
  - Simulate 5+ users
  - Verify no performance degradation
  - Verify cursor sync remains smooth

---

## PR #11: Deployment & Documentation
**Goal:** Deploy application and finalize documentation

### Tasks:
- [ ] Set up deployment platform (Vercel or Firebase Hosting)
  - Create account and link repository
  - Configure build settings

- [ ] Configure environment variables for production
  - **Files created:** Production environment config in hosting platform
  - Set Firebase config variables

- [ ] Deploy to production
  - **Command:** `npm run build && firebase deploy` or push to Vercel
  - Verify deployment successful

- [ ] Test deployed application
  - Open deployed URL
  - Test all core functionality
  - Test with multiple users across different networks

- [ ] Update README with deployment URL
  - **Files modified:** `README.md`
  - **Content:** Add live demo link, update setup instructions

- [ ] Create architecture documentation
  - **Files modified:** `README.md`
  - **Content:** Add architecture overview, data flow diagrams

- [ ] Document known limitations
  - **Files modified:** `README.md`
  - **Content:** Document "last write wins" conflict resolution

- [ ] Create testing checklist
  - **Files created:** `TESTING.md`
  - **Content:** List of test scenarios for MVP validation

- [ ] Final multi-user testing
  - Share deployed URL with 5+ people
  - Verify all features work correctly
  - Verify performance targets met

---

## PR #12: Bug Fixes & Final Polish
**Goal:** Address any remaining bugs and polish user experience

### Tasks:
- [ ] Fix any cursor sync issues
  - **Files modified:** As needed based on testing

- [ ] Fix any shape sync issues
  - **Files modified:** As needed based on testing

- [ ] Improve error handling
  - **Files modified:** All service files
  - **Content:** Add try-catch blocks, user-friendly error messages

- [ ] Add loading states where missing
  - **Files modified:** Components as needed
  - **Content:** Spinners or skeleton screens

- [ ] Improve visual feedback for user actions
  - **Files modified:** UI components
  - **Content:** Hover states, active states, transitions

- [ ] Test edge cases
  - Very long usernames
  - Rapid shape creation
  - Shapes at canvas boundaries
  - Multiple simultaneous drags

- [ ] Final code cleanup
  - Remove console.logs
  - Remove unused imports
  - Fix TypeScript any types
  - Format code consistently

- [ ] Final deployment
  - Deploy polished version
  - Verify all tests pass

---

## Testing Checklist (Run after each PR merge)

### Authentication
- [ ] User can sign up with email/password
- [ ] User can log in
- [ ] User can log out
- [ ] Auth state persists on refresh

### Canvas Basics
- [ ] Canvas loads and renders
- [ ] Pan works smoothly (60 FPS)
- [ ] Zoom works smoothly (60 FPS)
- [ ] No lag or jank during interactions

### Shapes
- [ ] Can create rectangles
- [ ] Can drag rectangles
- [ ] Can select rectangles
- [ ] Shapes have unique IDs

### Real-Time Sync
- [ ] Shape creation syncs across users (<100ms)
- [ ] Shape movement syncs across users (<100ms)
- [ ] Multiple users can create shapes simultaneously

### Cursors
- [ ] Cursors appear for all users
- [ ] Cursors move smoothly (<50ms latency)
- [ ] Usernames appear next to cursors
- [ ] Cursors disappear when users disconnect

### Presence
- [ ] Online users list shows all connected users
- [ ] Users appear when they join
- [ ] Users disappear when they leave

### Persistence
- [ ] Canvas state persists on refresh
- [ ] Canvas state persists when all users leave
- [ ] Reconnection works after network drop

### Performance
- [ ] 60 FPS with 500+ shapes
- [ ] No degradation with 5+ concurrent users
- [ ] Smooth cursor sync with multiple users

---

## Notes

- **Branch naming convention:** `feature/PR#-short-description` (e.g., `feature/PR1-project-setup`)
- **Commit message format:** `[PR#] Description` (e.g., `[PR1] Initialize Vite project`)
- **Testing:** Test each PR thoroughly before merging
- **Deployment:** Deploy after PR #3, #6, #8, and #11 to verify features work in production
- **Blocker PRs:** PR #1, #2, #3, #4 must be completed in order. After PR #4, you can parallelize PR #5-#8.