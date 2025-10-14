import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
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

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName,
    color: getUserColor(firebaseUser.uid),
  };
};

export const signInUser = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const firebaseUser = userCredential.user;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || email.split("@")[0],
    color: getUserColor(firebaseUser.uid),
  };
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    // We'll import onAuthStateChanged here to avoid circular imports
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
