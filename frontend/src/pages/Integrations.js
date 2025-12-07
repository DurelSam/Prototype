/* src/pages/Integrations.js */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faCommentDots,
  faSync,
  faRobot,
  faLock,
  faChartBar,
  faPlug,
  faArrowLeft,
  faTimes,
  faKey,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/Integrations.css";

function Integrations() {
  const navigate = useNavigate();
  const location = useLocation(); // Nécessaire pour lire les paramètres d'URL (success/error)
  const [activeService, setActiveService] = useState(null);
  const { user } = useAuth();

  // API Configuration
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("authToken");

  // Données Mock avec statut et stats enrichies
  const initialIntegrations = {
    outlook: {
      id: 1,
      name: "Microsoft Outlook Email",
      icon: faEnvelope,
      connected: false,
      email: null,
      lastSync: null,
      messagesCount: 0,
      syncStatus: "Inactive",
    },
    whatsapp: {
      id: 2,
      name: "WhatsApp Business API",
      icon: faCommentDots,
      connected: false,
      phoneNumber: "+1 555-123-4567",
      lastSync: null,
      messagesCount: 0,
      syncStatus: "Inactive",
    },
  };

  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // États des formulaires
  const [whatsappForm, setWhatsappForm] = useState({
    phoneNumber: "",
    apiKey: "",
  });

  // ---------------------------------------------------------------------------
  // 1. FONCTION CENTRALE DE RÉCUPÉRATION (Définie ici pour être accessible partout)
  // ---------------------------------------------------------------------------
  const fetchOutlookStats = React.useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/outlook/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setIntegrations((prev) => ({
          ...prev,
          outlook: {
            ...prev.outlook,
            connected: response.data.isConnected, // C'est ici que le badge passe au VERT
            email: response.data.email || user?.email || null,
            lastSync: response.data.lastSync
              ? new Date(response.data.lastSync)
              : null,
            messagesCount: response.data.messagesCount || 0,
            syncStatus: response.data.isConnected ? "Active" : "Inactive",
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching Outlook stats:", error);
      // On ne bloque pas l'interface ici, on log juste l'erreur
    }
  }, [API_URL, token, user?.email]);

  // ---------------------------------------------------------------------------
  // 2. EFFET : Chargement initial des données
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchOutlookStats();
      setLoading(false);
    };

    if (token) {
      init();
    }
  }, [token, fetchOutlookStats]);

  // ---------------------------------------------------------------------------
  // 3. EFFET : Gestion du retour OAuth (Le Callback Microsoft)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");
    const error = params.get("error");
    const email = params.get("email");

    if (success) {
      // 1. Afficher le message de succès
      setMessage({
        type: "success",
        text: `Compte Outlook connecté avec succès ! (${email || "Vérifié"})`,
      });

      // 2. Nettoyer l'URL (pour enlever ?success=true et faire propre)
      window.history.replaceState({}, document.title, window.location.pathname);

      // 3. FORCER LA MISE À JOUR DU BADGE IMMÉDIATEMENT
      fetchOutlookStats();
    } else if (error) {
      setMessage({
        type: "error",
        text: `Erreur de connexion : ${decodeURIComponent(error)}`,
      });
    }
  }, [location, fetchOutlookStats]);

  // ---------------------------------------------------------------------------
  // HANDLERS (Gestion des actions)
  // ---------------------------------------------------------------------------

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setWhatsappForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnect = async (service, e) => {
    if (e) e.preventDefault();
    setLoading(true); // Petit chargement visuel pendant la redirection
    setMessage({ type: "", text: "" });

    if (service === "outlook") {
      try {
        // Demander l'URL à notre Backend
        const response = await axios.get(`${API_URL}/auth/outlook/url`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.authUrl) {
          // Redirection vers Microsoft
          window.location.href = response.data.authUrl;
        }
      } catch (error) {
        console.error("Error connecting Outlook:", error);
        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Failed to initiate Outlook connection",
        });
        setLoading(false);
      }
    } else if (service === "whatsapp") {
      // Simulation pour WhatsApp (À implémenter plus tard)
      setTimeout(() => {
        const phone = whatsappForm.phoneNumber;
        setIntegrations((prev) => ({
          ...prev,
          whatsapp: {
            ...prev.whatsapp,
            connected: true,
            phoneNumber: phone,
            lastSync: new Date(),
            messagesCount: 50,
            syncStatus: "Active",
          },
        }));
        setMessage({
          type: "success",
          text: `Successfully connected WhatsApp for ${phone}!`,
        });
        setActiveService(null);
        setLoading(false);
      }, 1500);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post(
        `${API_URL}/auth/outlook/sync`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Rafraîchir les stats après la synchronisation
        await fetchOutlookStats(); // On réutilise notre fonction centrale

        setMessage({
          type: "success",
          text:
            response.data.message || "Synchronization completed successfully!",
        });
      }
    } catch (error) {
      console.error("Error syncing Outlook:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to sync Outlook emails",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (service) => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (service === "outlook") {
      try {
        const response = await axios.post(
          `${API_URL}/auth/outlook/disconnect`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setIntegrations((prev) => ({
            ...prev,
            outlook: {
              ...prev.outlook,
              connected: false,
              email: null,
              lastSync: null,
              messagesCount: 0,
              syncStatus: "Inactive",
            },
          }));
          setMessage({
            type: "success", // Changé en success (vert) car c'est une action réussie
            text: "Outlook integration disconnected successfully.",
          });
        }
      } catch (error) {
        console.error("Error disconnecting Outlook:", error);
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to disconnect Outlook",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Mock WhatsApp Disconnect
      setTimeout(() => {
        setIntegrations((prev) => ({
          ...prev,
          [service]: {
            ...prev[service],
            connected: false,
            lastSync: new Date(),
            messagesCount: 0,
            syncStatus: "Inactive",
          },
        }));
        setMessage({
          type: "success",
          text: `${service.toUpperCase()} integration disconnected.`,
        });
        setLoading(false);
      }, 1000);
    }
  };

  const allIntegrations = Object.values(integrations);

  const renderIntegrationCard = (integration, index) => {
    const isConnected = integration.connected;

    return (
      <div
        key={integration.id}
        className="integration-card"
        style={{ animationDelay: `${index * 0.15}s` }}
      >
        <div className="card-header">
          <span
            className="service-icon"
            data-service={
              integration.name.toLowerCase().includes("whatsapp")
                ? "whatsapp"
                : "outlook"
            }
          >
            <FontAwesomeIcon icon={integration.icon} />
          </span>
          <h2 className="service-name">{integration.name}</h2>
          <span
            className={`status-badge ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            {isConnected ? "Connected" : "Inactive"}
          </span>
        </div>

        <p className="card-info">
          {isConnected
            ? `Integrated with: ${
                integration.email || integration.phoneNumber
              }. All communications are being synced.`
            : `Integration is required to start syncing data from ${integration.name}.`}
        </p>

        <div className="card-stats">
          <div className="stat-item">
            <span className="stat-value">
              {integration.messagesCount.toLocaleString()}
            </span>
            <span className="stat-label">Messages Synced</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {integration.lastSync
                ? new Date(integration.lastSync).toLocaleTimeString()
                : "N/A"}
            </span>
            <span className="stat-label">Last Sync Time</span>
          </div>
          <div className="stat-item">
            <span
              className="stat-value"
              style={{ color: isConnected ? "#10b981" : "#ef4444" }}
            >
              {integration.syncStatus}
            </span>
            <span className="stat-label">Sync Status</span>
          </div>
        </div>

        <div className="card-actions">
          {isConnected ? (
            <>
              {integration.name.toLowerCase().includes("outlook") && (
                <button
                  className="action-button sync-btn"
                  onClick={handleSyncNow}
                  disabled={syncing}
                >
                  <FontAwesomeIcon icon={faSync} spin={syncing} />
                  {syncing ? " Syncing..." : " Sync Now"}
                </button>
              )}
              <button
                className="action-button disconnect-btn"
                onClick={() =>
                  handleDisconnect(
                    integration.name.toLowerCase().includes("whatsapp")
                      ? "whatsapp"
                      : "outlook"
                  )
                }
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              className="action-button connect-btn"
              onClick={() => {
                const service = integration.name
                  .toLowerCase()
                  .includes("whatsapp")
                  ? "whatsapp"
                  : "outlook";

                if (service === "outlook") {
                  handleConnect("outlook");
                } else {
                  setActiveService(service);
                }
              }}
            >
              Connect Now
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderWhatsappForm = () => (
    <div className="integration-form-section">
      <div className="form-header">
        <h2 className="form-title">Set Up WhatsApp</h2>
        <button className="close-btn" onClick={() => setActiveService(null)}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      {message.type && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}
      <form
        onSubmit={(e) => handleConnect("whatsapp", e)}
        className="form-grid"
      >
        <div className="form-group">
          <label htmlFor="whatsapp-phoneNumber">Phone Number</label>
          <div className="form-input-wrapper">
            <span className="form-input-icon">
              <FontAwesomeIcon icon={faPhone} />
            </span>
            <input
              type="tel"
              id="whatsapp-phoneNumber"
              name="phoneNumber"
              value={whatsappForm.phoneNumber}
              onChange={handleFormChange}
              className="form-input"
              placeholder="+1 555 123 4567"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="whatsapp-apiKey">API Key</label>
          <div className="form-input-wrapper">
            <span className="form-input-icon">
              <FontAwesomeIcon icon={faKey} />
            </span>
            <input
              type="password"
              id="whatsapp-apiKey"
              name="apiKey"
              value={whatsappForm.apiKey}
              onChange={handleFormChange}
              className="form-input"
              placeholder="****************"
              required
            />
          </div>
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label>Webhook URL (Optional)</label>
          <div className="form-input-wrapper">
            <span className="form-input-icon">
              <FontAwesomeIcon icon={faSync} />
            </span>
            <input
              type="url"
              className="form-input"
              placeholder="https://your-api.com/webhook"
            />
          </div>
        </div>
        <button type="submit" className="form-submit-btn">
          <FontAwesomeIcon icon={faPlug} /> Connect WhatsApp
        </button>
      </form>
    </div>
  );

  if (loading) {
    return (
      <div className="integrations-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations-page">
      <div className="integrations-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
        </button>
        <h1 className="page-title">Platform Integrations</h1>
      </div>

      {activeService === "whatsapp" && renderWhatsappForm()}

      {message.type && !activeService && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="integrations-grid">
        {allIntegrations.map(renderIntegrationCard)}
      </div>

      <div className="info-section">
        <h3>About Integrations</h3>
        <p>
          Connect your communication platforms to centralize all your messages
          in one place. Our AI will analyze your communications and provide
          insights to help you stay organized and productive.
        </p>

        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">
              <FontAwesomeIcon icon={faSync} />
            </span>
            <span>Automatic Synchronization</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">
              <FontAwesomeIcon icon={faRobot} />
            </span>
            <span>AI-Powered Analysis</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <span>Secure & Encrypted Data</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">
              <FontAwesomeIcon icon={faChartBar} />
            </span>
            <span>Real-time Insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Integrations;
