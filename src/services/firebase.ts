import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";
import { getStorage } from "firebase/storage";

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

// Firebase configuration - reads from environment variables
// All credentials are stored in .env file (NOT committed to git)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Validate that all required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Firebase configuration is missing! Please ensure .env file exists with all required VITE_FIREBASE_* variables."
  );
}

// Initialize Firebase app with configuration
const app = initializeApp(firebaseConfig);

// Initialize Firebase services for different features
export const auth = getAuth(app); // User authentication
export const firestore = getFirestore(app); // Persistent shape storage
export const storage = getStorage(app); // File storage for photos

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
