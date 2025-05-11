export interface User {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
  token: string;
  followings?: number[];
}

export interface AuthState {
  user: User | null;
  isFetching: boolean;
  error: boolean;
}

export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'FOLLOW'; payload: number }
  | { type: 'UNFOLLOW'; payload: number };
