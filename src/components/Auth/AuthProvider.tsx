import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../services/firebase";
import { User, AuthState } from "../../types/user";
import { getUserColor } from "../../utils/canvasHelpers";

// Helper function to convert Firebase error codes to user-friendly messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled. Please contact support.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "Authentication failed. Please try again.";
  }
};

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  const firebaseUserToUser = (firebaseUser: FirebaseUser): User => ({
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
    color: getUserColor(firebaseUser.uid),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        setAuthState({
          user: firebaseUser ? firebaseUserToUser(firebaseUser) : null,
          isLoading: false,
          error: null,
        });
      }
    );

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
      const { signInUser } = await import("../../services/auth");
      await signInUser(email, password);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code || error.message);
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
      const { createUser } = await import("../../services/auth");
      await createUser(email, password, displayName);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code || error.message);
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // Clear session storage on sign out to reset selected tool, shape, and canvas state
      sessionStorage.removeItem("collabcanvas-selected-tool");
      sessionStorage.removeItem("collabcanvas-selected-shape");
      sessionStorage.removeItem("collabcanvas-canvas-state");

      const { signOutUser } = await import("../../services/auth");
      await signOutUser();
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code || error.message);
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
