graph TB
subgraph "Client Browser 1"
U1[User 1]
U1 --> App1[App.tsx]

        subgraph "Authentication Layer"
            App1 --> AuthProvider1[AuthProvider]
            AuthProvider1 --> Login1[Login Component]
        end

        subgraph "Canvas Layer"
            App1 --> Canvas1[Canvas Component]
            Canvas1 --> Stage1[Konva Stage]
            Stage1 --> Layer1[Konva Layer]
            Layer1 --> Shapes1[Shape Components]
            Layer1 --> Cursors1[Cursor Overlay]
        end

        subgraph "UI Layer"
            App1 --> Toolbar1[Toolbar]
            App1 --> Presence1[UserPresence]
        end

        subgraph "Hooks Layer"
            Canvas1 --> useCanvas1[useCanvas]
            Canvas1 --> useShapes1[useShapes]
            Canvas1 --> useCursors1[useCursors]
            App1 --> usePresence1[usePresence]
        end

        subgraph "Services Layer"
            useShapes1 --> shapesService1[shapes.ts]
            useCursors1 --> cursorsService1[cursors.ts]
            usePresence1 --> presenceService1[presence.ts]
            AuthProvider1 --> authService1[auth.ts]

            shapesService1 --> firebaseInit1[firebase.ts]
            cursorsService1 --> firebaseInit1
            presenceService1 --> firebaseInit1
            authService1 --> firebaseInit1
        end
    end

    subgraph "Client Browser 2"
        U2[User 2]
        U2 --> App2[App.tsx]

        subgraph "Authentication Layer 2"
            App2 --> AuthProvider2[AuthProvider]
        end

        subgraph "Canvas Layer 2"
            App2 --> Canvas2[Canvas Component]
            Canvas2 --> Stage2[Konva Stage]
            Stage2 --> Shapes2[Shape Components]
            Stage2 --> Cursors2[Cursor Overlay]
        end

        subgraph "Hooks Layer 2"
            Canvas2 --> useShapes2[useShapes]
            Canvas2 --> useCursors2[useCursors]
            App2 --> usePresence2[usePresence]
        end

        subgraph "Services Layer 2"
            useShapes2 --> shapesService2[shapes.ts]
            useCursors2 --> cursorsService2[cursors.ts]
            usePresence2 --> presenceService2[presence.ts]

            shapesService2 --> firebaseInit2[firebase.ts]
            cursorsService2 --> firebaseInit2
            presenceService2 --> firebaseInit2
        end
    end

    subgraph "Firebase Backend"
        subgraph "Firebase Authentication"
            FirebaseAuth[Firebase Auth]
        end

        subgraph "Firestore Database"
            FS[(Firestore)]
            CanvasDoc[canvases/canvasId]
            ShapesCollection[shapes subcollection]
            Shape1Doc[shape document]
            Shape2Doc[shape document]

            FS --> CanvasDoc
            CanvasDoc --> ShapesCollection
            ShapesCollection --> Shape1Doc
            ShapesCollection --> Shape2Doc
        end

        subgraph "Realtime Database"
            RTD[(Realtime DB)]
            CursorsNode[cursors/canvasId]
            User1Cursor[userId1 cursor data]
            User2Cursor[userId2 cursor data]

            PresenceNode[presence/canvasId]
            User1Presence[userId1 presence data]
            User2Presence[userId2 presence data]

            RTD --> CursorsNode
            CursorsNode --> User1Cursor
            CursorsNode --> User2Cursor

            RTD --> PresenceNode
            PresenceNode --> User1Presence
            PresenceNode --> User2Presence
        end
    end

    subgraph "Deployment"
        Vercel[Vercel/Firebase Hosting]
        BuildProcess[Vite Build Process]
        BuildProcess --> Vercel
    end

    %% Authentication Connections
    authService1 -.->|login/signup| FirebaseAuth
    authService1 -.->|onAuthStateChanged| FirebaseAuth
    FirebaseAuth -.->|auth token| authService1

    %% Firestore Connections - Client 1
    shapesService1 -.->|create/update shapes| FS
    shapesService1 -.->|onSnapshot listener| ShapesCollection
    ShapesCollection -.->|real-time updates| shapesService1

    %% Firestore Connections - Client 2
    shapesService2 -.->|create/update shapes| FS
    shapesService2 -.->|onSnapshot listener| ShapesCollection
    ShapesCollection -.->|real-time updates| shapesService2

    %% Realtime DB Connections - Client 1 Cursors
    cursorsService1 -.->|update cursor throttled 50ms| CursorsNode
    CursorsNode -.->|cursor updates under 50ms| cursorsService1

    %% Realtime DB Connections - Client 2 Cursors
    cursorsService2 -.->|update cursor throttled 50ms| CursorsNode
    CursorsNode -.->|cursor updates under 50ms| cursorsService2

    %% Realtime DB Connections - Client 1 Presence
    presenceService1 -.->|set online/offline| PresenceNode
    PresenceNode -.->|presence updates| presenceService1

    %% Realtime DB Connections - Client 2 Presence
    presenceService2 -.->|set online/offline| PresenceNode
    PresenceNode -.->|presence updates| presenceService2

    %% Deployment flow
    App1 --> BuildProcess
    App2 --> BuildProcess

    %% Styling
    classDef clientClass fill:#e1f5ff,stroke:#0066cc,stroke-width:2px
    classDef firebaseClass fill:#fff3e0,stroke:#ff6f00,stroke-width:2px
    classDef databaseClass fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef deployClass fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px

    class App1,App2,Canvas1,Canvas2,useShapes1,useShapes2 clientClass
    class FirebaseAuth,FS,RTD firebaseClass
    class CanvasDoc,ShapesCollection,CursorsNode,PresenceNode databaseClass
    class Vercel,BuildProcess deployClass
