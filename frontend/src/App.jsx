import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Companies from './components/Companies';
import Contacts from './components/Contacts';
import ContactDetail from './components/ContactDetail';
import OutreachHistory from './components/OutreachHistory';
import Campaigns from './components/Campaigns';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import AdminUsers from './components/AdminUsers';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="app">
      {user && (
        <nav className="navbar">
          <h1>📊 Prospector</h1>
          <nav>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/companies">Companies</NavLink>
            <NavLink to="/contacts">Contacts</NavLink>
            <NavLink to="/outreach">Outreach History</NavLink>
            <NavLink to="/campaigns">Campaigns</NavLink>
            {user.isAdmin && (
              <NavLink to="/admin/users">👑 Admin</NavLink>
            )}
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NavLink
              to="/profile"
              style={{
                color: '#666',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>👤</span>
              <span>{user.username}</span>
            </NavLink>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </nav>
      )}
      
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <Companies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts/:id"
          element={
            <ProtectedRoute>
              <ContactDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/outreach"
          element={
            <ProtectedRoute>
              <OutreachHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

// Made with Bob
