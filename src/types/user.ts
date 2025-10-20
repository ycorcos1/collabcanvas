export interface User {
  id: string;
  email: string;
  displayName: string;
  color: string;
  photoURL?: string; // Optional profile photo URL
  emailVerified?: boolean; // Email verification status from Firebase Auth
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
