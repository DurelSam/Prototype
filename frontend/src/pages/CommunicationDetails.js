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

        const response = await axios.get(
          `${API_URL}/auth/communications/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

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
            read: data.isRead,
            attachments:
              data.attachments?.map((att) => ({
                name: att.filename,
                size: formatFileSize(att.size),
                url: att.url,
              })) || [],
            aiAnalysis: {
              // Assurer que les valeurs sont en minuscule pour les data-attributes CSS
              sentiment: (
                data.ai_analysis?.sentiment || "Pending"
              ).toLowerCase(),
              priority: (data.ai_analysis?.urgency || "Medium").toLowerCase(),
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
        <div className="error-container">
          <h2>{error || "Communication not found"}</h2>
          <button
            className="back-button"
            onClick={() => navigate("/communications")}
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

      <div
        className={`details-container ${
          communication.aiAnalysis.summary === "Analysis pending..."
            ? "analysis-pending"
            : ""
        }`}
      >
        {/* Main Content: Email Body */}
        <div className="main-content">
          {/* NOUVELLE STRUCTURE : HEADER (ICÔNE SEULE EN HAUT À DROITE) */}
          <div className="comm-header">
            <div
              className="comm-type-indicator"
              data-type={communication.type.toLowerCase()}
            >
              <FontAwesomeIcon
                icon={
                  communication.type === "Outlook" ||
                  communication.type === "Email"
                    ? faEnvelope
                    : faCommentDots
                }
              />{" "}
              {communication.type}
            </div>
          </div>

          {/* NOUVELLE STRUCTURE : WRAPPER METADATA & CORPS DU MAIL */}
          <div className="comm-metadata-wrapper">
            <div className="comm-metadata">
              {/* SUJET (Maintenant dans la grille) */}
              <div className="metadata-row subject-row">
                <span className="label">Subject</span>
                <span className="value">{communication.subject}</span>
              </div>

              {/* FROM */}
              <div className="metadata-row">
                <span className="label">From</span>
                <span className="value">
                  {communication.fromName} &lt;{communication.from}&gt;
                </span>
              </div>

              {/* TO */}
              <div className="metadata-row">
                <span className="label">To</span>
                <span className="value">
                  {communication.toName} &lt;{communication.to}&gt;
                </span>
              </div>

              {/* DATE/TIME */}
              <div className="metadata-row">
                <span className="label">Date/Time</span>
                <span className="value">{formatDate(communication.date)}</span>
              </div>
            </div>

            {/* CORPS DU MAIL */}
            <div className="comm-body">
              {cleanHtmlContent(communication.body)
                .split("\n")
                .filter((line) => line.trim().length > 0)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>

            {/* ATTACHMENTS SECTION */}
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
                        <button className="download-button">Download</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* AI Analysis Sidebar: HUD Style */}
        <div className="ai-analysis-sidebar">
          <h2 className="sidebar-title">
            <FontAwesomeIcon icon={faRobot} /> AI Insight
          </h2>

          <div className="analysis-section">
            <h3>Sentiment Analysis</h3>
            <div
              className="sentiment-badge"
              data-sentiment={communication.aiAnalysis.sentiment}
            >
              {communication.aiAnalysis.sentiment}
            </div>
          </div>

          <div className="analysis-section">
            <h3>Urgency Level</h3>
            <div
              className="priority-badge"
              data-priority={communication.aiAnalysis.priority}
            >
              {communication.aiAnalysis.priority} Priority
            </div>
          </div>

          <div className="analysis-section">
            <h3>Executive Summary</h3>
            <p className="summary-text">{communication.aiAnalysis.summary}</p>
          </div>

          {communication.aiAnalysis.keyPoints &&
            communication.aiAnalysis.keyPoints.length > 0 && (
              <div className="analysis-section">
                <h3>Key Data Points</h3>
                <ul className="key-points-list">
                  {communication.aiAnalysis.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

          {communication.aiAnalysis.actionItems &&
            communication.aiAnalysis.actionItems.length > 0 && (
              <div className="analysis-section">
                <h3>Action Items</h3>
                <ul className="action-items-list">
                  {communication.aiAnalysis.actionItems.map((item, index) => (
                    <li key={index}>
                      <input
                        type="checkbox"
                        id={`action-${index}`}
                        // Garde le style accent-color car c'est spécifique aux contrôles de formulaire
                        style={{ accentColor: "#3b82f6" }}
                      />
                      <label htmlFor={`action-${index}`}>{item}</label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {communication.aiAnalysis.entities &&
            communication.aiAnalysis.entities.length > 0 && (
              <div className="analysis-section">
                <h3>Detected Entities</h3>
                <div className="entities-tags">
                  {communication.aiAnalysis.entities.map((entity, index) => (
                    <span key={index} className="entity-tag">
                      #{entity}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default CommunicationDetails;
