import type { User } from '@/stores/userStore';

export interface AuthState {
  user: User | null;
  isFetching: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'FOLLOW'; payload: number }
  | { type: 'UNFOLLOW'; payload: number };