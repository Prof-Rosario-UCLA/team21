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
    <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="h-16 px-6">
        <nav className="h-full flex items-center justify-center" role="navigation">
          <div className="text-lg font-medium text-stone-600">
            Today's Campus Trends
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header; 