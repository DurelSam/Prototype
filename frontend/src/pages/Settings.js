/* src/pages/Settings.js - Complete Redesign with Modern Layout */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faBell,
  faCog,
  faArrowLeft,
  faRobot,
  faCheck,
  faTimes,
  faInfoCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "../styles/Settings.css";

function Settings() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("authToken");

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form states
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    role: user?.role || "Employee",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    whatsappNotifications: true,
    aiAnalysisNotifications: true,
    weeklyReport: false,
    instantAlerts: true,
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    theme: "dark",
  });

  const notificationLabels = {
    emailNotifications: "Email Notifications",
    whatsappNotifications: "WhatsApp Notifications",
    aiAnalysisNotifications: "AI Analysis Notifications",
    weeklyReport: "Weekly Report",
    instantAlerts: "Instant Alerts",
  };

  // Auto-response settings
  const [autoResponseSettings, setAutoResponseSettings] = useState({
    autoResponseEnabled: false,
  });
  const [autoResponseLoading, setAutoResponseLoading] = useState(false);

  // Load auto-response settings on mount
  // Define fetch function with useCallback to avoid infinite loops and stale closures
  const fetchAutoResponseSettings = React.useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/users/me/auto-response-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAutoResponseSettings(response.data.data);
      }
    } catch (error) {
      console.error("Error loading auto-response settings:", error);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchAutoResponseSettings();
  }, [fetchAutoResponseSettings]);

  const handleAutoResponseToggle = async () => {
    if (!user?.hasConfiguredEmail && !autoResponseSettings.autoResponseEnabled) {
      setMessage({
        type: "error",
        text: "You must first configure your email in Integrations before enabling auto-responses.",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return;
    }

    try {
      setAutoResponseLoading(true);
      const newValue = !autoResponseSettings.autoResponseEnabled;

      const response = await axios.put(
        `${API_URL}/users/me/auto-response-settings`,
        { autoResponseEnabled: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAutoResponseSettings(response.data.data);
        setMessage({
          type: "success",
          text: response.data.message,
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        checkAuth();
      }
    } catch (error) {
      console.error("Error toggling auto-response:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error updating settings",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } finally {
      setAutoResponseLoading(false);
    }
  };

  // Handlers
  const handleProfileChange = (e) =>
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  const handleNotificationChange = (key) =>
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  const handlePreferenceChange = (e) =>
    setPreferences({ ...preferences, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Logic for Profile Update
      if (activeTab === "profile") {
        const response = await axios.put(
          `${API_URL}/users/profile`,
          {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setMessage({ type: "success", text: "Profile updated successfully!" });
          checkAuth(); // Update user context
        }
      }

      // 2. Logic for Password Update
      else if (activeTab === "password") {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setMessage({ type: "error", text: "New passwords do not match" });
          setLoading(false);
          return;
        }

        const response = await axios.put(
          `${API_URL}/auth/change-password`,
          {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setMessage({ type: "success", text: "Password changed successfully!" });
          // Clear password fields
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      }

      // 3. Logic for Notification Settings (Mock for now, or implement if endpoint exists)
      else if (activeTab === "notifications") {
        // Assuming there might be an endpoint later, simulating success for now
        await new Promise((r) => setTimeout(r, 500));
        setMessage({ type: "success", text: "Notification settings saved!" });
      }

      // 4. Logic for Preferences (Mock for now)
      else if (activeTab === "preferences") {
        // Assuming there might be an endpoint later
        await new Promise((r) => setTimeout(r, 500));
        setMessage({ type: "success", text: "Preferences saved successfully!" });
      }

    } catch (error) {
      console.error("Settings update error:", error);
      const errorMsg = error.response?.data?.message || "An error occurred while saving";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: faUser },
    { id: "password", label: "Password", icon: faLock },
    { id: "autoresponse", label: "Auto Response", icon: faRobot },
    { id: "notifications", label: "Notifications", icon: faBell },
    { id: "preferences", label: "Preferences", icon: faCog },
  ];

  return (
    <div className="settings-page">
      {/* Message Banner */}
      {message.text && (
        <div className={`message-banner ${message.type}`}>
          <FontAwesomeIcon icon={message.type === "success" ? faCheck : faTimes} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="settings-header">
        <div className="settings-header-content">
          <button className="back-button" onClick={() => navigate("/dashboard")}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">Settings</h1>
        </div>
      </header>

      {/* Main Layout */}
      <div className="settings-layout">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          <h2 className="sidebar-title">Configuration</h2>
          <nav className="tab-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <FontAwesomeIcon icon={tab.icon} className="tab-icon" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="settings-content">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2 className="tab-title">Profile Information</h2>
                <p className="tab-description">
                  Manage your personal information and account details
                </p>
              </div>

              <form onSubmit={handleSubmit} className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      placeholder="Enter your first name"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      placeholder="Enter your last name"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="form-input"
                  />
                  <span className="form-help">
                    Email cannot be changed
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    value={profileData.role}
                    disabled
                    className="form-select"
                  >
                    <option>{profileData.role}</option>
                  </select>
                  <span className="form-help">
                    Contact an administrator to change role
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2 className="tab-title">Change Password</h2>
                <p className="tab-description">
                  Update your password to keep your account secure
                </p>
              </div>

              <form onSubmit={handleSubmit} className="form-section">
                <div className="form-group">
                  <label className="form-label" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    onChange={handlePasswordChange}
                    placeholder="Enter a new password"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                    className="form-input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {/* Auto Response Tab */}
          {activeTab === "autoresponse" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2 className="tab-title">AI Auto Response</h2>
                <p className="tab-description">
                  Configure automatic email responses powered by AI
                </p>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-icon info">
                    <FontAwesomeIcon icon={faInfoCircle} />
                  </div>
                  <div className="card-content">
                    <h3>How does it work?</h3>
                    <p>
                      When auto-response is enabled, AI will automatically analyze
                      all <strong>Low and Medium priority</strong> emails and send an
                      intelligent response if necessary.
                    </p>
                    <ul>
                      <li>✓ Responses only for Low/Medium emails</li>
                      <li>✓ AI checks if a response is necessary</li>
                      <li>✓ High/Critical emails require manual response</li>
                      <li>✓ Runs every 5 minutes with the synchronization system</li>
                    </ul>
                  </div>
                </div>
              </div>

              {!user?.hasConfiguredEmail && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-icon warning">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                    </div>
                    <div className="card-content">
                      <h4>Email not configured</h4>
                      <p>
                        You must first configure your email in the{" "}
                        <button
                          className="link-button"
                          onClick={() => navigate("/integrations")}
                        >
                          Integrations
                        </button>{" "}
                        page before enabling auto-responses.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="toggle-control">
                <div className="toggle-info">
                  <h3>Enable Auto Responses</h3>
                  <p>
                    {autoResponseSettings.autoResponseEnabled
                      ? "Auto responses are currently enabled"
                      : "Auto responses are currently disabled"}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoResponseSettings.autoResponseEnabled}
                    onChange={handleAutoResponseToggle}
                    disabled={autoResponseLoading || !user?.hasConfiguredEmail}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {autoResponseSettings.autoResponseEnabled && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-icon success">
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                    <div className="card-content">
                      <h4>Auto Responses Active</h4>
                      <p>
                        AI automatically responds to Low and Medium priority emails
                        during each synchronization (every 5 minutes).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2 className="tab-title">Notification Settings</h2>
                <p className="tab-description">
                  Control how you receive notifications and alerts
                </p>
              </div>

              <form onSubmit={handleSubmit} className="form-section">
                <div className="mb-xl">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div className="toggle-control" key={key}>
                      <div className="toggle-info">
                        <h3>{notificationLabels[key] || key}</h3>
                        <p>Enable {notificationLabels[key] || key}</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => handleNotificationChange(key)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={loading}
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2 className="tab-title">Application Preferences</h2>
                <p className="tab-description">
                  Customize your application experience
                </p>
              </div>

              <form onSubmit={handleSubmit} className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="language">
                      Language
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={preferences.language}
                      onChange={handlePreferenceChange}
                      className="form-select"
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="timezone">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={preferences.timezone}
                      onChange={handlePreferenceChange}
                      className="form-select"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Dubai">Dubai (GST)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dateFormat">
                      Date Format
                    </label>
                    <select
                      id="dateFormat"
                      name="dateFormat"
                      value={preferences.dateFormat}
                      onChange={handlePreferenceChange}
                      className="form-select"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="theme">
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={preferences.theme}
                      onChange={handlePreferenceChange}
                      className="form-select"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={loading}
                >
                  Save Preferences
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Settings;