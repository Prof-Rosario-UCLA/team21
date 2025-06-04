import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Feed from './components/Feed';
import LoginModal from './components/LoginModal';
import CookieBanner from './components/CookieBanner';

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
  };

  return (
    <Router>
      <div className="h-screen bg-orange-50 flex flex-col">
        <Header onLoginClick={handleLoginClick} />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Feed />} />
          </Routes>
        </main>
        <CookieBanner />
        {showLoginModal && <LoginModal onClose={handleCloseLogin} />}
      </div>
    </Router>
  );
}

export default App; 