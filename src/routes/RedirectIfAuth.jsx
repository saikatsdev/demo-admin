import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const RedirectIfAuth = ({ children }) => {
  const user = useSelector((s) => s.auth.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default RedirectIfAuth;
