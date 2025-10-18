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
  // Defensive fallback: during rare edge cases (e.g., HMR, error recovery, or
  // transient unmounts after idle session refresh), the provider may not be
  // available for a single render. Instead of throwing (which breaks routing
  // and triggers the error boundary), return a safe loading state so callers
  // like ProtectedRoute/PublicRoute can gracefully show a spinner and allow the
  // provider to remount.
  if (!context) {
    return {
      user: null,
      isLoading: true,
      error: null,
      // Provide no-op auth methods that clearly indicate unavailability if
      // they're ever called in this transient state.
      signIn: async () => {
        throw new Error(
          "Auth context unavailable during recovery. Please retry."
        );
      },
      signUp: async () => {
        throw new Error(
          "Auth context unavailable during recovery. Please retry."
        );
      },
      signOut: async () => {
        // no-op
      },
    } as AuthContextType;
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

  // Track session recovery attempts
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  const firebaseUserToUser = (firebaseUser: FirebaseUser): User | null => {
    // Defensive checks for incomplete Firebase user data
    if (!firebaseUser.uid || !firebaseUser.email) {
      console.warn("Incomplete Firebase user data received:", {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
      return null;
    }

    // Safe email parsing with fallback
    const emailFallback = firebaseUser.email.includes("@")
      ? firebaseUser.email.split("@")[0]
      : `user_${firebaseUser.uid.slice(-6)}`;

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || emailFallback,
      color: getUserColor(firebaseUser.uid),
      photoURL: firebaseUser.photoURL || undefined,
    };
  };

  // Activity tracking for session management (for future use)
  useEffect(() => {
    const updateActivity = () => {
      // Track user activity for potential session timeout features
      // Currently used for monitoring but not enforcing timeouts
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Session recovery logic
  const attemptSessionRecovery = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser || recoveryAttempts >= 3) {
      return false;
    }

    try {
      setRecoveryAttempts((prev) => prev + 1);

      // Force token refresh
      await firebaseUser.getIdToken(true);

      // Verify user data is complete after refresh
      const user = firebaseUserToUser(firebaseUser);
      if (user) {
        setAuthState({
          user,
          isLoading: false,
          error: null,
        });
        setRecoveryAttempts(0); // Reset on success
        return true;
      }
    } catch (error) {
      console.warn("Session recovery failed:", error);
    }

    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            // Ensure token validity for long-idle sessions
            try {
              await firebaseUser.getIdToken(/* forceRefresh */ false);
            } catch (e) {
              // If token read fails, force a refresh once
              try {
                await firebaseUser.getIdToken(true);
              } catch {}
            }
            const user = firebaseUserToUser(firebaseUser);
            if (user) {
              setAuthState({
                user,
                isLoading: false,
                error: null,
              });
              setRecoveryAttempts(0); // Reset recovery attempts on successful auth
            } else {
              // Try session recovery first
              const recovered = await attemptSessionRecovery(firebaseUser);

              if (!recovered) {
                // Invalid user data - sign out to prevent crashes
                console.warn(
                  "Invalid user data received, signing out for safety"
                );
                const { signOutUser } = await import("../../services/auth");
                await signOutUser();
                setAuthState({
                  user: null,
                  isLoading: false,
                  error: "Session expired. Please sign in again.",
                });
              }
            }
          } else {
            setAuthState({
              user: null,
              isLoading: false,
              error: null,
            });
            setRecoveryAttempts(0); // Reset recovery attempts when signed out
          }
        } catch (error: any) {
          console.error("Auth state change error:", error);

          // Check if this is a recoverable error
          if (
            error.code === "auth/network-request-failed" &&
            recoveryAttempts < 3
          ) {
            // Network error - try recovery
            setTimeout(() => {
              setRecoveryAttempts((prev) => prev + 1);
            }, 2000 * (recoveryAttempts + 1)); // Exponential backoff
          } else if (recoveryAttempts < 2) {
            // Attempt a soft reset once in non-network cases to avoid crash loops
            setRecoveryAttempts((prev) => prev + 1);
            setAuthState((prev) => ({ ...prev, isLoading: true }));
          } else {
            setAuthState({
              user: null,
              isLoading: false,
              error: "Authentication error. Please refresh and try again.",
            });
          }
        }
      }
    );

    return unsubscribe;
  }, [recoveryAttempts]);

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

      // Clear session storage on sign out to reset selected tool, shapes, and canvas state
      sessionStorage.removeItem("horizon-selected-tool");
      sessionStorage.removeItem("horizon-selected-shapes");
      sessionStorage.removeItem("horizon-canvas-state");

      // Clear old localStorage data that might cause universal canvas issues
      localStorage.removeItem("canvas-pages");
      localStorage.removeItem("canvas-object-names");

      // Reset theme to light mode for auth pages
      const root = document.documentElement;
      root.removeAttribute("data-theme");
      root.classList.remove("light", "dark");
      root.classList.add("light");

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
