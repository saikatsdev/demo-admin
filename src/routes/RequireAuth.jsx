import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, clearCredentials } from '../features/auth/authSlice';
import { useEffect } from 'react';

const RequireAuth = () => {
  const ok = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!ok) dispatch(clearCredentials());
  }, [ok, dispatch]);

  return ok ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default RequireAuth;
