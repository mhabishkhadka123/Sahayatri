import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import Loading from './Common/Loading';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Initialize auth on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsInitialized(true);
    } else {
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
