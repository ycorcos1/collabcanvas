# CollabCanvas MVP - Product Requirements Document

## Project Overview
Build a real-time collaborative canvas application where multiple users can simultaneously create, move, and manipulate simple shapes. This MVP focuses exclusively on proving the collaborative infrastructure works flawlessly.

**Timeline**: 24 hours to MVP checkpoint (Tuesday deadline)

---

## User Stories

### Primary User: Designer/Creator (MVP Priority)
- As a designer, I want to create an account and log in so I have a persistent identity
- As a designer, I want to see a large canvas workspace so I can design
- As a designer, I want to pan and zoom the canvas so I can navigate the workspace
- As a designer, I want to create basic shapes on the canvas so I can start designing
- As a designer, I want to move objects around so I can arrange my design
- As a designer, I want to see other users' cursors with their names so I know where they're working
- As a designer, I want to see changes made by other users in real-time so we can collaborate seamlessly
- As a designer, I want to see who's currently online so I know who's collaborating
- As a designer, I want my work to persist when I refresh so I don't lose progress

### Secondary User: Collaborator (Post-MVP Priority)
- As a collaborator, I want to join an existing canvas session so I can work with others
- As a collaborator, I want to see all existing objects when I join so I understand the current state
- As a collaborator, I want to make changes without conflicts so collaboration is smooth

---

## MVP Core Features

### 1. Canvas System
**Priority: CRITICAL**
- Large workspace (minimum 3000x3000px virtual space)
- Smooth pan (click-drag background)
- Smooth zoom (mouse wheel or pinch)
- 60 FPS performance during all interactions
- Visual viewport indicator (optional but helpful)

### 2. Shape Creation & Manipulation
**Priority: CRITICAL**
- Support at least ONE shape type (rectangle, circle, OR text)
- Click-to-create workflow (simple toolbar + click placement)
- Drag-to-move selected objects
- Visual selection state (highlight/outline selected object)
- Object properties: position (x, y), size (width, height), color

### 3. Real-Time Synchronization
**Priority: CRITICAL - This is the hard part**
- Broadcast object creation to all connected users (<100ms)
- Broadcast object movement to all connected users (<100ms)
- Last-write-wins conflict resolution (document this choice)
- Graceful handling of network delays

### 4. Multiplayer Cursors
**Priority: CRITICAL**
- Show cursor position for all connected users (<50ms latency)
- Display username label next to each cursor
- Smooth cursor interpolation (not jumpy)
- Hide cursor when user is inactive/disconnected

### 5. Presence Awareness
**Priority: CRITICAL**
- Display list of currently online users
- Show user join/leave events
- Real-time status updates (online/offline)

### 6. User Authentication
**Priority: CRITICAL**
- Simple sign-in flow (email/password or OAuth)
- Unique username/display name for each user
- Persistent user identity across sessions
- Associate canvas actions with authenticated users

### 7. State Persistence
**Priority: CRITICAL**
- Save canvas state to database on every change
- Load existing canvas state on user join
- Maintain state even if all users disconnect
- No data loss on page refresh

### 8. Deployment
**Priority: CRITICAL**
- Publicly accessible URL
- Support 5+ concurrent users without degradation
- Stable WebSocket/real-time connections

---

## Tech Stack (Confirmed)

**Backend:**
- Firebase Authentication (drop-in auth UI)
- Firestore for canvas state persistence
- Firebase Realtime Database for cursor positions (lower latency)

**Frontend:**
- React 18+ with TypeScript
- Konva.js for canvas rendering (React-Konva wrapper available)
- Vite for build tooling

**Deployment:**
- Vercel or Firebase Hosting

**Key Benefits:**
- Fastest path to real-time sync (built-in listeners)
- No backend code needed
- Excellent documentation
- Free tier supports MVP requirements
- Authentication is trivial to set up

**Critical Pitfalls to Avoid:**
- ⚠️ Don't put all canvas objects in one Firestore document (will hit write limits)
- ✅ Use subcollections: `/canvases/{canvasId}/objects/{objectId}`
- ✅ Use Firebase Realtime DB for cursors (faster than Firestore)
- ✅ Be careful with listener setup to avoid memory leaks
- ✅ Throttle high-frequency cursor updates (50ms minimum)

---

## Explicit NON-MVP Features

### Deliberately Excluded (Don't build these for MVP):
- ❌ Multiple shape types (just pick ONE: rectangle recommended)
- ❌ Color picker UI (use predefined colors or random colors)
- ❌ Resize or rotate functionality
- ❌ Multi-select (shift-click or drag-select)
- ❌ Layer management or z-ordering
- ❌ Delete or duplicate commands
- ❌ Text editing capabilities
- ❌ Undo/redo
- ❌ Export functionality
- ❌ Keyboard shortcuts
- ❌ Mobile responsiveness
- ❌ Permissions/roles
- ❌ Multiple canvases
- ❌ Comments or chat
- ❌ Version history
- ❌ Copy/paste

### Why This Matters:
The MVP gate is about **proving your collaborative infrastructure works**, not about features. A canvas with one shape type and bulletproof multiplayer beats a feature-rich canvas with broken sync.

---

## Success Criteria

### Must Pass (Hard Gate):
1. ✅ Two users in different browsers can see each other's cursors moving in real-time
2. ✅ When User A creates a shape, User B sees it appear instantly
3. ✅ When User A moves a shape, User B sees it move in real-time
4. ✅ When User A refreshes their browser, the canvas state persists
5. ✅ Users have authenticated identities (names visible on cursors)
6. ✅ Presence indicator shows who's online
7. ✅ Canvas maintains 60 FPS during pan/zoom/drag operations
8. ✅ Application is deployed and publicly accessible

### Performance Benchmarks:
- Object sync latency: <100ms
- Cursor sync latency: <50ms
- Support 5+ concurrent users
- Support 500+ objects without FPS degradation

---

## Development Strategy

### Phase 1: Foundation
1. Set up project structure (Vite + React + TypeScript)
2. Implement basic canvas with pan/zoom (Konva.js)
3. Set up Firebase project (Auth + Firestore + Realtime DB)
4. Deploy hello-world version

### Phase 2: Core Sync (CRITICAL)
5. Implement authentication flow
6. Build cursor position broadcasting (Firebase Realtime DB)
7. Implement presence system
8. Create one shape type (rectangles)
9. Sync shape creation across users
10. Test with multiple browser windows

### Phase 3: Polish & Reliability
11. Add shape movement/dragging
12. Sync movement across users
13. Implement state persistence
14. Handle disconnects/reconnects gracefully
15. Performance optimization (throttle cursor updates, optimize renders)

### Phase 4: Testing & Deployment
16. Multi-user stress testing
17. Network throttling tests
18. Final deployment
19. Documentation

---

## Risk Mitigation

### Biggest Risks:
1. **Real-time sync doesn't work smoothly**
   - Mitigation: Start with sync FIRST, not last
   - Use proven libraries (Firebase/Supabase)
   - Test constantly with multiple windows

2. **Performance degrades with multiple users**
   - Mitigation: Throttle high-frequency updates (cursors)
   - Use React.memo and useMemo for optimization
   - Profile early and often

3. **State conflicts when multiple users edit simultaneously**
   - Mitigation: Accept "last write wins" for MVP
   - Document this limitation
   - Consider object-level locking if time permits

4. **Running out of time**
   - Mitigation: Build vertically (finish cursor sync COMPLETELY before moving on)
   - Cut features aggressively (one shape type is enough)
   - Deploy early, deploy often

---

## Next Steps

1. **Review this PRD** - Confirm approach and tech stack choice
2. **Create initial project structure** - Set up repo, install dependencies
3. **Implement cursor sync first** - Prove real-time infrastructure works
4. **Build iteratively** - Test after each feature
5. **Deploy early** - Don't wait until the end

**Recommended Decision:** Use Firebase for the 24-hour MVP. It's the fastest path to working real-time collaboration.