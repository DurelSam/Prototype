/* src/pages/CommunicationDetails.js */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faCommentDots,
  faPaperclip,
  faRobot,
  faArrowLeft,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "../styles/CommunicationDetails.css";

function CommunicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [communication, setCommunication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Configuration
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchCommunication = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_URL}/auth/communications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const data = response.data.data;

          // Mapper les données de la DB vers le format attendu par le UI
          const mappedCommunication = {
            id: data._id,
            type: data.source, // "Outlook" ou "WhatsApp"
            from: data.sender?.email || data.sender?.phone || "Unknown",
            fromName: data.sender?.name || "",
            to: data.recipient?.email || data.recipient?.phone || "You",
            toName: data.recipient?.name || "",
            subject: data.subject || "(No subject)",
            body: data.content,
            date: new Date(data.receivedAt),
            read: data.isRead, // CORRECTION: utiliser le champ isRead du modèle
            attachments: data.attachments?.map((att) => ({
              name: att.filename,
              size: formatFileSize(att.size),
              url: att.url,
            })) || [],
            aiAnalysis: {
              sentiment: data.ai_analysis?.sentiment || "Pending",
              priority: data.ai_analysis?.urgency || "Medium",
              summary: data.ai_analysis?.summary || "Analysis pending...",
              keyPoints: extractKeyPoints(data.ai_analysis?.summary),
              actionItems: data.ai_analysis?.suggestedAction
                ? [data.ai_analysis.suggestedAction]
                : [],
              entities: data.ai_analysis?.category
                ? [data.ai_analysis.category]
                : [],
            },
            status: data.status,
          };

          setCommunication(mappedCommunication);
        }
      } catch (err) {
        console.error("Error fetching communication:", err);
        setError(err.response?.data?.message || "Failed to load communication");
        setCommunication(null);
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchCommunication();
    }
  }, [id, API_URL, token]);

  // Helper: Extraire des points clés du summary (simple split par phrases)
  const extractKeyPoints = (summary) => {
    if (!summary) return [];
    return summary
      .split(".")
      .filter((s) => s.trim().length > 10)
      .slice(0, 3)
      .map((s) => s.trim());
  };

  // Helper: Formater la taille des fichiers
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Helper: Nettoyer le HTML pour l'affichage (convertir les balises basiques)
  const cleanHtmlContent = (htmlContent) => {
    if (!htmlContent) return "";

    // Si le contenu ne contient pas de balises HTML, retourner tel quel
    if (!htmlContent.includes("<")) {
      return htmlContent;
    }

    // Créer un élément temporaire pour parser le HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Extraire le texte et conserver les sauts de ligne
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  if (loading) {
    return (
      <div className="communication-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing content...</p>
        </div>
      </div>
    );
  }

  if (error || !communication) {
    return (
      <div className="communication-details-page">
        <div
          className="error-container"
          style={{ textAlign: "center", marginTop: "4rem", color: "#9ca3af" }}
        >
          <h2>{error || "Communication not found"}</h2>
          <button
            className="back-button"
            onClick={() => navigate("/communications")}
            style={{ marginTop: "1rem" }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Hub
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="communication-details-page">
      <div className="details-header">
        <button
          className="back-button"
          onClick={() => navigate("/communications")}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Communications Hub
        </button>
      </div>

      <div className="details-container">
        {/* Main Content: Email Body */}
        <div className="main-content">
          <div
            className="comm-type-indicator"
            data-type={communication.type.toLowerCase()}
          >
            <FontAwesomeIcon
              icon={communication.type === "Outlook" || communication.type === "Email" ? faEnvelope : faCommentDots}
            />{" "}
            {communication.type}
          </div>

          <h1 className="comm-subject">{communication.subject}</h1>

          <div className="comm-metadata">
            <div className="metadata-row">
              <span className="label">From</span>
              <span className="value">{communication.from}</span>
            </div>
            <div className="metadata-row">
              <span className="label">To</span>
              <span className="value">{communication.to}</span>
            </div>
            {communication.cc && communication.cc.length > 0 && (
              <div className="metadata-row">
                <span className="label">CC</span>
                <span className="value">{communication.cc.join(", ")}</span>
              </div>
            )}
            <div className="metadata-row">
              <span className="label">Date/Time</span>
              <span className="value">{formatDate(communication.date)}</span>
            </div>
          </div>

          <div className="comm-body">
            {cleanHtmlContent(communication.body)
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>

          {communication.attachments &&
            communication.attachments.length > 0 && (
              <div className="attachments-section">
                <h3>
                  <FontAwesomeIcon icon={faPaperclip} /> Attachments (
                  {communication.attachments.length})
                </h3>
                <div className="attachments-list">
                  {communication.attachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <span className="attachment-icon">
                        <FontAwesomeIcon icon={faDownload} />
                      </span>
                      <div className="attachment-info">
                        <span className="attachment-name">
                          {attachment.name}
                        </span>
                        <span className="attachment-size">
                          {attachment.size}
                        </span>
                      </div>
                      <button
                        className="download-button"
                        style={{
                          color: "#3b82f6",
                          fontWeight: 600,
                          border: "none",
                          background: "transparent",
                        }}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* AI Analysis Sidebar: HUD Style */}
        <div className="ai-analysis-sidebar">
          <h2 className="sidebar-title">
            <FontAwesomeIcon icon={faRobot} style={{ color: "#3b82f6" }} /> AI
            Insight
          </h2>

          <div className="analysis-section">
            <h3>Sentiment Analysis</h3>
            <div
              className="sentiment-badge"
              data-sentiment={communication.aiAnalysis.sentiment.toLowerCase()}
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              {communication.aiAnalysis.sentiment}
            </div>
          </div>

          <div className="analysis-section">
            <h3>Urgency Level</h3>
            <div
              className="priority-badge"
              data-priority={communication.aiAnalysis.priority.toLowerCase()}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              {communication.aiAnalysis.priority} Priority
            </div>
          </div>

          <div className="analysis-section">
            <h3>Executive Summary</h3>
            <p
              className="summary-text"
              style={{
                background: "rgba(30, 41, 59, 0.5)",
                padding: "1rem",
                borderLeft: "3px solid #3b82f6",
                borderRadius: "8px",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              {communication.aiAnalysis.summary}
            </p>
          </div>

          <div className="analysis-section">
            <h3>Key Data Points</h3>
            <ul
              className="key-points-list"
              style={{ paddingLeft: "1.2rem", margin: 0 }}
            >
              {communication.aiAnalysis.keyPoints.map((point, index) => (
                <li
                  key={index}
                  style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}
                >
                  • {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="analysis-section">
            <h3>Action Items</h3>
            <ul
              className="action-items-list"
              style={{ listStyle: "none", padding: 0 }}
            >
              {communication.aiAnalysis.actionItems.map((item, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    marginBottom: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="checkbox"
                    id={`action-${index}`}
                    style={{ accentColor: "#3b82f6" }}
                  />
                  <label htmlFor={`action-${index}`}>{item}</label>
                </li>
              ))}
            </ul>
          </div>

          <div className="analysis-section">
            <h3>Detected Entities</h3>
            <div
              className="entities-tags"
              style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
            >
              {communication.aiAnalysis.entities.map((entity, index) => (
                <span
                  key={index}
                  className="entity-tag"
                  style={{
                    background: "#1e293b",
                    color: "#94a3b8",
                    padding: "0.3rem 0.8rem",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    border: "1px solid #334155",
                  }}
                >
                  #{entity}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunicationDetails;
