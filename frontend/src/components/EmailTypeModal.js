/**
 * EmailTypeModal Component
 *
 * Modal pour choisir le type d'email à configurer (Outlook OAuth2 vs IMAP/SMTP)
 */

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faTimes } from "@fortawesome/free-solid-svg-icons";
import "../styles/EmailTypeModal.css";
// Import des animations du dashboard pour cohérence
import "../animations/dashboardAnimations.css";

function EmailTypeModal({ onClose, onChoose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="email-type-modal animate-entry delay-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h2>Choose Your Email Provider</h2>
        <p className="modal-subtitle">
          Select how you want to connect your email account
        </p>

        <div className="provider-options">
          {/* Option Outlook OAuth2 */}
          <div
            className="provider-card outlook-card animate-entry delay-2"
            onClick={() => onChoose("outlook")}
          >
            <div className="provider-icon outlook">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <h3>Microsoft Outlook</h3>
            <p className="provider-description">Office 365, Outlook.com</p>
            <span className="auth-type">OAuth2 (Recommended)</span>
            <button className="action-button">Connect with Outlook</button>
          </div>

          {/* Option IMAP/SMTP */}
          <div
            className="provider-card imap-card animate-entry delay-3"
            onClick={() => onChoose("imap_smtp")}
          >
            <div className="provider-icon generic">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <h3>Other Email</h3>
            <p className="provider-description">
              Gmail, Yahoo, ProtonMail, Custom...
            </p>
            <span className="auth-type">IMAP/SMTP</span>
            <button className="action-button">Configure Email</button>
          </div>
        </div>

        <div className="modal-footer">
          <p className="info-text">
            Both options allow you to receive and send emails from the
            application.
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailTypeModal;
