import { createContext, useReducer, ReactNode } from 'react';
import AuthReducer from './AuthReducer';
import { AuthState, AuthAction, User } from './types';

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
