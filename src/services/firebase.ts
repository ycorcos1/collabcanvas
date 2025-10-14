import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";

/**
 * Firebase Configuration and Initialization
 *
 * Sets up Firebase services for the collaborative canvas:
 * - Authentication for user management
 * - Firestore for persistent shape data
 * - Realtime Database for live cursors and presence
 *
 * Uses environment variables for secure configuration
 */

// Firebase configuration - uses environment variables with fallbacks for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    "https://collabcursor-default-rtdb.firebaseio.com",
};

// Initialize Firebase app with configuration
const app = initializeApp(firebaseConfig);

// Initialize Firebase services for different features
export const auth = getAuth(app); // User authentication
export const firestore = getFirestore(app); // Persistent shape storage

// Realtime Database for live features (cursors, presence)
let database: Database;
try {
  database = getDatabase(app);
} catch (error) {
  console.error("Failed to initialize Firebase Realtime Database:", error);
  throw error;
}

export { database };

export default app;
