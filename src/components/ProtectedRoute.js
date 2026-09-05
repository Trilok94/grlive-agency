import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Parse } from 'parse';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Force clear Parse current user
    Parse.User.logOut();
    // Clear any stored data
    localStorage.clear();
    sessionStorage.clear();
    // Replace history to prevent going back
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
