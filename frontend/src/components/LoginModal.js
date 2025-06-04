import React, { useState } from 'react';

function LoginModal({ onClose }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // TODO: Implement actual authentication with backend
    // TODO: Handle JWT tokens and cookies
    
    setTimeout(() => {
      setLoading(false);
      console.log('Login attempt:', formData);
      onClose(); // Close modal on successful login
    }, 1000);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-stone-800">
            Sign In
          </h1>
          <button 
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 text-xl"
            aria-label="Close login modal"
          >
            ×
          </button>
        </div>

        <p className="text-stone-600 text-sm mb-6">
          Access your personalized trend feed
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="your.email@ucla.edu"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-stone-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Your password"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-stone-600">
            Don't have an account? 
            <button className="text-blue-600 hover:text-blue-700 ml-1 transition-colors">
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginModal; 