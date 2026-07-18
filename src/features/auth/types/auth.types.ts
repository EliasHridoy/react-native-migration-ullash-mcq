export interface AuthUser {
  id: string;
  email: string;
  provider: string;
  isEmailVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
}

export type AuthStatus =
  | 'initial'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
}
