import type { AuthState, AuthAction } from './types';

const AuthReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        user: null,
        isFetching: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        user: action.payload,
        isFetching: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        user: null,
        isFetching: false,
        error: action.payload,
      };

    case 'FOLLOW':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          followings: [...(state.user.followings || []), action.payload],
        },
      };

    case 'UNFOLLOW':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          followings:
            state.user.followings?.filter((id) => id !== action.payload) || [],
        },
      };

    default:
      return state;
  }
};

export default AuthReducer;