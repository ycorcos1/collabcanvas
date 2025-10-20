AI Development Log — CollabCanvas (Process & Methods)

Date: 2025-10-20

Context and Goals

- Address all “Fail” items in `03_CANVAS_TESTS.md` and `05_AI_AGENT_TESTS.md`.
- Stabilize core canvas UX: drag/resize, text creation/resizing, layers visibility/reorder, multi‑select, copy/paste, undo/redo.
- Ensure dashboard rename/delete reflect in real time.
- Make AI Agent commands reliable (no Firestore index errors, no undefined payloads) and persist shapes.

Constraints

- React + Konva functional architecture; hooks throughout.
- Firestore must be the single source of truth with secure rules.
- Real-time collaboration (presence, selections) and optimistic UI without breaking consistency.

Approach (End-to-End)

1. Discovery: traced failures from the test docs into components/hooks/services; reproduced issues (e.g., dashboard not updating, AI commands failing, shapes not persisting, index prompts).
2. Systemic fixes: prioritized canonical state and one path for selection/history; removed ad-hoc flags and mock writes.
3. Real-time by default: replaced one‑off loads with `onSnapshot` for projects and page‑scoped shapes.
4. AI integration: routed intents to robust tools operating on live canvas state and selections.

Implementation Phases

Phase 1 — Canvas Interaction Stability

- Passed native events into selection to enable Shift+Click multi‑select.
- Enforced a minimum drag distance to create text; updated Konva text height during transform.
- Sorted render order by `zIndex`; added `visible={isVisible}` across all shape types for layers panel.
- Added `onShapeCreated` to reset tool/cursor after creation.

Phase 2 — Persistence and Data Model

- Extended `Shape` with `pageId`; all queries/mutations include `pageId`.
- Introduced `subscribeToShapesByPage(projectId, pageId)`; removed collection‑wide scans.
- Implemented `clearShapesForPage` for atomic deletes; removed session storage hacks.
- Normalized create payloads to avoid “Unsupported field value: undefined”.

Phase 3 — History, Clipboard, and Shortcuts

- Centralized keyboard shortcuts (undo/redo/copy/paste/delete/move).
- Implemented `applySnapshot` to diff add/update/delete against Firestore.
- Paste now uses cumulative offset and increasing `zIndex` for clarity.

Phase 4 — Dashboard Real-Time Updates

- Replaced manual loads with `onSnapshot` listeners for owned and shared projects.
- Merged and de‑duplicated streams; rename/delete reflected instantly.

Phase 5 — Security Rules and Indexes

- Firestore rules: owners can rename/move‑to‑trash; collaborators limited to canvas fields.
- Added composite index for `shapes(pageId ASC, createdAt ASC)`; documented deployment.

Phase 6 — AI Agent Reliability

- `CanvasAIWidget` now passes live `shapes`, `selectedShapeIds`, dimensions, and real `shapeActions`.
- Tools: added `triangle`, normalized circle/rect sizing and color inputs.
- Introduced `select_many_shapes`; auto‑select by type before align/distribute when nothing is selected.
- Improved intent routing and ambiguity handling to reduce invalid executions.

Key Decisions and Rationale

- Page‑scoped shapes: aligns queries with UI pages, reduces overfetch, simplifies clear operations.
- Single selection path: reduces event handling drift and fixes multi‑select.
- Snapshot‑based history: deterministic undo/redo across clients; easy Firestore reconciliation.
- Real‑time subscriptions: eliminates stale dashboard and canvas views.

Problems and Resolutions (from chat‑driven reports)

- Dashboard rename/delete not updating → Switched to `onSnapshot` in `useProjects` and merged owned/shared streams.
- AI “requires an index” errors → Added composite index; instructed deployment.
- “Unsupported field value: undefined” on shape creation → Enforced complete create payloads; removed mock returns to always write to Firestore.
- AI “create project” not persisting → `createProject` now always writes to Firestore with unique slug generation.
- Multi‑select and arrange/distribute failures → Passed native events; added `select_many_shapes` and auto‑selection logic.
- Text creation creating tiny boxes → Added drag threshold; fixed height updates on transform.

Validation

- Canvas: drag/resize/text, layers visibility, multi‑select, clipboard offsets, z‑order, undo/redo via `applySnapshot`.
- AI Agent: create/select/align/distribute across types; shape persistence verified; no index prompts after deploy.
- Dashboard: rename/delete reflected instantly in owned/shared lists.

Outcome

CollabCanvas now delivers real‑time collaboration with reliable AI commands and durable Firestore persistence. Canvas interactions are predictable, history is robust, and the dashboard reflects changes instantly.

Next Steps

- Add e2e tests around AI commands and undo/redo flows.
- Monitor performance for large pages; consider virtualization for layers.
- Expand presence/conflict resolution for concurrent edits.
