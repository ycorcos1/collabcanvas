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
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Sign in failed",
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
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Sign up failed",
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
      const { signOutUser } = await import("../../services/auth");
      await signOutUser();
    } catch (error: any) {
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Sign out failed",
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
