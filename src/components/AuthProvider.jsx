import React, { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { login, logout } from '../store/slices/uiSlice';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.ui);

  useEffect(() => {
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          dispatch(login({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email,
            email: session.user.email,
            avatar: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider
          }));
        } else if (event === 'SIGNED_OUT') {
          dispatch(logout());
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch]);

  const authValue = {
    user,
    isAuthenticated,
    login: (userData) => dispatch(login(userData)),
    logout: () => dispatch(logout()),
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
