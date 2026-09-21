import React, { useState, useEffect } from 'react';
import UserLogin from './components/UserLogin';
import UserRegister from './components/UserRegister';
import AdminLogin from './components/AdminLogin';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('securepay_token') || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('securepay_user')) || null;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentView] = useState(() => {
    const savedToken = localStorage.getItem('securepay_token');
    const savedUser = localStorage.getItem('securepay_user');
    if (savedToken && savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return u.role === 'admin' ? 'admin-dashboard' : 'user-dashboard';
      } catch {
        return 'login';
      }
    }
    return 'login';
  });

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('securepay_token', newToken);
    localStorage.setItem('securepay_user', JSON.stringify(newUser));

    if (newUser.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('user-dashboard');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('securepay_token');
    localStorage.removeItem('securepay_user');
    setCurrentView('login');
  };

  // Render view based on state
  if (token && user) {
    if (user.role === 'admin' && currentView === 'admin-dashboard') {
      return (
        <AdminDashboard
          token={token}
          adminUser={user}
          onLogout={handleLogout}
        />
      );
    }
    if (user.role === 'user' || currentView === 'user-dashboard') {
      return (
        <UserDashboard
          token={token}
          user={user}
          onLogout={handleLogout}
        />
      );
    }
  }

  if (currentView === 'register') {
    return (
      <UserRegister
        onRegisterSuccess={handleLoginSuccess}
        onSwitchToLogin={() => setCurrentView('login')}
      />
    );
  }

  if (currentView === 'admin-login') {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onSwitchToUserLogin={() => setCurrentView('login')}
      />
    );
  }

  // Default: Normal User Login Page with attached background image
  return (
    <UserLogin
      onLoginSuccess={handleLoginSuccess}
      onSwitchToRegister={() => setCurrentView('register')}
      onSwitchToAdmin={() => setCurrentView('admin-login')}
    />
  );
}
