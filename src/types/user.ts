export interface User {
  id: string;
  email: string;
  displayName: string;
  color: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
