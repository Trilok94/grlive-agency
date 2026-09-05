import React, { createContext, useState, useEffect, useContext } from 'react';
import Parse from 'parse';
import { authService } from '../services/ParseService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthState = () => {
      try {
        // Make sure Parse is initialized before checking user
        if (Parse && Parse.User) {
          // Get current user synchronously
          const user = authService.getCurrentUser();
          if (user) {
            // User is authenticated according to Parse
            setCurrentUser(user);
          } else {
            // If user is not authenticated, clear everything
            setCurrentUser(null);
          }
        } else {
          // Parse not initialized yet, set user to null
          console.log('Parse not yet initialized, setting user to null');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth state check error:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure Parse is initialized
    const timer = setTimeout(() => {
      checkAuthState();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (username, password) => {
    try {
      const user = await authService.login(username, password);
      setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async (onLogoutCallback) => {
    try {
      // First clear React state
      setCurrentUser(null);
      // Then clear all storage
      localStorage.clear();
      sessionStorage.clear();
      // Call the callback if provided
      if (onLogoutCallback) {
        onLogoutCallback();
      }
      // Finally logout from Parse and reload page
      await authService.logout();
      // Note: authService.logout will reload the page
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear everything even if there's an error
      setCurrentUser(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    setCurrentUser,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
