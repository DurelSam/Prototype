import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Communications from './pages/Communications';
import CommunicationDetails from './pages/CommunicationDetails';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import Subscription from './pages/Subscription';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Default route - redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* All routes (no authentication required for now) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/communications/:id" element={<CommunicationDetails />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/subscription" element={<Subscription />} />

          {/* 404 route - redirects to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
