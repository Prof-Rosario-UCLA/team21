import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await api.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const register = async (email, password, name) => {
    try {
      setError(null);
      const response = await api.register(email, password, name);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Check if we're online before making API call
      if (navigator.onLine) {
        await api.logout();
      } else {
        console.log('Offline logout: clearing local auth state only');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Continue with local logout regardless of API error
    } finally {
      // Always clear local auth state for logout
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  };

  const updateProfilePicture = async (imageData) => {
    try {
      // Check if we're online before making API call
      if (!navigator.onLine) {
        throw new Error('Cannot update profile picture while offline. Please check your internet connection and try again.');
      }
      
      const response = await api.updateProfilePicture(imageData);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Profile picture update failed:', error);
      
      // Provide better error messages for offline scenarios
      if (error.message.includes('offline') || error.message.includes('fetch') || !navigator.onLine) {
        throw new Error('Cannot update profile picture while offline. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateProfilePicture,
    isAuthenticated: !!user
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
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