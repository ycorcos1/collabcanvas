# CollabCanvas - Real-time Collaborative Drawing Application

## 🎯 Project Overview

CollabCanvas is a real-time collaborative drawing application built with React, TypeScript, and Firebase. It allows multiple users to create and manipulate shapes on a shared canvas with live synchronization, multi-select functionality, and real-time cursor tracking.

## 🚀 Key Features

### Core Functionality

- **Shape Creation**: Draw rectangles and circles with click-and-drag interaction
- **Multi-Select**: Select multiple shapes using Shift+click
- **Real-time Collaboration**: See other users' cursors and selections in real-time
- **Dynamic Canvas**: Adjustable canvas dimensions (5000x15000 pixels) synced across all users
- **Session Persistence**: Selected tools and shapes persist across page refreshes

### Collaboration Features

- **Live Cursors**: See other users' mouse positions with custom colors
- **Shape Locking**: Prevent conflicts when users select the same shape
- **User Presence**: View all online users in the sidebar
- **Selection Indicators**: Visual labels showing which user has selected which shapes

### Performance Optimizations

- **60 FPS Rendering**: Smooth zoom/pan with requestAnimationFrame throttling
- **Optimistic Updates**: Immediate UI response with Firebase sync
- **Error Resilience**: Graceful handling of network issues and idle timeouts
- **Memory Management**: Proper cleanup of subscriptions and event listeners

## 🏗️ Architecture

### Frontend Stack

- **React 19** with TypeScript for type safety
- **Konva.js** for high-performance 2D canvas rendering
- **React Router** for client-side routing
- **CSS Modules** for component styling

### Backend & Data

- **Firebase Authentication** for user management
- **Firestore** for persistent shape data
- **Realtime Database** for live cursors and presence
- **Firebase Security Rules** for access control

### State Management

- **Custom React Hooks** for feature-specific state (useShapes, useCursors, etc.)
- **Context API** for global authentication state
- **SessionStorage** for UI state persistence

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Auth/            # Authentication components
│   ├── Canvas/          # Main drawing canvas
│   ├── Cursors/         # Real-time cursor display
│   ├── Presence/        # User presence indicators
│   └── Toolbar/         # Tools and controls
├── hooks/               # Custom React hooks
│   ├── useShapes.ts     # Shape state management
│   ├── useCursors.ts    # Cursor tracking
│   ├── usePresence.ts   # User presence
│   └── useCanvas.ts     # Canvas viewport state
├── services/            # Firebase service layers
│   ├── firebase.ts      # Firebase configuration
│   ├── shapes.ts        # Shape CRUD operations
│   ├── cursors.ts       # Cursor real-time sync
│   └── presence.ts      # Presence management
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── pages/               # Route components
```

## 🔧 Key Technical Decisions

### Real-time Architecture

- **Firestore** for shapes: Provides ACID transactions and offline support
- **Realtime Database** for cursors: Lower latency for frequent position updates
- **Hybrid approach** balances consistency (shapes) with performance (cursors)

### Coordinate System

- **Canvas coordinates**: Absolute positions on the infinite canvas
- **Screen coordinates**: Viewport-relative positions for UI elements
- **Transformation functions** handle conversion between coordinate systems

### Multi-Select Implementation

- **Array-based selection**: `selectedShapeIds: string[]` instead of single ID
- **Shift-key detection**: Global keyboard listeners for modifier keys
- **Session persistence**: Selected shapes survive page refreshes

### Performance Optimizations

- **React.memo**: Prevents unnecessary re-renders of Shape components
- **useCallback**: Memoizes event handlers and complex functions
- **RequestAnimationFrame**: Throttles zoom updates to 60 FPS
- **Debounced inputs**: Canvas dimension inputs auto-correct on blur

## 🔐 Security & Error Handling

### Firebase Security

- **Authentication required**: All operations require valid user session
- **Security rules**: Firestore rules prevent unauthorized access
- **Environment variables**: API keys and config stored securely

### Error Resilience

- **Connection recovery**: Automatic reconnection with exponential backoff
- **Idle handling**: Graceful degradation when users are inactive
- **Optimistic updates**: UI responds immediately, syncs in background
- **Error boundaries**: React error boundaries prevent app crashes

## 🎨 User Experience

### Intuitive Controls

- **Tool selection**: Click toolbar buttons to select drawing tools
- **Shape creation**: Click and drag to create shapes
- **Multi-select**: Hold Shift and click to select multiple shapes
- **Keyboard shortcuts**: Delete key removes selected shapes

### Visual Feedback

- **Selection indicators**: Blue outlines for selected shapes
- **User labels**: Show which user has selected each shape
- **Cursor colors**: Each user has a unique color for identification
- **Loading states**: Clear feedback during network operations

### Responsive Design

- **Fixed toolbar**: Always accessible controls on the left
- **Scalable UI**: Elements scale appropriately with canvas zoom
- **Mobile considerations**: Touch events supported for mobile devices

## 🚀 Deployment

The application is designed for deployment on modern web platforms:

### Environment Variables Required

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url
```

### Build Process

```bash
npm run build    # Creates optimized production build
npm run preview  # Preview production build locally
```

## 📈 Performance Metrics

### Target Performance

- **60 FPS** during zoom/pan operations
- **<100ms** cursor update latency
- **<500ms** shape creation to sync time
- **Support for 500+ shapes** without performance degradation
- **5+ concurrent users** with smooth collaboration

### Optimization Techniques

- **Throttled updates**: Cursor positions limited to 60 FPS
- **Batch operations**: Multiple shape updates combined
- **Selective re-renders**: Only affected components update
- **Memory cleanup**: Proper subscription and listener management

## 🔄 Real-time Synchronization

### Data Flow

1. **User Action** → Local state update (optimistic)
2. **Firebase Write** → Background sync to database
3. **Firebase Listener** → Propagate changes to other users
4. **State Reconciliation** → Merge remote changes with local state

### Conflict Resolution

- **Last-write-wins**: Simple conflict resolution for shape properties
- **Selection locking**: Prevent simultaneous editing of same shape
- **Optimistic updates**: Immediate feedback with eventual consistency

This documentation provides a comprehensive overview of the CollabCanvas application architecture, features, and technical implementation details for developers working on or maintaining the codebase.
