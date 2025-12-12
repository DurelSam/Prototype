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
import EmailTypeModal from "../components/EmailTypeModal";
import ImapSmtpForm from "../components/ImapSmtpForm";
import "../styles/Integrations.css";

function Integrations() {
  const navigate = useNavigate();
  const location = useLocation(); // Nécessaire pour lire les paramètres d'URL (success/error)
  const [activeService, setActiveService] = useState(null);
  const { user } = useAuth();

  // API Configuration
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("authToken");

  // États pour les modals IMAP/SMTP
  const [showEmailTypeModal, setShowEmailTypeModal] = useState(false);
  const [showImapSmtpForm, setShowImapSmtpForm] = useState(false);

  // Données Mock avec statut et stats enrichies
  const initialIntegrations = {
    outlook: {
      id: 1,
      name: "Email", // Changé de "Microsoft Outlook Email" à "Email" (générique)
      icon: faEnvelope,
      connected: false,
      email: null,
      lastSync: null,
      messagesCount: 0,
      syncStatus: "Inactive",
      provider: null, // 'outlook' ou 'imap_smtp'
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
  // 1. FONCTION CENTRALE DE RÉCUPÉRATION (Pour Outlook + IMAP/SMTP)
  // ---------------------------------------------------------------------------
  const fetchEmailStatus = React.useCallback(async () => {
    try {
      // Récupérer le statut global email (Outlook + IMAP/SMTP)
      const response = await axios.get(`${API_URL}/email/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const { activeProvider, outlook, imapSmtp } = response.data.data;

        let emailConfig = {
          connected: false,
          email: null,
          lastSync: null,
          messagesCount: 0,
          syncStatus: "Inactive",
          provider: activeProvider,
        };

        if (activeProvider === "outlook" && outlook.isConnected) {
          emailConfig = {
            ...emailConfig,
            connected: true,
            email: outlook.email || user?.email,
            lastSync: outlook.lastSyncDate
              ? new Date(outlook.lastSyncDate)
              : null,
            messagesCount: 0, // TODO: récupérer le count des communications
            syncStatus: "Active",
          };
        } else if (activeProvider === "imap_smtp" && imapSmtp.isConnected) {
          emailConfig = {
            ...emailConfig,
            connected: true,
            email: imapSmtp.email,
            lastSync: imapSmtp.lastSyncDate
              ? new Date(imapSmtp.lastSyncDate)
              : null,
            messagesCount: 0, // TODO: récupérer le count des communications
            syncStatus: "Active",
          };
        }

        setIntegrations((prev) => ({
          ...prev,
          outlook: {
            ...prev.outlook,
            ...emailConfig,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching email status:", error);
      // Fallback: essayer l'ancien endpoint Outlook
      try {
        const outlookResponse = await axios.get(
          `${API_URL}/auth/outlook/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (outlookResponse.data.success && outlookResponse.data.isConnected) {
          setIntegrations((prev) => ({
            ...prev,
            outlook: {
              ...prev.outlook,
              connected: true,
              email: outlookResponse.data.email || user?.email,
              lastSync: outlookResponse.data.lastSync
                ? new Date(outlookResponse.data.lastSync)
                : null,
              messagesCount: outlookResponse.data.messagesCount || 0,
              syncStatus: "Active",
              provider: "outlook",
            },
          }));
        }
      } catch (fallbackError) {
        console.error("Error fetching Outlook stats fallback:", fallbackError);
      }
    }
  }, [API_URL, token, user?.email]);

  // ---------------------------------------------------------------------------
  // 2. EFFET : Chargement initial des données
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchEmailStatus();
      setLoading(false);
    };

    if (token) {
      init();
    }
  }, [token, fetchEmailStatus]);

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
        text: `Email account connected successfully! (${email || "Verified"})`,
      });

      // 2. Nettoyer l'URL (pour enlever ?success=true et faire propre)
      window.history.replaceState({}, document.title, window.location.pathname);

      // 3. FORCER LA MISE À JOUR DU BADGE IMMÉDIATEMENT
      fetchEmailStatus();
    } else if (error) {
      setMessage({
        type: "error",
        text: `Connection error: ${decodeURIComponent(error)}`,
      });
    }
  }, [location, fetchEmailStatus]);

  // ---------------------------------------------------------------------------
  // HANDLERS (Gestion des actions)
  // ---------------------------------------------------------------------------

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setWhatsappForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handler pour le choix du type d'email (Outlook vs IMAP/SMTP)
  const handleEmailTypeChoice = (type) => {
    setShowEmailTypeModal(false);

    if (type === "outlook") {
      // Lancer la connexion Outlook OAuth2
      handleConnectOutlook();
    } else if (type === "imap_smtp") {
      // Afficher le formulaire IMAP/SMTP
      setShowImapSmtpForm(true);
    }
  };

  // Handler pour la connexion Outlook OAuth2
  const handleConnectOutlook = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.get(`${API_URL}/auth/outlook/url`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.authUrl) {
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
  };

  // Handler pour le succès de la configuration IMAP/SMTP
  const handleImapSmtpSuccess = () => {
    fetchEmailStatus();
    setMessage({
      type: "success",
      text: "IMAP/SMTP configuration saved successfully!",
    });
  };

  const handleConnect = async (service, e) => {
    if (e) e.preventDefault();
    setMessage({ type: "", text: "" });

    if (service === "email") {
      // Afficher le modal de choix du type d'email
      setShowEmailTypeModal(true);
      setLoading(false);
    } else if (service === "whatsapp") {
      setLoading(true);
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
      // Utiliser le nouvel endpoint générique pour la synchronisation
      const response = await axios.post(
        `${API_URL}/email/sync`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Rafraîchir les stats après la synchronisation
        await fetchEmailStatus();

        setMessage({
          type: "success",
          text:
            response.data.message || "Synchronization completed successfully!",
        });
      }
    } catch (error) {
      console.error("Error syncing emails:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to sync emails",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (service) => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (service === "email") {
      try {
        // Récupérer le provider actif pour savoir quoi déconnecter
        const statusResponse = await axios.get(`${API_URL}/email/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const activeProvider = statusResponse.data.data?.activeProvider;

        let disconnectEndpoint;
        if (activeProvider === "outlook") {
          disconnectEndpoint = `${API_URL}/auth/outlook/disconnect`;
        } else if (activeProvider === "imap_smtp") {
          disconnectEndpoint = `${API_URL}/email/imap-smtp/disconnect`;
        } else {
          throw new Error("No active email provider to disconnect");
        }

        const response = await axios.delete(disconnectEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
              provider: null,
            },
          }));
          setMessage({
            type: "success",
            text: "Email integration disconnected successfully.",
          });
        }
      } catch (error) {
        console.error("Error disconnecting email:", error);
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to disconnect email",
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
            <span className="stat-label"> Messages Synced</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {integration.lastSync
                ? new Date(integration.lastSync).toLocaleTimeString()
                : "N/A"}
            </span>
            <span className="stat-label"> Last Sync Time</span>
          </div>
          <div className="stat-item">
            <span
              className="stat-value"
              style={{ color: isConnected ? "#10b981" : "#ef4444" }}
            >
              {integration.syncStatus}
            </span>
            <span className="stat-label"> Sync Status</span>
          </div>
        </div>

        <div className="card-actions">
          {isConnected ? (
            <>
              {integration.name.toLowerCase().includes("email") && (
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
                      : "email"
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
                  : "email";

                if (service === "email") {
                  handleConnect("email");
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

      {/* Modals pour Email (Outlook vs IMAP/SMTP) */}
      {showEmailTypeModal && (
        <EmailTypeModal
          onClose={() => setShowEmailTypeModal(false)}
          onChoose={handleEmailTypeChoice}
        />
      )}

      {showImapSmtpForm && (
        <ImapSmtpForm
          onClose={() => setShowImapSmtpForm(false)}
          onSuccess={handleImapSmtpSuccess}
        />
      )}
    </div>
  );
}

export default Integrations;
