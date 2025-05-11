import { User, AuthAction } from './types';

export const LoginStart = (): AuthAction => ({
  type: 'LOGIN_START',
});

export const LoginSuccess = (user: User): AuthAction => ({
  type: 'LOGIN_SUCCESS',
  payload: user,
});

export const LoginFailure = (error: string): AuthAction => ({
  type: 'LOGIN_FAILURE',
  payload: error,
});

export const Follow = (userId: number): AuthAction => ({
  type: 'FOLLOW',
  payload: userId,
});

export const Unfollow = (userId: number): AuthAction => ({
  type: 'UNFOLLOW',
  payload: userId,
});