import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Firebase configuration
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

console.log("Firebase config:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + "...", // Hide sensitive data
  databaseURL: firebaseConfig.databaseURL, // Show the full database URL for debugging
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);

let database;
try {
  database = getDatabase(app);
  console.log("Firebase Realtime Database initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase Realtime Database:", error);
  throw error;
}

export { database };

export default app;
