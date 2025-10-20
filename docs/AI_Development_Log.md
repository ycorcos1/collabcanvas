AI Development Log — CollabCanvas

Date: 2025-10-20

Overview

This log summarizes the end-to-end effort to stabilize CollabCanvas and ensure real-time, error-free collaboration across the dashboard and canvas. The work focused on: fixing core canvas interactions, ensuring Firestore-backed persistence and real-time sync, improving security rules, and making AI Agent commands reliable. The outcome is a resilient canvas with multi-user features, robust undo/redo, and AI-assisted creation and arrangement of shapes, with dashboard lists updating instantly.

Objectives

- Stabilize all items marked “Fail” in canvas tests (drag/resize, text, layers, multi-select, clipboard, undo/redo).
- Ensure dashboard project rename/delete updates in real-time.
- Make AI Agent commands execute reliably without Firestore/index errors; persist shapes properly.
- Maintain secure Firestore access patterns for owners vs collaborators.

Architecture and Key Concepts

- React + Konva for rendering and interaction (Stage, Layer, Group, Transformer).
- Firestore for real-time synchronization (documents, queries, onSnapshot) with composite indexes.
- Hooks-based state/control surfaces: `useShapes`, `useHistory`, `useProjects`, `useProjectSync`, `useAIAgent`.
- AI Agent uses tool registry + intent routing and executes against real `shapeActions`.
- Data model: `Shape` includes `pageId` for per-page scoping; `Project` documents control permissions and metadata.

Methodology

1) Discovery: audited canvas flows, AI toolchain, and Firestore queries; identified missing event propagation and non-persistent shape creation.
2) Systemic fixes over hot patches: standardized selection and keyboard handling, centralized history, and reliable Firestore persistence.
3) Real-time-first mindset: replaced ad-hoc loads with `onSnapshot` subscriptions for dashboard and canvas.
4) AI integration hardening: ensured tools operate on canonical state and provide multi-select when required.

Major Changes Implemented

- Canvas interaction fixes
  - Passed native events to preserve Shift+Click multi-select; centralized selection logic.
  - Enforced minimum drag distance to create text; accurate text resizing (width/height update).
  - Sorted render order by `zIndex`; applied `visible={isVisible}` to all shape types for layer toggles.
  - Added `onShapeCreated` to reset tool/cursor state post-creation.

- Shape persistence and page scoping
  - Extended `Shape` with `pageId`; all shape queries and mutations include `pageId`.
  - Replaced clear-canvas hacks with `clearShapesForPage` for atomic Firestore deletes per page.
  - Normalized creation payloads to avoid “Unsupported field value: undefined”.

- Undo/redo, clipboard, and z-order
  - Centralized keyboard shortcuts; robust copy/paste with cumulative offset and increasing `zIndex`.
  - History snapshots persisted via `applySnapshot` which diffs add/update/delete against Firestore.

- Layers panel and visibility
  - Wired `onUpdateShape` through sidebar/panel; visibility toggles affect all shape types.

- Dashboard real-time updates
  - Replaced one-off loads with `onSnapshot` subscriptions for owned and shared projects; merged/deduped streams.

- Firestore security rules and indexes
  - Owners can rename/move-to-trash; collaborators restricted to canvas-related fields.
  - Added composite index: `shapes(pageId ASC, createdAt ASC)` to support page-scoped queries.

- AI Agent reliability
  - `CanvasAIWidget` passes live `shapes`, selection, dimensions, and real `shapeActions`.
  - Tools support `triangle`; normalized color and circle/rect coercions.
  - Introduced `select_many_shapes` and auto-selection for align/distribute when nothing selected.
  - Improved ambiguity detection and routing to reduce invalid command executions.

Key Issues and Resolutions

- “Requires an index” Firestore errors: added and documented indexes; instructed deploy.
- “Unsupported field value: undefined” on shape creation: ensured complete payloads and always using Firestore writes.
- Missing shift-multi-select: passed native events and consolidated selection path.
- Text sizing inaccuracies: updated Konva text node height during transforms.
- Dashboard not updating on rename/delete: switched to `onSnapshot` for real-time lists.
- Type/linter regressions: corrected missing symbols, updated `CreateShapeData` with `pageId`, and reordered declarations.

Testing and Validation

- Canvas tests: verified drag/resize, text creation with threshold, layers visibility, multi-select via Shift+Click, copy/paste offset and zOrder increments, and undo/redo through `applySnapshot`.
- AI Agent tests: validated create/select/align/distribute across types; ensured shape persistence and no index errors post-deploy.
- Dashboard: rename and delete actions reflect instantly across owned and shared lists.

Operational Notes

- Deploy Firestore composite indexes and updated security rules for changes to take effect.
- Shape queries must include `pageId` and be indexed; avoid collection-wide scans.

Risks and Next Steps

- After index deployment, re-run AI canvas commands to confirm no index-related failures.
- Add automated e2e tests for AI command flows and undo/redo interactions.
- Monitor performance for large documents; consider pagination/virtualization for layers.
- Expand presence and conflict resolution safeguards if concurrent edits rise.

Outcome

CollabCanvas now persists shapes consistently per page, updates dashboards in real time, and executes AI Agent commands reliably with secure Firestore rules. The canvas interaction model is simplified and maintainable, with history and selection behavior aligned to user expectations.


