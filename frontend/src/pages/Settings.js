import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faBell,
  faCog,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/Settings.css";

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // États des formulaires (identiques à ton code original)
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

  // Handlers (inchangés, juste simplifiés)
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
            className={`tab-button ${
              activeTab === "notifications" ? "active" : ""
            }`}
            onClick={() => setActiveTab("notifications")}
          >
            <FontAwesomeIcon icon={faBell} /> Notifications
          </button>
          <button
            className={`tab-button ${
              activeTab === "preferences" ? "active" : ""
            }`}
            onClick={() => setActiveTab("preferences")}
          >
            <FontAwesomeIcon icon={faCog} /> Preferences
          </button>
        </aside>

        {/* Content */}
        <main className="settings-content">
          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

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
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
                <div className className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
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
                    Contact admin to change role
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
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    onChange={handlePasswordChange}
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

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="tab-content">
              <h2 className="tab-title">Notification Settings</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="toggle-group">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div className="toggle-item" key={key}>
                      <div className="toggle-info">
                        <h3>{key.replace(/([A-Z])/g, " $1").trim()}</h3>
                        <p>
                          Toggle {key.replace(/([A-Z])/g, " $1").toLowerCase()}{" "}
                          notifications
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
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div className className="form-group">
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
