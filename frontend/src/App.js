import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RideComparePage from './pages/RideComparePage';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('access_token'));

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setLoggedIn(false);
  };

  return (
    <div className="App">
      {loggedIn ? (
        <>
          <button onClick={handleLogout} style={{ float: 'right', margin: '10px' }}>
            Logout
          </button>
          <RideComparePage />
        </>
      ) : (
        <LoginPage onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;