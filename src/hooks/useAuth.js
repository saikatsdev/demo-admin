import { useDispatch, useSelector } from 'react-redux';
import {setCredentials,clearCredentials,selectUser,selectToken,selectIsAuthenticated} from '../features/auth/authSlice.js';

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const login = (user, token) => {
    dispatch(setCredentials({ user, token }));
  };

  const logout = () => {
    dispatch(clearCredentials());
  };

  return { user, token, isAuthenticated, login, logout };
}
