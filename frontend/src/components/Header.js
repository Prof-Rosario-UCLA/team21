import React from 'react';
import { useAuth } from '../context/AuthContext';

function Header({ onLoginClick }) {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-orange-50 px-6 py-4">
      <nav className="container mx-auto flex justify-end items-center" role="navigation" aria-label="Main navigation">
        <div className="flex items-center">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-stone-600">
                Welcome, {user.name || 'Bruin'}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header; 