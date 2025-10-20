import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { firestore } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { User } from "../types/user";
import { getUserColor } from "../utils/canvasHelpers";

export const createUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const firebaseUser = userCredential.user;

  // Update the display name
  await updateProfile(firebaseUser, { displayName });

  // Create or update user profile document in Firestore (for collaboration lookups)
  try {
    const userRef = doc(firestore, "users", firebaseUser.uid);
    const emailLower = email.toLowerCase();
    await setDoc(
      userRef,
      {
        email,
        emailLower,
        displayName,
        photoURL: firebaseUser.photoURL || null,
        emailVerified: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("Failed to create user profile document", e);
    }
  }

  // Send verification email and sign out to enforce verification gate
  try {
    await sendEmailVerification(firebaseUser, {
      url: window.location.origin + "/signin",
      handleCodeInApp: false,
    } as any);
  } catch (e) {
    console.error("sendEmailVerification failed", e);
  }
  await signOut(auth);

  return {
    id: firebaseUser.uid,
    email: email,
    displayName,
    color: getUserColor(firebaseUser.uid),
  };
};

export const signInUser = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Enforce email verification
    if (!firebaseUser.emailVerified) {
      try {
        await sendEmailVerification(firebaseUser, {
          url: window.location.origin + "/signin",
          handleCodeInApp: false,
        } as any);
      } catch (e) {
        // Silently handle verification email failure
        if (import.meta.env.DEV) {
          console.warn("Resend verification failed", e);
        }
      }
      await signOut(auth);
      const err: any = new Error(
        "Email not verified. Please check your inbox and verify before signing in."
      );
      err.code = "auth/email-not-verified";
      throw err;
    }

    // Ensure user profile document exists for collaboration features
    try {
      const userRef = doc(firestore, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      const emailLower = (firebaseUser.email || email).toLowerCase();
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: firebaseUser.email || email,
          emailLower,
          displayName: firebaseUser.displayName || email.split("@")[0],
          photoURL: firebaseUser.photoURL || null,
          emailVerified: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else {
        await updateDoc(userRef, {
          email: firebaseUser.email || email,
          emailLower,
          displayName: firebaseUser.displayName || email.split("@")[0],
          photoURL: firebaseUser.photoURL || null,
          emailVerified: true,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("Failed to ensure user profile document", e);
      }
    }

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || email.split("@")[0],
      color: getUserColor(firebaseUser.uid),
    };
  } catch (error: any) {
    // Re-throw with preserved error code for AuthProvider to handle
    // Error logging is handled at the AuthProvider level to avoid duplicates
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const resendVerification = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await sendEmailVerification(user, {
      url: window.location.origin + "/signin",
      handleCodeInApp: false,
    } as any);
  } catch (e) {
    console.error("Resend verification failed", e);
    throw e;
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser: FirebaseUser | null) => {
          unsubscribe();
          if (firebaseUser) {
            resolve({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName:
                firebaseUser.displayName || firebaseUser.email!.split("@")[0],
              color: getUserColor(firebaseUser.uid),
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  });
};
