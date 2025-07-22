export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
  followings?: number[];
  profilePicture?: string;
  coverPicture?: string;
  isAdmin: boolean;
  from?: string;
  city?: string;
  relationship?: number;
  desc?: string;
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
