import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Feed from './components/Feed';
import LoginModal from './components/LoginModal';
import CookieBanner from './components/CookieBanner';
import CameraCapture from './components/CameraCapture';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import api from './services/api';

function ProfileMenu({ user, onLogout, isMobile = false, isTablet = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const menuRef = useRef(null);
  const nameRef = useRef(null);
  const { updateProfilePicture } = useAuth();
  
  useEffect(() => {
    setProfilePicture(user?.profilePicture || null);
  }, [user?.profilePicture]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const imageData = reader.result;
          try {
            await updateProfilePicture(imageData);
            setProfilePicture(imageData);
          } catch (error) {
            console.error('Failed to update profile picture:', error);
          }
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing file:', error);
        setIsUploading(false);
      }
    }
  };

  const handleCameraCapture = async (imageData) => {
    try {
      setIsUploading(true);
      await updateProfilePicture(imageData);
      setProfilePicture(imageData);
      setShowCamera(false);
    } catch (error) {
      console.error('Failed to update profile picture:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to truncate text based on available width
  const getTruncatedName = () => {
    if (!nameRef.current || isMobile) return user.name;

    // Get the actual container width and calculate available space for text
    const getAvailableWidth = () => {
      if (isTablet) return 200;
      
      // For desktop, dynamically calculate based on sidebar width
      const sidebar = nameRef.current.closest('.sidebar-container');
      if (sidebar) {
        const sidebarWidth = sidebar.offsetWidth;
        const padding = 48; // 6 * 8px (p-6 = 24px each side)
        const profilePicWidth = 56; // 14 * 4px (w-14)
        const spacing = 16; // space-x-4
        const buffer = 20; // Extra buffer for safety
        
        return Math.max(120, sidebarWidth - padding - profilePicWidth - spacing - buffer);
      }
      
      return 240; // Fallback
    };

    const maxWidth = getAvailableWidth();
    const nameElement = nameRef.current;
    const computedStyle = window.getComputedStyle(nameElement);
    const font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;

    let text = user.name;
    let width = context.measureText(text).width;

    if (width <= maxWidth) return text;

    // Binary search for the optimal length
    let start = 0;
    let end = text.length;
    let bestFit = text;

    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const truncated = text.slice(0, mid) + '...';
      width = context.measureText(truncated).width;

      if (width <= maxWidth) {
        bestFit = truncated;
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }

    return bestFit;
  };

  if (isMobile) {
    return (
      <>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md hover:opacity-80 transition-opacity"
          >
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </button>

          {isOpen && (
            <nav className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" role="menu">
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-sm text-stone-500 truncate">Signed in as</div>
                <div className="text-sm font-medium text-stone-700 truncate">{user.name}</div>
              </div>
              <button
                onClick={() => {
                  setShowCamera(true);
                  setIsOpen(false);
                }}
                disabled={isUploading}
                className={`w-full px-4 py-3 text-sm text-stone-600 hover:bg-gray-50 text-left ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="menuitem"
              >
                Take Photo
              </button>
              <label className={`px-4 py-3 text-sm text-stone-600 hover:bg-gray-50 cursor-pointer flex items-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} role="menuitem">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </label>
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-50 text-left"
                role="menuitem"
              >
                Logout
              </button>
            </nav>
          )}
        </div>

        {showCamera && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </>
    );
  }

  if (isTablet) {
    return (
      <>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-medium text-blue-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span 
              ref={nameRef}
              className="text-base font-medium text-stone-700 max-w-[200px] truncate"
            >
              {getTruncatedName()}
            </span>
          </button>

          {isOpen && (
            <nav className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" role="menu">
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-sm text-stone-500 truncate">Signed in as</div>
                <div className="text-sm font-medium text-stone-700 truncate">{user.name}</div>
              </div>
              <button
                onClick={() => {
                  setShowCamera(true);
                  setIsOpen(false);
                }}
                disabled={isUploading}
                className={`w-full px-4 py-3 text-sm text-stone-600 hover:bg-gray-50 text-left ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="menuitem"
              >
                Take Photo
              </button>
              <label className={`px-4 py-3 text-sm text-stone-600 hover:bg-gray-50 cursor-pointer flex items-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} role="menuitem">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </label>
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-50 text-left"
                role="menuitem"
              >
                Logout
              </button>
            </nav>
          )}
        </div>

        {showCamera && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
        >
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-medium text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span 
            ref={nameRef}
            className="text-lg font-medium text-stone-700 truncate flex-1 min-w-0"
          >
            {getTruncatedName()}
          </span>
        </button>

        {isOpen && (
          <nav className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" role="menu">
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-sm text-stone-500 truncate">Signed in as</div>
              <div className="text-sm font-medium text-stone-700 truncate">{user.name}</div>
            </div>
            <button
              onClick={() => {
                setShowCamera(true);
                setIsOpen(false);
              }}
              disabled={isUploading}
              className={`w-full px-4 py-3 text-sm text-stone-600 hover:bg-gray-50 text-left ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="menuitem"
            >
              Take Photo
            </button>
            <label className={`px-4 py-3 text-sm text-stone-600 hover:bg-gray-50 cursor-pointer flex items-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} role="menuitem">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </label>
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-50 text-left"
              role="menuitem"
            >
              Logout
            </button>
          </nav>
        )}
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}

function SidebarLogin({ onLoginClick, isMobile = false, isTablet = false }) {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isMobile) {
    return (
      <div className="flex items-center">
        {isAuthenticated ? (
          <ProfileMenu user={user} onLogout={handleLogout} isMobile={true} />
        ) : (
          <button 
            onClick={onLoginClick}
            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        )}
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="flex items-center">
        {isAuthenticated ? (
          <ProfileMenu user={user} onLogout={handleLogout} isTablet={true} />
        ) : (
          <button 
            onClick={onLoginClick}
            className="inline-flex items-center justify-center px-4 py-2 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            Login
          </button>
        )}
      </div>
    );
  }

  return (
    <aside className="sidebar-container p-6">
      {isAuthenticated ? (
        <ProfileMenu user={user} onLogout={handleLogout} />
      ) : (
        <button 
          onClick={onLoginClick}
          className="inline-flex items-center justify-center px-4 py-2 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
        >
          Login
        </button>
      )}
    </aside>
  );
}

function AppContent() {
  const [showModal, setShowModal] = useState(false);

  const handleLoginClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Add global styles for hiding scrollbars */}
      <style jsx global>{`
        .hide-scrollbar {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        .hide-scrollbar::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none; /* WebKit */
        }
      `}</style>

      {/* Desktop Layout - screens >= 1200px (xl breakpoint) */}
      <div className="hidden xl:flex">
        {/* Left Sidebar - Desktop */}
        <aside className="fixed left-0 top-0 w-1/5 h-screen bg-stone-200 border-r border-stone-300 z-10">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-600">BruinDigest</h1>
          </div>
        </aside>

        {/* Main Content - Desktop */}
        <main className="flex-1 ml-[20%] mr-[20%]">
          <header className="fixed top-0 left-[20%] right-[20%] bg-stone-200/90 backdrop-blur-sm border-b border-stone-300 z-20">
            <div className="flex items-center justify-center h-16">
              <h2 className="text-lg font-semibold text-stone-700">Today's Campus Trends</h2>
            </div>
          </header>
          <div className="pt-16 h-screen overflow-y-auto hide-scrollbar">
            <Routes>
              <Route path="/" element={<Feed />} />
            </Routes>
          </div>
        </main>

        {/* Right Sidebar - Desktop */}
        <aside className="fixed right-0 top-0 w-1/5 h-screen bg-stone-200 border-l border-stone-300 z-10">
          <SidebarLogin onLoginClick={handleLoginClick} />
        </aside>
      </div>

      {/* Large Tablet Layout - screens 1024px to 1199px (lg to xl breakpoint) */}
      <div className="hidden lg:flex xl:hidden flex-col h-screen">
        {/* Large Tablet Header - Fixed */}
        <header className="fixed top-0 left-0 right-0 bg-stone-200/90 backdrop-blur-sm border-b border-stone-300 z-20 px-6 py-4">
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600">BruinDigest</h1>
            <h2 className="text-lg font-semibold text-stone-700">Today's Campus Trends</h2>
            <SidebarLogin onLoginClick={handleLoginClick} isTablet={true} />
          </nav>
        </header>

        {/* Large Tablet Main Content - Scrollable */}
        <main className="flex-1 pt-20 overflow-y-auto hide-scrollbar">
          <Routes>
            <Route path="/" element={<Feed />} />
          </Routes>
        </main>
      </div>

      {/* Tablet Layout - screens 768px to 1023px (md to lg breakpoint) */}
      <div className="hidden md:flex lg:hidden flex-col h-screen">
        {/* Tablet Header - Fixed */}
        <header className="fixed top-0 left-0 right-0 bg-stone-200/90 backdrop-blur-sm border-b border-stone-300 z-20 px-6 py-4">
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600">BruinDigest</h1>
            <SidebarLogin onLoginClick={handleLoginClick} isTablet={true} />
          </nav>
        </header>

        {/* Tablet Main Content - Scrollable */}
        <main className="flex-1 pt-20 overflow-y-auto hide-scrollbar">
          <Routes>
            <Route path="/" element={<Feed />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Layout - screens < 768px (below md breakpoint) */}
      <div className="md:hidden flex flex-col h-screen">
        {/* Mobile Header - Fixed */}
        <header className="fixed top-0 left-0 right-0 bg-stone-200/90 backdrop-blur-sm border-b border-stone-300 z-20 px-4 py-3">
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600">B</h1>
            <SidebarLogin onLoginClick={handleLoginClick} isMobile={true} />
          </nav>
        </header>

        {/* Mobile Main Content - Scrollable */}
        <main className="flex-1 pt-16 overflow-y-auto hide-scrollbar">
          <Routes>
            <Route path="/" element={<Feed />} />
          </Routes>
        </main>
      </div>

      {showModal && <LoginModal onClose={closeModal} />}
      <CookieBanner />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App; 