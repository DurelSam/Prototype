/**
 * ImapSmtpForm Component
 *
 * Formulaire de configuration IMAP/SMTP avec presets et test de connexion
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCheckCircle,
  faSpinner,
  faInfoCircle,
  faInbox,
  faPaperPlane,
  faFileAlt,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/ImapSmtpForm.css";
// Import des animations du dashboard pour cohérence
import "../animations/dashboardAnimations.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Presets de configuration
const PROVIDER_PRESETS = {
  gmail: {
    name: "Gmail",
    imapHost: "imap.gmail.com",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: true,
    setupGuideUrl: "https://support.google.com/accounts/answer/185833",
  },
  yahoo: {
    name: "Yahoo Mail",
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: true,
    setupGuideUrl:
      "https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html",
  },
  outlook_imap: {
    name: "Outlook (IMAP)",
    imapHost: "outlook.office365.com",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: false,
  },
  protonmail: {
    name: "ProtonMail",
    imapHost: "127.0.0.1",
    imapPort: 1143,
    imapSecure: false,
    smtpHost: "127.0.0.1",
    smtpPort: 1025,
    smtpSecure: false,
    requiresAppPassword: false,
  },
  smartermail: {
    name: "SmarterMail",
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: false,
    setupGuideUrl: "https://www.smartertools.com/smartermail",
  },
  custom: {
    name: "Custom Configuration",
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: false,
  },
};

function ImapSmtpForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    providerName: "gmail",
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    foldersToSync: ["INBOX", "Sent"],
    enableAiAnalysis: true,
  });

  const [testStatus, setTestStatus] = useState(null); // null, 'testing', 'success', 'error'
  const [testMessage, setTestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFormat, setUsernameFormat] = useState(null); // Format qui a fonctionné au test

  // Mettre à jour les champs IMAP/SMTP quand le provider change
  useEffect(() => {
    const preset = PROVIDER_PRESETS[formData.providerName];
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        imapHost: preset.imapHost,
        imapPort: preset.imapPort,
        imapSecure: preset.imapSecure,
        smtpHost: preset.smtpHost,
        smtpPort: preset.smtpPort,
        smtpSecure: preset.smtpSecure,
      }));
    }
  }, [formData.providerName]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Nettoyer les hostnames (enlever http://, https://, etc.)
    let cleanedValue = value;
    if (name === 'imapHost' || name === 'smtpHost') {
      cleanedValue = value
        .replace(/^https?:\/\//, '') // Enlever http:// ou https://
        .replace(/^ftp:\/\//, '')     // Enlever ftp://
        .trim();
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : cleanedValue,
    });
  };

  const handleFolderChange = (folder) => {
    setFormData((prev) => ({
      ...prev,
      foldersToSync: prev.foldersToSync.includes(folder)
        ? prev.foldersToSync.filter((f) => f !== folder)
        : [...prev.foldersToSync, folder],
    }));
  };

  const handleTestConnection = async () => {
    // Validation
    if (!formData.email || !formData.password) {
      setTestStatus("error");
      setTestMessage("Email and password are required");
      return;
    }

    if (
      formData.providerName === "custom" &&
      (!formData.imapHost || !formData.smtpHost)
    ) {
      setTestStatus("error");
      setTestMessage(
        "IMAP and SMTP hosts are required for custom configuration"
      );
      return;
    }

    setTestStatus("testing");
    setTestMessage("Testing connection...");

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${API_URL}/email/imap-smtp/test`,
        {
          email: formData.email,
          password: formData.password,
          imapHost: formData.imapHost,
          imapPort: parseInt(formData.imapPort),
          imapSecure: formData.imapSecure,
          smtpHost: formData.smtpHost,
          smtpPort: parseInt(formData.smtpPort),
          smtpSecure: formData.smtpSecure,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTestStatus("success");
        setTestMessage(
          "Connection successful! You can now save the configuration."
        );
        // Sauvegarder le format de username qui a fonctionné
        if (response.data.usernameFormat) {
          setUsernameFormat(response.data.usernameFormat);
        }
      } else {
        setTestStatus("error");
        setTestMessage(response.data.message || "Connection failed");
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      setTestStatus("error");

      let errorMessage = "Connection test failed";
      if (error.response?.status === 401) {
        errorMessage = "Authentication required - Please log in again";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setTestMessage(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: test de connexion obligatoire
    if (testStatus !== "success") {
      alert("Please test the connection first before saving!");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${API_URL}/email/imap-smtp/configure`,
        {
          ...formData,
          imapPort: parseInt(formData.imapPort),
          smtpPort: parseInt(formData.smtpPort),
          usernameFormat: usernameFormat, // Passer le format qui a fonctionné au test
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert(
          "IMAP/SMTP configuration saved successfully! Synchronization started. Redirecting..."
        );

        // ✅ Attendre que onSuccess se termine AVANT de fermer le modal
        if (onSuccess) {
          await onSuccess();
        }

        onClose();
      } else {
        alert(response.data.message || "Configuration failed");
      }
    } catch (error) {
      console.error("Error configuring IMAP/SMTP:", error);
      alert(error.response?.data?.message || "Failed to save configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPreset = PROVIDER_PRESETS[formData.providerName];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="imap-smtp-form-modal animate-entry delay-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h2>Configure IMAP/SMTP Email</h2>
        <p className="modal-subtitle">
          Connect your email account using IMAP/SMTP
        </p>

        <form onSubmit={handleSubmit}>
          {/* Provider Selection */}
          <div className="form-group animate-entry delay-2">
            <label htmlFor="providerName">Email Provider</label>
            <select
              name="providerName"
              id="providerName"
              value={formData.providerName}
              onChange={handleChange}
              required
            >
              <option value="gmail">Gmail</option>
              <option value="yahoo">Yahoo Mail</option>
              <option value="outlook_imap">Outlook (IMAP)</option>
              <option value="protonmail">ProtonMail</option>
              <option value="smartermail">SmarterMail</option>
              <option value="custom">Custom Configuration</option>
            </select>
          </div>

          {/* App Password Info */}
          {selectedPreset.requiresAppPassword && (
            <div className="info-banner animate-entry delay-3">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>
                {selectedPreset.name} requires an App Password.{" "}
                <a
                  href={selectedPreset.setupGuideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn how to create one
                </a>
              </span>
            </div>
          )}

          {/* Email */}
          <div className="form-group animate-entry delay-4">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password */}
          <div className="form-group animate-entry delay-5">
            <label htmlFor="password">
              {selectedPreset.requiresAppPassword ? "App Password" : "Password"}{" "}
              *
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            className="toggle-advanced animate-entry delay-6"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "▼" : "▶"} Advanced Settings
          </button>

          {showAdvanced && (
            <div className="advanced-settings animate-entry delay-7">
              {/* IMAP Settings */}
              <h4>IMAP (Incoming Mail)</h4>
              <div className="settings-row">
                <div className="form-group">
                  <label htmlFor="imapHost">IMAP Host</label>
                  <input
                    type="text"
                    name="imapHost"
                    id="imapHost"
                    value={formData.imapHost}
                    onChange={handleChange}
                    placeholder="mail.example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="imapPort">IMAP Port</label>
                  <input
                    type="number"
                    name="imapPort"
                    id="imapPort"
                    value={formData.imapPort}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* SMTP Settings */}
              <h4>SMTP (Outgoing Mail)</h4>
              <div className="settings-row">
                <div className="form-group">
                  <label htmlFor="smtpHost">SMTP Host</label>
                  <input
                    type="text"
                    name="smtpHost"
                    id="smtpHost"
                    value={formData.smtpHost}
                    onChange={handleChange}
                    placeholder="mail.example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="smtpPort">SMTP Port</label>
                  <input
                    type="number"
                    name="smtpPort"
                    id="smtpPort"
                    value={formData.smtpPort}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Folders to Sync */}
              <h4>Folders to Sync</h4>
              <div className="folders-horizontal-group">
                {[
                  { name: "INBOX", icon: faInbox },
                  { name: "Sent", icon: faPaperPlane },
                  { name: "Drafts", icon: faFileAlt },
                  { name: "Spam", icon: faExclamationTriangle },
                ].map((folder) => (
                  <label key={folder.name} className="folder-checkbox-card">
                    <FontAwesomeIcon
                      icon={folder.icon}
                      className="folder-icon"
                    />
                    <span className="folder-name">{folder.name}</span>
                    <input
                      type="checkbox"
                      checked={formData.foldersToSync.includes(folder.name)}
                      onChange={() => handleFolderChange(folder.name)}
                    />
                  </label>
                ))}
              </div>

              {/* AI Analysis */}
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="enableAiAnalysis"
                    checked={formData.enableAiAnalysis}
                    onChange={handleChange}
                  />
                  Enable AI analysis (Grok) for emails
                </label>
              </div>
            </div>
          )}

          {/* Test Connection Button */}
          <button
            type="button"
            className={`btn-test ${testStatus} animate-entry delay-8`}
            onClick={handleTestConnection}
            disabled={testStatus === "testing"}
          >
            {testStatus === "testing" && (
              <FontAwesomeIcon icon={faSpinner} spin />
            )}
            {testStatus === "success" && (
              <FontAwesomeIcon icon={faCheckCircle} />
            )}
            {testStatus === "testing"
              ? " Testing..."
              : testStatus === "success"
              ? " Connection Successful!"
              : "Test Connection"}
          </button>

          {testMessage && (
            <div className={`test-message ${testStatus} animate-entry delay-9`}>
              {testMessage}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions animate-entry delay-10">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={testStatus !== "success" || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save & Sync"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ImapSmtpForm;
