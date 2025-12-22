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

  // États des formulaires
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

  // NOUVEAU: État pour les réponses automatiques
  const [autoResponseSettings, setAutoResponseSettings] = useState({
    autoResponseEnabled: false,
  });
  const [autoResponseLoading, setAutoResponseLoading] = useState(false);

  // Charger les paramètres de réponse automatique au montage
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
      console.error("Erreur chargement paramètres auto-response:", error);
    }
  };

  const handleAutoResponseToggle = async () => {
    // Vérifier si l'utilisateur a configuré un email
    if (!user?.hasConfiguredEmail && !autoResponseSettings.autoResponseEnabled) {
      setMessage({
        type: "error",
        text: "Vous devez d'abord configurer votre email dans Intégrations avant d'activer les réponses automatiques.",
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

        // Rafraîchir le contexte utilisateur
        checkAuth();
      }
    } catch (error) {
      console.error("Erreur toggle auto-response:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Erreur lors de la mise à jour",
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
          <FontAwesomeIcon icon={faArrowLeft} /> Retour au Dashboard
        </button>
        <h1 className="page-title">Paramètres</h1>
      </header>

      {/* Message global */}
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
            <FontAwesomeIcon icon={faUser} /> Profil
          </button>
          <button
            className={`tab-button ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <FontAwesomeIcon icon={faLock} /> Mot de passe
          </button>
          <button
            className={`tab-button ${activeTab === "autoresponse" ? "active" : ""}`}
            onClick={() => setActiveTab("autoresponse")}
          >
            <FontAwesomeIcon icon={faRobot} /> Réponse Automatique
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
            <FontAwesomeIcon icon={faCog} /> Préférences
          </button>
        </aside>

        {/* Content */}
        <main className="settings-content">
          {/* Profile */}
          {activeTab === "profile" && (
            <div className="tab-content">
              <h2 className="tab-title">Informations du profil</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Adresse email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled
                    placeholder="Email"
                  />
                  <span className="helper-text">
                    L'email ne peut pas être modifié
                  </span>
                </div>
                <div className="form-group">
                  <label>Rôle</label>
                  <select
                    value={profileData.role}
                    disabled
                    className="disabled-select"
                  >
                    <option>{profileData.role}</option>
                  </select>
                  <span className="helper-text">
                    Contactez un administrateur pour changer de rôle
                  </span>
                </div>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </form>
            </div>
          )}

          {/* Password */}
          {activeTab === "password" && (
            <div className="tab-content">
              <h2 className="tab-title">Changer le mot de passe</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                  <label>Mot de passe actuel</label>
                  <input
                    type="password"
                    name="currentPassword"
                    onChange={handlePasswordChange}
                    placeholder="Entrez votre mot de passe actuel"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nouveau mot de passe</label>
                  <input
                    type="password"
                    name="newPassword"
                    onChange={handlePasswordChange}
                    placeholder="Entrez un nouveau mot de passe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    onChange={handlePasswordChange}
                    placeholder="Confirmez le nouveau mot de passe"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </button>
              </form>
            </div>
          )}

          {/* NOUVEAU: Auto-Response Tab */}
          {activeTab === "autoresponse" && (
            <div className="tab-content">
              <h2 className="tab-title">Réponse Automatique AI</h2>

              <div className="info-card">
                <div className="info-icon">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <div className="info-content">
                  <h3>Comment ça fonctionne ?</h3>
                  <p>
                    Lorsque la réponse automatique est activée, l'IA analysera automatiquement
                    tous les emails de <strong>priorité Low et Medium</strong> et enverra une réponse
                    intelligente si nécessaire.
                  </p>
                  <ul>
                    <li>✓ Réponses uniquement pour les emails Low/Medium</li>
                    <li>✓ L'IA vérifie si une réponse est nécessaire</li>
                    <li>✓ Les emails High/Critical nécessitent une réponse manuelle</li>
                    <li>✓ Fonctionne toutes les 5 minutes avec le système de synchronisation</li>
                  </ul>
                </div>
              </div>

              {!user?.hasConfiguredEmail && (
                <div className="warning-card">
                  <FontAwesomeIcon icon={faTimes} />
                  <div>
                    <h4>Email non configuré</h4>
                    <p>
                      Vous devez d'abord configurer votre email dans la page
                      <button
                        className="link-button"
                        onClick={() => navigate("/integrations")}
                      >
                        Intégrations
                      </button>
                      avant d'activer les réponses automatiques.
                    </p>
                  </div>
                </div>
              )}

              <div className="auto-response-card">
                <div className="card-header-inline">
                  <div>
                    <h3>Activer les réponses automatiques</h3>
                    <p className="card-subtitle">
                      {autoResponseSettings.autoResponseEnabled
                        ? "Les réponses automatiques sont actuellement activées"
                        : "Les réponses automatiques sont actuellement désactivées"}
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
                    <h4>Réponses automatiques actives</h4>
                    <p>
                      L'IA répond automatiquement aux emails de priorité Low et Medium
                      lors de chaque synchronisation (toutes les 5 minutes).
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="tab-content">
              <h2 className="tab-title">Paramètres de notification</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="toggle-group">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div className="toggle-item" key={key}>
                      <div className="toggle-info">
                        <h3>{key.replace(/([A-Z])/g, " $1").trim()}</h3>
                        <p>
                          Activer {key.replace(/([A-Z])/g, " $1").toLowerCase()}{" "}
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
                  Enregistrer les modifications
                </button>
              </form>
            </div>
          )}

          {/* Preferences */}
          {activeTab === "preferences" && (
            <div className="tab-content">
              <h2 className="tab-title">Préférences de l'application</h2>
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                  <label>Langue</label>
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
                <div className="form-group">
                  <label>Fuseau horaire</label>
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
                  <label>Format de date</label>
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
                  <label>Thème</label>
                  <select
                    name="theme"
                    value={preferences.theme}
                    onChange={handlePreferenceChange}
                  >
                    <option value="dark">Sombre</option>
                    <option value="light">Clair</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  Enregistrer les préférences
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
