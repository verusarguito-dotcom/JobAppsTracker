export interface AuthState {
  authenticated: boolean | null;
  loading: boolean;
  error: string | null;
}
