import { createContext, useReducer, ReactNode, useEffect } from 'react';
import AuthReducer from './AuthReducer';
import { AuthState, AuthAction } from './types';
import { useUserStore } from '@/stores/userStore';
import { setStoredUser, clearAuthStorage, getStoredUser } from '@/utils/authStorage';

const INITIAL_STATE: AuthState = {
  user: getStoredUser(),
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
  const { setCurrentUser } = useUserStore();

  useEffect(() => {
    if (state.user) {
      setStoredUser(state.user); 
      setCurrentUser(state.user);
    } else {
      clearAuthStorage();
      setCurrentUser(null);
    }
  }, [state.user, setCurrentUser]);

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
