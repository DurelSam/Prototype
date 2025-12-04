import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import backgroundImage from '../login-background-image.jpg';
import '../styles/Dashboard.css';

function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Set greeting message based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="dashboard-overlay"></div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="dashboard-overlay"></div>

      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="app-title">SaaS Communications</h1>
            <span className="company-name">{user?.tenant?.companyName}</span>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-card">
            <h2 className="welcome-title">
              {greeting}, {user?.firstName || 'User'}!
            </h2>
            <p className="welcome-text">
              Welcome to your communications management dashboard.
            </p>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <h3 className="stat-number">0</h3>
              <p className="stat-label">Emails Outlook</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3 className="stat-number">0</h3>
              <p className="stat-label">WhatsApp Messages</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3 className="stat-number">0</h3>
              <p className="stat-label">AI Analyses</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3 className="stat-number">1</h3>
              <p className="stat-label">Users</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-cards">
            <div className="action-card">
              <div className="action-icon">📮</div>
              <h4>Connect Outlook</h4>
              <p>Sync your Outlook account</p>
              <button className="action-button" onClick={() => navigate('/integrations')}>
                Go to Integrations
              </button>
            </div>

            <div className="action-card">
              <div className="action-icon">📱</div>
              <h4>Connect WhatsApp</h4>
              <p>Integrate WhatsApp Business</p>
              <button className="action-button" onClick={() => navigate('/integrations')}>
                Go to Integrations
              </button>
            </div>

            <div className="action-card">
              <div className="action-icon">🤖</div>
              <h4>View Communications</h4>
              <p>See all your messages with AI analysis</p>
              <button className="action-button" onClick={() => navigate('/communications')}>
                View Communications
              </button>
            </div>

            <div className="action-card">
              <div className="action-icon">⚙️</div>
              <h4>Settings</h4>
              <p>Configure your account</p>
              <button className="action-button" onClick={() => navigate('/settings')}>
                Open Settings
              </button>
            </div>
          </div>
        </section>

        {/* Management Section */}
        <section className="actions-section">
          <h3 className="section-title">Management</h3>
          <div className="action-cards">
            {user?.role === 'Admin' && (
              <div className="action-card">
                <div className="action-icon">👥</div>
                <h4>User Management</h4>
                <p>Manage team members and roles</p>
                <button className="action-button" onClick={() => navigate('/users')}>
                  Manage Users
                </button>
              </div>
            )}

            <div className="action-card">
              <div className="action-icon">📊</div>
              <h4>Analytics</h4>
              <p>View insights and reports</p>
              <button className="action-button" onClick={() => navigate('/analytics')}>
                View Analytics
              </button>
            </div>

            <div className="action-card">
              <div className="action-icon">💳</div>
              <h4>Subscription</h4>
              <p>Manage your plan and billing</p>
              <button className="action-button" onClick={() => navigate('/subscription')}>
                Manage Subscription
              </button>
            </div>
          </div>
        </section>

        {/* Subscription Info */}
        <section className="subscription-section">
          <div className="subscription-card">
            <div className="subscription-header">
              <h3>Subscription</h3>
              <span className={`subscription-badge ${user?.tenant?.subscriptionStatus?.toLowerCase()}`}>
                {user?.tenant?.subscriptionStatus || 'Trial'}
              </span>
            </div>
            <p className="subscription-text">
              Your account is currently on a trial period.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
