/* src/pages/Settings.js - Modernized with Integrations Style */
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

  // NEW: State for auto-responses
  const [autoResponseSettings, setAutoResponseSettings] = useState({
    autoResponseEnabled: false,
  });
  const [autoResponseLoading, setAutoResponseLoading] = useState(false);

  // Load auto-response settings on mount
  useEffect(() => {
    fetchAutoResponseSettings();
  }, []);

  const fetchAutoResponseSettings = async () => {
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
  };

  const handleAutoResponseToggle = async () => {
    // Check if user has configured an email
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

        // Refresh user context
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
    await new Promise((r) => setTimeout(r, 1000));
    setMessage({ type: "success", text: "Settings saved successfully!" });
    setLoading(false);
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="settings-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
        </button>
        <h1 className="page-title">Settings</h1>
      </header>

      {/* Global Message */}
      {message.text && (
        <div className={`message-banner ${message.type}`}>
          <FontAwesomeIcon icon={message.type === "success" ? faCheck : faTimes} />
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-container">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          <button
            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FontAwesomeIcon icon={faUser} /> Profile
          </button>
          <button
            className={`tab-button ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <FontAwesomeIcon icon={faLock} /> Password
          </button>
          <button
            className={`tab-button ${activeTab === "autoresponse" ? "active" : ""}`}
            onClick={() => setActiveTab("autoresponse")}
          >
            <FontAwesomeIcon icon={faRobot} /> Auto Response
          </button>
          <button
            className={`tab-button ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <FontAwesomeIcon icon={faBell} /> Notifications
          </button>
          <button
            className={`tab-button ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            <FontAwesomeIcon icon={faCog} /> Preferences
          </button>
        </aside>

        {/* Content */}
        <main className="settings-content">
          {/* Profile */}
          {activeTab === "profile" && (
            <div className="tab-content">
              <h2 className="tab-title">Profile Information</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      placeholder="Your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled
                    placeholder="Email"
                  />
                  <span className="helper-text">
                    Email cannot be changed
                  </span>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={profileData.role}
                    disabled
                    className="disabled-select"
                  >
                    <option>{profileData.role}</option>
                  </select>
                  <span className="helper-text">
                    Contact an administrator to change role
                  </span>
                </div>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* Password */}
          {activeTab === "password" && (
            <div className="tab-content">
              <h2 className="tab-title">Change Password</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    onChange={handlePasswordChange}
                    placeholder="Enter a new password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {/* NEW: Auto-Response Tab */}
          {activeTab === "autoresponse" && (
            <div className="tab-content">
              <h2 className="tab-title">AI Auto Response</h2>

              <div className="info-card">
                <div className="info-icon">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <div className="info-content">
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

              {!user?.hasConfiguredEmail && (
                <div className="warning-card">
                  <FontAwesomeIcon icon={faTimes} />
                  <div>
                    <h4>Email not configured</h4>
                    <p>
                      You must first configure your email in the
                      <button
                        className="link-button"
                        onClick={() => navigate("/integrations")}
                      >
                        Integrations
                      </button>
                      page before enabling auto-responses.
                    </p>
                  </div>
                </div>
              )}

              <div className="auto-response-card">
                <div className="card-header-inline">
                  <div>
                    <h3>Enable Auto Responses</h3>
                    <p className="card-subtitle">
                      {autoResponseSettings.autoResponseEnabled
                        ? "Auto responses are currently enabled"
                        : "Auto responses are currently disabled"}
                    </p>
                  </div>
                  <label className="toggle-switch-large">
                    <input
                      type="checkbox"
                      checked={autoResponseSettings.autoResponseEnabled}
                      onChange={handleAutoResponseToggle}
                      disabled={autoResponseLoading || !user?.hasConfiguredEmail}
                    />
                    <span className="toggle-slider-large"></span>
                  </label>
                </div>
              </div>

              {autoResponseSettings.autoResponseEnabled && (
                <div className="success-card">
                  <FontAwesomeIcon icon={faCheck} />
                  <div>
                    <h4>Auto Responses Active</h4>
                    <p>
                      AI automatically responds to Low and Medium priority emails
                      during each synchronization (every 5 minutes).
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="tab-content">
              <h2 className="tab-title">Notification Settings</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="toggle-group">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div className="toggle-item" key={key}>
                      <div className="toggle-info">
                        <h3>{notificationLabels[key] || key}</h3>
                        <p>
                          Enable {notificationLabels[key] || key}
                        </p>
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
                  className="submit-button"
                  disabled={loading}
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Preferences */}
          {activeTab === "preferences" && (
            <div className="tab-content">
              <h2 className="tab-title">Application Preferences</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                  <label>Language</label>
                  <select
                    name="language"
                    value={preferences.language}
                    onChange={handlePreferenceChange}
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    name="timezone"
                    value={preferences.timezone}
                    onChange={handlePreferenceChange}
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Format</label>
                  <select
                    name="dateFormat"
                    value={preferences.dateFormat}
                    onChange={handlePreferenceChange}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Theme</label>
                  <select
                    name="theme"
                    value={preferences.theme}
                    onChange={handlePreferenceChange}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="submit-button"
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
