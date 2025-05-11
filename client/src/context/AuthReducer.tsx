import { AuthState, AuthAction } from './types';

const AuthReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        user: null,
        isFetching: true,
        error: false,
      };

    case 'LOGIN_SUCCESS':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        user: action.payload,
        isFetching: false,
        error: false,
      };

    case 'LOGIN_FAILURE':
      return {
        user: null,
        isFetching: false,
        error: true,
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
          followings: state.user.followings?.filter(
            (following) => following !== action.payload
          ) || [],
        },
      };

    default:
      return state;
  }
};

export default AuthReducer;
