import { createContext, useReducer, ReactNode, useEffect } from 'react';
import AuthReducer from './AuthReducer';
import { AuthState, AuthAction } from './types';

const INITIAL_STATE: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isFetching: false,
  error: false,
};

interface AuthContextProps extends AuthState {
  dispatch: React.Dispatch<AuthAction>;
}

export const AuthContext = createContext<AuthContextProps>({
  ...INITIAL_STATE,
  dispatch: () => null,
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem('user', JSON.stringify(state.user));
      localStorage.setItem('token', state.user.token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isFetching: state.isFetching,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
