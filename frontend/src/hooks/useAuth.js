import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';

export const useAuth = () => {
  const navigate = useNavigate();
  const store = useAuthStore();

  useEffect(() => {
    store.initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      await store.login(email, password);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  }, [store, navigate]);

  const logout = useCallback(() => {
    store.logout();
    navigate('/login');
  }, [store, navigate]);

  return {
    ...store,
    login,
    logout,
  };
};

export const useRequireAuth = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated;
};

export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};
