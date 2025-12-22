/* src/pages/Communications.js */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faInbox,
  faEnvelope,
  faCommentDots,
  faSmile,
  faMeh,
  faFrown,
  faQuestionCircle,
  faExclamationTriangle,
  faClock,
  faChartLine,
  faArrowUp,
  faReply,
  faPaperPlane,
  faTimes,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../components/Pagination";
import "../styles/Communications.css";

// --- SUB-COMPONENT: Escalation Dashboard (CEO View) ---
const EscalationDashboardTab = () => {
  // Mock Data pour le tableau de bord (À connecter au backend plus tard via /stats)
  const escalationStats = {
    level1: 12,
    level2: 3,
    overdue: 5,
  };

  const escalationHistory = [
    {
      id: 101,
      subject: "Critical system outage reported by VIP client.",
      level: 2,
      escalatedBy: "Jane Doe",
      date: new Date("2025-12-06T14:30:00"),
      status: "Escalated-2",
    },
    {
      id: 102,
      subject: "Payment delay impacting Q1 forecast.",
      level: 1,
      escalatedBy: "John Smith",
      date: new Date("2025-12-05T10:00:00"),
      status: "Escalated-1",
    },
    {
      id: 103,
      subject: "Unresolved bug in production environment.",
      level: 2,
      escalatedBy: "Alice Johnson",
      date: new Date("2025-12-04T16:45:00"),
      status: "Escalated-2",
    },
    {
      id: 104,
      subject: "Follow-up needed on sales agreement.",
      level: 1,
      escalatedBy: "Bob Brown",
      date: new Date("2025-12-03T11:20:00"),
      status: "Closed",
    },
  ];

  const formatTime = (date) =>
    date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="tab-content">
      <div className="escalation-dashboard">
        {/* KPI Card 1: Level 1 Escalations */}
        <div className="escalation-card level1-card">
          <div className="card-header">
            <h4 className="card-title">Level 1 Escalations</h4>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="card-icon"
            />
          </div>
          <p className="card-value">{escalationStats.level1}</p>
        </div>

        {/* KPI Card 2: Level 2 Escalations */}
        <div className="escalation-card level2-card">
          <div className="card-header">
            <h4 className="card-title">Level 2 (Critical)</h4>
            <FontAwesomeIcon icon={faArrowUp} className="card-icon" />
          </div>
          <p className="card-value">{escalationStats.level2}</p>
        </div>

        {/* KPI Card 3: Overdue Follow-ups */}
        <div className="escalation-card overdue-card">
          <div className="card-header">
            <h4 className="card-title">Overdue Follow-ups</h4>
            <FontAwesomeIcon icon={faClock} className="card-icon" />
          </div>
          <p className="card-value">{escalationStats.overdue}</p>
        </div>

        {/* Escalation History Table */}
        <div className="escalation-table-section">
          <h3>Escalation History & Tracking</h3>
          <table className="escalation-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Level</th>
                <th>Escalated By</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {escalationHistory.map((item) => (
                <tr key={item.id}>
                  <td>{item.subject}</td>
                  <td>{item.level}</td>
                  <td>{item.escalatedBy}</td>
                  <td>{formatTime(item.date)}</td>
                  <td>
                    <span
                      className={`status-badge ${item.status
                        .toLowerCase()
                        .replace("-", "")}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Urgent Emails Tab (High/Critical) ---
const UrgentEmailsTab = () => {
  const [urgentEmails, setUrgentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('High,Critical');
  const [filterDateRange, setFilterDateRange] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchUrgentEmails();
  }, [currentPage, itemsPerPage, searchTerm, filterPriority, filterDateRange]);

  const fetchUrgentEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/communications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: 'To Validate',
          priority: filterPriority,
          search: searchTerm,
          dateRange: filterDateRange,
          needsReply: true,
          excludeReplied: true,
          page: currentPage,
          limit: itemsPerPage,
        },
      });

      if (response.data.success) {
        const communications = response.data.data || [];
        setUrgentEmails(communications);

        // Mettre à jour la pagination
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Erreur chargement emails urgents:', error);
      setUrgentEmails([]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers pour la pagination (comme dans CommunicationListTab)
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPriority, filterDateRange]);
  const handleReply = async () => {
    if (!replyContent.trim()) {
      alert('Veuillez saisir un message de réponse');
      return;
    }

    try {
      setSending(true);
      const response = await axios.post(
        `${API_URL}/communications/${selectedEmail._id}/reply`,
        { replyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✅ Réponse envoyée avec succès !');
        setSelectedEmail(null);
        setReplyContent('');
        fetchUrgentEmails(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Effet pour pré-remplir le contenu de la réponse avec le brouillon
  useEffect(() => {
    if (selectedEmail && selectedEmail.ai_analysis?.suggestedResponse) {
      setReplyContent(selectedEmail.ai_analysis.suggestedResponse);
    } else {
      setReplyContent('');
    }
  }, [selectedEmail]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des emails urgents...</p>
      </div>
    );
  }

  return (
    <div className="urgent-emails-tab">
      <div className="urgent-header">
        <h2>
          <FontAwesomeIcon icon={faExclamationTriangle} /> Emails Urgents à Répondre
        </h2>
        <p className="urgent-subtitle">
          Emails High/Critical nécessitant une réponse manuelle ({urgentEmails.length})
        </p>
      </div>

      <div className="controls-section">
        <div className="filter-controls">
          <div className="filter-group search-group">
            <label>Recherche</label>
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Sujet, Expéditeur, ou Contenu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="filter-group">
            <label>Priorité</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="High,Critical">High + Critical</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Période</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="All">Tout temps</option>
              <option value="Today">Aujourd'hui</option>
              <option value="Yesterday">Hier</option>
              <option value="Last7Days">7 derniers jours</option>
              <option value="Last30Days">30 derniers jours</option>
              <option value="ThisMonth">Ce mois</option>
              <option value="LastMonth">Mois dernier</option>
            </select>
          </div>
        </div>
      </div>
      {urgentEmails.length === 0 ? (
        <div className="no-urgent-emails">
          <p>Aucun email urgent en attente. Tous les emails High/Critical ont été traités.</p>
        </div>
      ) : (
        <>
          <div className="urgent-emails-grid">
            {urgentEmails.map((email) => (
              <div key={email._id} className="urgent-email-card">
                <div className="urgent-email-header">
                  <span
                    className={`urgent-email-priority ${email.ai_analysis?.urgency?.toLowerCase()}`}
                  >
                    <FontAwesomeIcon icon={faExclamationTriangle} /> {email.ai_analysis?.urgency}
                  </span>
                  <span className="urgent-email-date">
                    {new Date(email.receivedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <h4 className="urgent-email-subject">{email.subject}</h4>
                <p className="urgent-email-from">
                  <FontAwesomeIcon icon={faEnvelope} /> {email.sender.email}
                </p>
                <div className="urgent-email-summary">
                  {email.ai_analysis?.summary?.substring(0, 200) || email.content?.substring(0, 200)}
                  {(email.ai_analysis?.summary?.length > 200 || email.content?.length > 200) && '...'}
                </div>
                <div className="urgent-email-footer">
                  <button className="btn-reply" onClick={() => setSelectedEmail(email)}>
                    <FontAwesomeIcon icon={faReply} /> Répondre
                  </button>
                </div>
              </div>
            ))}
          </div>

        </>
      )}

      {/* Pagination Component - Identique à Summary & Search */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />

      {/* Modal de réponse */}
      {selectedEmail && (
        <div className="reply-modal" onClick={() => setSelectedEmail(null)}>
          <div className="reply-modal-content" onClick={(e) => e.stopPropagation()}>
            {console.log('📧 Email sélectionné:', selectedEmail)}
            {console.log('🤖 AI Analysis:', selectedEmail.ai_analysis)}
            <div className="reply-modal-header">
              <h3>
                <FontAwesomeIcon icon={faReply} /> Répondre à l'email
              </h3>
              <button className="close-modal-btn" onClick={() => setSelectedEmail(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="reply-email-info">
              <p>
                <strong>À:</strong> <span>{selectedEmail.sender.email}</span>
              </p>
              <p>
                <strong>Sujet:</strong> <span>Re: {selectedEmail.subject}</span>
              </p>
              <p>
                <strong>Priorité:</strong>{' '}
                <span className={`urgent-email-priority ${selectedEmail.ai_analysis?.urgency?.toLowerCase()}`}>
                  <FontAwesomeIcon icon={faExclamationTriangle} /> {selectedEmail.ai_analysis?.urgency}
                </span>
              </p>
            </div>

            <div className="reply-original-email">
              <h4>Message original</h4>
              <div className="original-content">
                {selectedEmail.content?.substring(0, 500) || 'Contenu non disponible'}
              </div>
            </div>

            <div className="reply-ai-summary">
              <h4>
                <FontAwesomeIcon icon={faRobot} /> Résumé AI
              </h4>
              <div className="ai-summary-content">
                {selectedEmail.ai_analysis?.summary || 'Résumé AI non disponible pour cet email.'}
              </div>
            </div>

            <div className="reply-compose">
              <h4>Votre réponse</h4>
              <textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Composez votre réponse ici..."
              />
            </div>

            <div className="reply-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setSelectedEmail(null)}
                disabled={sending}
              >
                Annuler
              </button>
              <button
                className="btn-send"
                onClick={handleReply}
                disabled={sending || !replyContent.trim()}
              >
                {sending ? (
                  <>
                    <span className="spinner-small"></span> Envoi...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} /> Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: Communications Search & Filters Page ---
const CommunicationListTab = ({ navigate }) => {
  const [allCommunications, setAllCommunications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterSentiment, setFilterSentiment] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterState, setFilterState] = useState("All");
  const [filterDateRange, setFilterDateRange] = useState("All");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // API Configuration
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("authToken");

  // Fetch communications from API avec pagination
  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        setLoading(true);

        // Construire les paramètres de requête
        const params = new URLSearchParams();
        if (filterType !== "All") params.append("source", filterType);
        if (filterPriority !== "All") params.append("priority", filterPriority);
        if (filterSentiment !== "All") params.append("sentiment", filterSentiment);
        if (filterStatus !== "All") params.append("status", filterStatus);
        if (filterState !== "All") params.append("state", filterState);
        if (filterDateRange !== "All") params.append("dateRange", filterDateRange);
        if (searchTerm) params.append("search", searchTerm);

        // Paramètres de pagination
        params.append("page", currentPage.toString());
        params.append("limit", itemsPerPage.toString());

        // Communications API avec filtrage RBAC côté backend
        const response = await fetch(
          `${API_URL}/communications?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch communications");
        }

        const result = await response.json();

        if (result.success) {
          // Mapper les données de la DB vers le format UI
          const mappedData = result.data.map((comm) => ({
            id: comm._id,
            type: comm.source, // "Outlook" ou "WhatsApp"
            from: comm.sender?.email || comm.sender?.phone || "Unknown",
            subject: comm.subject || "(No subject)",
            // CORRECTION: Utiliser snippet s'il existe, sinon content
            body: comm.snippet || comm.content || "",
            date: new Date(comm.receivedAt),
            // CORRECTION: Utiliser isRead du modèle
            read: comm.isRead,
            status: comm.status, // To Validate, Validated, Escalated, Closed, Archived
            hasAutoResponse: comm.hasAutoResponse || false,
            hasBeenReplied: comm.hasBeenReplied || false,
            aiAnalysis: {
              sentiment: comm.ai_analysis?.sentiment || "Pending",
              priority: comm.ai_analysis?.urgency || "Medium",
              requiresResponse: comm.ai_analysis?.requiresResponse !== undefined ? comm.ai_analysis.requiresResponse : null,
            },
          }));

          setAllCommunications(mappedData);

          // Mettre à jour les données de pagination
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages);
            setTotalItems(result.pagination.total);
          }
        }
      } catch (error) {
        console.error("Error fetching communications:", error);
        setAllCommunications([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCommunications();
    }
  }, [
    API_URL,
    token,
    filterType,
    filterPriority,
    filterSentiment,
    filterStatus,
    filterState,
    filterDateRange,
    searchTerm,
    currentPage,
    itemsPerPage,
  ]);

  // Reset à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterPriority, filterSentiment, filterStatus, filterState, searchTerm, filterDateRange]);

  // Handlers pour la pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top pour meilleure UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset à la première page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCommunicationClick = (id) => navigate(`/communications/${id}`);

  // ✅ FIX: Utiliser directement les données du backend (déjà paginées)
  // Pas de double pagination côté client
  const paginatedCommunications = allCommunications;

  const formatDate = (date) => {
    const diff = new Date() - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0)
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#ef4444";
      case "Medium":
        return "#f59e0b";
      case "Low":
        return "#10b981";
      case "Critical": // Ajout cas Critical
        return "#7f1d1d";
      default:
        return "#6b7280";
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case "Positive":
        return faSmile;
      case "Neutral":
        return faMeh;
      case "Negative":
        return faFrown;
      default:
        return faQuestionCircle;
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: "300px" }}>
        <div className="loading-spinner"></div>
        <p>Fetching summaries...</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="controls-section">
        <div className="filter-controls">
          <div className="filter-group search-group">
            <label>Search</label>
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Subject, Sender, or Content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Priority Level</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="All">Any Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="To Validate">To Validate</option>
              <option value="Validated">Validated</option>
              <option value="Escalated">Escalated</option>
              <option value="Closed">Closed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="filter-group">
            <label>State / Reply</label>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="filter-select"
            >
              <option value="All">All States</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
              <option value="Replied">Replied / Auto-Response</option>
              <option value="NotReplied">Not Replied</option>
              <option value="AwaitingInput">Awaiting Input</option>
              <option value="NoResponseNeeded">No Response Needed</option>
            </select>
          </div>

          <button
            className="btn-cancel"
            onClick={() => setShowAdvancedFilters((v) => !v)}
            style={{ alignSelf: "flex-end" }}
          >
            {showAdvancedFilters ? "Moins de filtres" : "Plus de filtres"}
          </button>
        </div>
        {showAdvancedFilters && (
          <div className="filter-controls" style={{ marginTop: "8px" }}>
            <div className="filter-group">
              <label>Source Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Sources</option>
                <option value="Outlook">Outlook</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="imap_smtp">IMAP/SMTP</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sentiment</label>
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                className="filter-select"
              >
                <option value="All">Any Sentiment</option>
                <option value="Positive">Positive</option>
                <option value="Neutral">Neutral</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Date Range</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last7Days">Last 7 Days</option>
                <option value="Last30Days">Last 30 Days</option>
                <option value="ThisMonth">This Month</option>
                <option value="LastMonth">Last Month</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="communications-list">
        {paginatedCommunications.length === 0 ? (
          <div className="empty-state">No signals detected.</div>
        ) : (
          paginatedCommunications.map((comm, index) => (
            <div
              key={comm.id}
              className={`communication-card ${!comm.read ? "unread" : ""}`}
              onClick={() => handleCommunicationClick(comm.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="comm-type-badge"
                data-type={comm.type.toLowerCase()}
              >
                <FontAwesomeIcon
                  icon={comm.type === "Outlook" ? faEnvelope : faCommentDots}
                />
              </div>

              <div className="comm-content">
                <div className="comm-header-row">
                  <h3 className="comm-subject">{comm.subject}</h3>
                </div>

                <div className="comm-meta">
                  <span className="comm-from">{comm.from}</span>
                  <span>•</span>
                  <span className="comm-date">{formatDate(comm.date)}</span>
                </div>

                <p className="comm-preview">
                  {comm.body.length > 120
                    ? `${comm.body.substring(0, 120)}...`
                    : comm.body}
                </p>

                <div className="comm-footer">
                  <div className="ai-tags">
                    <span
                      className="ai-tag sentiment"
                      data-sentiment={comm.aiAnalysis.sentiment}
                    >
                      <FontAwesomeIcon
                        icon={getSentimentIcon(comm.aiAnalysis.sentiment)}
                      />{" "}
                      {comm.aiAnalysis.sentiment}
                    </span>
                    <span
                      className="ai-tag priority"
                      data-priority={comm.aiAnalysis.priority}
                    >
                      {comm.aiAnalysis.priority}
                    </span>
                    {comm.status === "Escalated" && (
                      <span
                        className="ai-tag escalated"
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                          borderColor: "rgba(239, 68, 68, 0.3)",
                          fontWeight: "700",
                        }}
                        title="Email escaladé (SLA dépassé)"
                      >
                        <FontAwesomeIcon icon={faArrowUp} /> ESCALATED
                      </span>
                    )}
                    {comm.hasAutoResponse && (
                      <span
                        className="ai-tag auto-response"
                        title="Réponse automatique envoyée"
                      >
                        ✓ Auto-Response
                      </span>
                    )}
                    {comm.hasBeenReplied && !comm.hasAutoResponse && (
                      <span
                        className="ai-tag replied"
                        style={{
                          background: "rgba(59, 130, 246, 0.15)",
                          color: "#60a5fa",
                          borderColor: "rgba(59, 130, 246, 0.3)",
                          fontWeight: "600",
                        }}
                        title="Email répondu manuellement"
                      >
                        <FontAwesomeIcon icon={faReply} /> Répondu
                      </span>
                    )}
                    {comm.awaitingUserInput && (
                      <span
                        className="ai-tag awaiting-input"
                        style={{
                          background: "rgba(245, 158, 11, 0.15)",
                          color: "#f59e0b",
                          borderColor: "rgba(245, 158, 11, 0.3)",
                          fontWeight: "600",
                          animation: "pulse 2s infinite",
                        }}
                        title="En attente de vos réponses pour générer une réponse IA"
                      >
                        <FontAwesomeIcon icon={faRobot} /> En attente
                      </span>
                    )}
                    {comm.aiAnalysis.requiresResponse === false && (
                      <span
                        className="ai-tag no-response-needed"
                        style={{
                          background: "rgba(107, 114, 128, 0.15)",
                          color: "#9ca3af",
                          borderColor: "rgba(107, 114, 128, 0.3)",
                          fontWeight: "600",
                        }}
                        title="L'IA a déterminé qu'aucune réponse n'est nécessaire"
                      >
                        <FontAwesomeIcon icon={faQuestionCircle} /> Aucune réponse nécessaire
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />
    </div>
  );
};

// Sous-composant résumé avec expansion
const AwaitingSummary = ({ summary }) => {
  const [expanded, setExpanded] = useState(false);
  const text = summary || '';
  const previewLength = 200;
  const isLong = text.length > previewLength;

  return (
    <div className="awaiting-email-summary">
      <p>
        {expanded ? text : `${text.substring(0, previewLength)}${isLong ? '...' : ''}`}
      </p>
      {isLong && (
        <button className="btn-link" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: Assisted Response Tab (Emails awaiting user input) ---
const AssistedResponseTab = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();

  const [awaitingEmails, setAwaitingEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // 'success' | 'error'
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchAwaitingEmails();
  }, [searchTerm, filterPriority, filterDateRange, currentPage, itemsPerPage]);

  const fetchAwaitingEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterPriority !== 'All') params.append('priority', filterPriority);
      if (filterDateRange !== 'All') params.append('dateRange', filterDateRange);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await axios.get(`${API_URL}/communications/awaiting-input?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAwaitingEmails(response.data.data || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.total);
        } else {
          setTotalPages(1);
          setTotalItems(response.data.data?.length || 0);
        }
      }
    } catch (error) {
      console.error('Erreur chargement emails en attente:', error);
      setError(error);
      setAwaitingEmails([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Reset page quand filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPriority, filterDateRange]);

  const handleGenerateQuestions = async (email) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/communications/${email._id}/generate-questions`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSelectedEmail(email);
        setQuestionnaireData(response.data.data);
        setShowQuestionnaireModal(true);
        setUserAnswers({});
      }
    } catch (error) {
      console.error('Erreur génération questions:', error);
      setToast({ show: true, message: `Erreur: ${error.response?.data?.message || error.message}`, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = (questionText, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionText]: answer,
    }));
  };

  const handleSubmitQuestionnaire = async () => {
    // Vérifier que toutes les questions requises ont une réponse
    const requiredQuestions = questionnaireData?.questions?.filter((q) => q.required) || [];
    const missingAnswers = requiredQuestions.filter((q) => !userAnswers[q.question]);

    if (missingAnswers.length > 0) {
      setToast({ show: true, message: 'Veuillez répondre à toutes les questions requises.', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
      return;
    }

    // Confirmation avant envoi
    const confirmSend = window.confirm('Êtes-vous sûr de vouloir générer et envoyer cette réponse ?');
    if (!confirmSend) return;

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_URL}/communications/${selectedEmail._id}/submit-questionnaire`,
        { userAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setToast({ show: true, message: 'Réponse générée et envoyée avec succès !', type: 'success' });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        setShowQuestionnaireModal(false);
        setSelectedEmail(null);
        setQuestionnaireData(null);
        setUserAnswers({});
        fetchAwaitingEmails(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur soumission questionnaire:', error);
      setToast({ show: true, message: `Erreur: ${error.response?.data?.message || error.message}`, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && awaitingEmails.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des emails en attente...</p>
      </div>
    );
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtrage côté client sur la liste déjà chargée (si backend ne supporte pas les filtres)
  const filteredEmails = awaitingEmails.filter((email) => {
    const matchesSearch =
      searchTerm === '' ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.ai_analysis?.summary?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = filterPriority === 'All' || email.ai_analysis?.urgency === filterPriority;

    let matchesDate = true;
    if (filterDateRange !== 'All') {
      const now = new Date();
      const received = new Date(email.receivedAt);
      const diffDays = Math.floor((now - received) / (1000 * 60 * 60 * 24));
      if (filterDateRange === 'Today') matchesDate = diffDays === 0;
      else if (filterDateRange === 'Yesterday') matchesDate = diffDays === 1;
      else if (filterDateRange === 'Last7Days') matchesDate = diffDays <= 7;
      else if (filterDateRange === 'Last30Days') matchesDate = diffDays <= 30;
      else if (filterDateRange === 'ThisMonth') matchesDate = received.getMonth() === now.getMonth() && received.getFullYear() === now.getFullYear();
      else if (filterDateRange === 'LastMonth') matchesDate = received.getMonth() === (now.getMonth() - 1 + 12) % 12 && (filterDateRange === 'LastMonth' ? received.getFullYear() === (now.getFullYear() - (now.getMonth() === 0 ? 1 : 0)) : received.getFullYear() === now.getFullYear());
    }

    return matchesSearch && matchesPriority && matchesDate;
  });

  // Pagination côté client
  const totalFiltered = filteredEmails.length;
  const totalPagesClient = Math.ceil(totalFiltered / itemsPerPage);
  const paginatedEmails = filteredEmails.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="assisted-response-tab">
      <div className="assisted-header">
        <h2>
          <FontAwesomeIcon icon={faRobot} /> Réponses Automatiques Assistées
        </h2>
        <p className="assisted-subtitle">
          Emails Low/Medium en attente de votre contexte pour générer une réponse IA ({totalFiltered})
        </p>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: 'success' })}>×</button>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="controls-section">
        <div className="filter-controls">
          <div className="filter-group search-group">
            <label>Recherche</label>
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Sujet, Expéditeur, ou Contenu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Priorité</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="All">Toute priorité</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Période</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="All">Tout temps</option>
              <option value="Today">Aujourd'hui</option>
              <option value="Yesterday">Hier</option>
              <option value="Last7Days">7 derniers jours</option>
              <option value="Last30Days">30 derniers jours</option>
              <option value="ThisMonth">Ce mois</option>
              <option value="LastMonth">Mois dernier</option>
            </select>
          </div>
        </div>
      </div>

      {paginatedEmails.length === 0 ? (
        <div className="no-awaiting-emails">
          <FontAwesomeIcon icon={faRobot} size="3x" style={{ color: '#6b7280', marginBottom: '1rem' }} />
          {error ? (
            <>
              <p>Erreur de chargement : {error.message}</p>
              <button className="btn-retry" onClick={fetchAwaitingEmails}>Réessayer</button>
            </>
          ) : (
            <>
              <p>{searchTerm || filterPriority !== 'All' || filterDateRange !== 'All' ? 'Aucun résultat avec ces filtres.' : 'Aucun email en attente de réponse assistée.'}</p>
              <p className="subtitle">Les emails Low/Medium nécessitant une réponse apparaîtront ici.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="awaiting-emails-grid">
            {paginatedEmails.map((email) => (
            <div key={email._id} className="awaiting-email-card">
              <div className="awaiting-email-header">
                <span
                  className="awaiting-email-priority"
                  data-priority={email.ai_analysis?.urgency || 'Medium'}
                >
                  <FontAwesomeIcon icon={faClock} /> {email.ai_analysis?.urgency}
                </span>
                <span className="awaiting-email-date">
                  {new Date(email.receivedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h4 className="awaiting-email-subject">{email.subject}</h4>
              <p className="awaiting-email-from">
                <FontAwesomeIcon icon={faEnvelope} /> {email.sender.email}
              </p>
              <AwaitingSummary summary={email.ai_analysis?.summary || email.content} />
              <div className="awaiting-email-footer">
                <button
                  className="btn-reply"
                  onClick={() => {
                    if (email.aiGeneratedQuestions && email.aiGeneratedQuestions.length > 0) {
                      setSelectedEmail(email);
                      setQuestionnaireData({ questions: email.aiGeneratedQuestions });
                      setShowQuestionnaireModal(true);
                      setUserAnswers({});
                    } else {
                      handleGenerateQuestions(email);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faRobot} />
                  {email.aiGeneratedQuestions && email.aiGeneratedQuestions.length > 0
                    ? 'Continuer la réponse assistée'
                    : 'Répondre (assistant)'}
                </button>
              </div>
            </div>
          ))}
          </div>
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPagesClient}
            totalItems={totalFiltered}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            loading={loading}
          />
        </>
      )}

      {/* Modal Questionnaire */}
      {showQuestionnaireModal && questionnaireData && (
        <div className="questionnaire-modal" onClick={() => setShowQuestionnaireModal(false)}>
          <div className="questionnaire-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="questionnaire-modal-header">
              <div>
                <h3>
                  <FontAwesomeIcon icon={faRobot} /> Questions Contextuelles
                </h3>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${((userAnswers ? Object.keys(userAnswers).length : 0) / questionnaireData.questions.length) * 100}%` }}
                  />
                </div>
                <span className="progress-text">{Object.keys(userAnswers).length} / {questionnaireData.questions.length} répondues</span>
              </div>
              <button className="close-modal-btn" onClick={() => setShowQuestionnaireModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="questionnaire-email-info">
              <p>
                <strong>Email:</strong> <span>{selectedEmail?.subject}</span>
              </p>
              <p>
                <strong>De:</strong> <span>{selectedEmail?.sender?.email}</span>
              </p>
            </div>

            <div className="questionnaire-body">
              {questionnaireData.questions.map((question, index) => (
                <div key={index} className="question-block">
                  <div className="question-label-wrapper">
                    <label className="question-label">
                      {question.question}
                      {question.required && <span className="required-asterisk"> *</span>}
                    </label>
                    {question.hint && (
                      <span className="hint-icon" title={question.hint}>ⓘ</span>
                    )}
                  </div>

                  {question.type === 'radio' && (
                    <div className="radio-group">
                      {question.options.map((option, optIndex) => (
                        <label key={optIndex} className="radio-option">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={userAnswers[question.question] === option}
                            onChange={(e) => handleAnswerQuestion(question.question, e.target.value)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkbox' && (
                    <div className="checkbox-group">
                      {question.options.map((option, optIndex) => (
                        <label key={optIndex} className="checkbox-option">
                          <input
                            type="checkbox"
                            value={option}
                            checked={
                              Array.isArray(userAnswers[question.question]) &&
                              userAnswers[question.question].includes(option)
                            }
                            onChange={(e) => {
                              const currentAnswers = userAnswers[question.question] || [];
                              if (e.target.checked) {
                                handleAnswerQuestion(question.question, [...currentAnswers, option]);
                              } else {
                                handleAnswerQuestion(
                                  question.question,
                                  currentAnswers.filter((a) => a !== option)
                                );
                              }
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'text' && (
                    <>
                      <textarea
                        className="text-input"
                        rows="3"
                        value={userAnswers[question.question] || ''}
                        onChange={(e) => handleAnswerQuestion(question.question, e.target.value)}
                        placeholder="Votre réponse..."
                      />
                      {question.hint && <p className="question-hint">{question.hint}</p>}
                    </>
                  )}

                  {question.type === 'select' && (
                    <select
                      className="select-input"
                      value={userAnswers[question.question] || ''}
                      onChange={(e) => handleAnswerQuestion(question.question, e.target.value)}
                    >
                      <option value="">-- Sélectionner --</option>
                      {question.options.map((option, optIndex) => (
                        <option key={optIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="questionnaire-footer">
              <button className="btn-cancel" onClick={() => setShowQuestionnaireModal(false)}>
                Annuler
              </button>
              <button
                className="btn-submit-questionnaire"
                onClick={handleSubmitQuestionnaire}
                disabled={submitting}
              >
                {submitting ? 'Envoi en cours...' : 'Générer et Envoyer la Réponse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: Auto Responses Tab (Emails avec suggestion IA prête) ---
const AutoResponsesTab = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('authToken');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [filterStatus, setFilterStatus] = useState('Pending'); // Pending, Sent, All
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [draftContent, setDraftContent] = useState('');
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); // Pour la sélection multiple
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    fetchAutoCandidates();
  }, [searchTerm, filterPriority, filterDateRange, filterStatus, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPriority, filterDateRange, filterStatus]);

  const fetchAutoCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterPriority !== 'All') params.append('priority', filterPriority);
      if (filterDateRange !== 'All') params.append('dateRange', filterDateRange);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`${API_URL}/communications/auto-candidates?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch communications');
      }

      const result = await response.json();
      if (result.success) {
        // Le backend filtre déjà tout, on prend les données telles quelles
        setItems(result.data || []);

        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotalItems(result.pagination.total);
        } else {
          setTotalPages(1);
          setTotalItems(result.data?.length || 0);
        }
      }
    } catch (e) {
      console.error('Erreur chargement réponses auto:', e);
      setError(e.message);
      setItems([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedItem?.ai_analysis?.suggestedResponse) {
      setDraftContent(selectedItem.ai_analysis.suggestedResponse);
    } else {
      setDraftContent('');
    }
  }, [selectedItem]);

  const openCompose = (item) => setSelectedItem(item);
  const closeCompose = () => {
    setSelectedItem(null);
    setDraftContent('');
  };

  const handleSend = async () => {
    if (!draftContent.trim()) {
      alert('Veuillez saisir ou vérifier le contenu de la réponse auto');
      return;
    }
    try {
      setSending(true);
      const response = await axios.post(
        `${API_URL}/communications/${selectedItem._id}/reply`,
        { replyContent: draftContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert('✅ Réponse automatique envoyée');
        closeCompose();
        fetchAutoCandidates();
      }
    } catch (error) {
      console.error('Erreur envoi auto-réponse:', error);
      alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async (item) => {
    try {
      setRegenerating(true);
      const response = await axios.post(
        `${API_URL}/communications/${item._id}/generate-suggestion`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const updated = response.data.data?.suggestedResponse || response.data.data;
        setItems((prev) =>
          prev.map((it) =>
            it._id === item._id
              ? { ...it, ai_analysis: { ...it.ai_analysis, suggestedResponse: updated } }
              : it
          )
        );
        if (selectedItem?._id === item._id) {
          setDraftContent(updated || '');
        }
      } else {
        alert("La régénération n'a pas abouti.");
      }
    } catch (error) {
      console.error('Erreur régénération suggestion:', error);
      alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  // Gestion de la sélection multiple
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(items.map((i) => i._id));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterPriority !== 'All') params.append('priority', filterPriority);
      if (filterDateRange !== 'All') params.append('dateRange', filterDateRange);
      const response = await fetch(`${API_URL}/communications/auto-candidates/ids?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch ids');
      const result = await response.json();
      if (result.success) {
        setSelectedItems(result.data || []);
      }
    } catch (e) {
      console.error('Erreur sélection globale:', e);
    }
  };

  const deselectAllGlobal = () => {
    setSelectedItems([]);
  };

  const handleBulkSend = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(`Voulez-vous vraiment envoyer ces ${selectedItems.length} réponses automatiques ?`)) {
      return;
    }

    setBulkSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedItems) {
      let item = items.find((i) => i._id === id);
      if (!item) {
        try {
          const resp = await axios.get(`${API_URL}/communications/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.data?.success) {
            item = resp.data.data;
          }
        } catch (fetchErr) {
          console.error(`Erreur récupération item ${id}:`, fetchErr);
        }
      }
      if (!item) {
        failCount++;
        continue;
      }
      try {
        const content = item.ai_analysis?.suggestedResponse;
        if (!content) throw new Error("Pas de suggestion");
        await axios.post(
          `${API_URL}/communications/${id}/reply`,
          { replyContent: content },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successCount++;
      } catch (error) {
        console.error(`Erreur envoi auto pour ${id}:`, error);
        failCount++;
      }
    }

    alert(`Traitement terminé.\n✅ Envoyés: ${successCount}\n❌ Échecs: ${failCount}`);
    setBulkSending(false);
    setSelectedItems([]);
    fetchAutoCandidates();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des réponses automatiques...</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="controls-section">
        <div className="filter-controls">
          <div className="filter-group search-group">
            <label>Recherche</label>
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Sujet, Expéditeur, ou Contenu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Priorité</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="All">Toute priorité</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Période</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="All">Tout temps</option>
              <option value="Today">Aujourd'hui</option>
              <option value="Yesterday">Hier</option>
              <option value="Last7Days">7 derniers jours</option>
              <option value="Last30Days">30 derniers jours</option>
              <option value="ThisMonth">Ce mois</option>
              <option value="LastMonth">Mois dernier</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="Pending">À envoyer</option>
              <option value="Sent">Envoyées</option>
              <option value="All">Toutes</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={selectAllFiltered}
            disabled={totalItems === 0}
            className="btn-reply"
          >
            Sélectionner les résultats ({totalItems})
          </button>
          <button
            onClick={deselectAllGlobal}
            disabled={selectedItems.length === 0}
            className="btn-cancel"
          >
            Tout désélectionner
          </button>
        </div>
        <div style={{ fontWeight: 600 }}>
          {selectedItems.length} sélectionné(s)
        </div>
      </div>

      <div className="communications-list">
        {items.length === 0 ? (
          <div className="empty-state">
            {error ? `Erreur: ${error}` : "Aucune réponse automatique prête."}
          </div>
        ) : (
          items.map((comm) => (
            <div key={comm._id} className="communication-card" style={{ position: 'relative', paddingRight: '60px' }}>
              <div style={{ position: 'absolute', right: '16px', top: '12px' }}>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(comm._id)}
                  onChange={() => toggleSelectItem(comm._id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div className="comm-type-badge" data-type={(comm.source || 'outlook').toLowerCase()}>
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <div className="comm-content">
                <div className="comm-header-row">
                  <h3 className="comm-subject">{comm.subject || "(Sans sujet)"}</h3>
                </div>
                <div className="comm-meta">
                  <span className="comm-from">{comm.sender?.email || "Inconnu"}</span>
                  <span>•</span>
                  <span className="comm-date">
                    {comm.receivedAt
                      ? new Date(comm.receivedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <p className="comm-preview">
                  {(comm.ai_analysis?.summary || comm.snippet || comm.content || '').substring(0, 140)}
                  {((comm.ai_analysis?.summary || comm.snippet || comm.content || '').length > 140) && '...'}
                </p>
                <div className="comm-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div className="ai-tags">
                    <span
                      className="ai-tag priority"
                      data-priority={comm.ai_analysis?.urgency || 'Medium'}
                      title="Urgence IA"
                    >
                      {comm.ai_analysis?.urgency || 'Medium'}
                    </span>
                    {comm.hasAutoResponse && (
                      <span className="ai-tag auto-response">
                        ✓ Auto-Response envoyée
                      </span>
                    )}
                  </div>
                  <button className="btn-reply" onClick={() => openCompose(comm)}>
                    <FontAwesomeIcon icon={faPaperPlane} /> Prévisualiser/Envoyer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          onClick={handleBulkSend}
          disabled={bulkSending || selectedItems.length === 0}
          className="btn-send"
        >
          {bulkSending ? 'Envoi en cours...' : `Envoyer (${selectedItems.length})`}
        </button>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />

      {selectedItem && (
        <div className="reply-modal" onClick={closeCompose}>
          <div className="reply-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="reply-modal-header">
              <h3>
                <FontAwesomeIcon icon={faPaperPlane} /> Réponse Automatique
              </h3>
              <button className="close-modal-btn" onClick={closeCompose}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="reply-email-info">
              <p>
                <strong>À:</strong> <span>{selectedItem.sender?.email}</span>
              </p>
              <p>
                <strong>Sujet:</strong> <span>Re: {selectedItem.subject}</span>
              </p>
              <p>
                <strong>Priorité:</strong>{' '}
                <span className={`urgent-email-priority ${selectedItem.ai_analysis?.urgency?.toLowerCase()}`}>
                  <FontAwesomeIcon icon={faExclamationTriangle} /> {selectedItem.ai_analysis?.urgency}
                </span>
              </p>
            </div>

            <div className="reply-ai-summary">
              <h4>
                <FontAwesomeIcon icon={faRobot} /> Résumé IA
              </h4>
              <div className="ai-summary-content">
                {selectedItem.ai_analysis?.summary || "Résumé IA non disponible."}
              </div>
            </div>

            <div className="reply-compose">
              <h4>Contenu à envoyer</h4>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Vérifiez/éditez la réponse auto proposée..."
              />
            </div>

            <div className="reply-modal-actions">
              <button className="btn-cancel" onClick={closeCompose} disabled={sending}>
                Annuler
              </button>
              <button
                className="btn-cancel"
                onClick={() => handleRegenerate(selectedItem)}
                disabled={regenerating}
              >
                {regenerating ? 'Régénération...' : 'Régénérer'}
              </button>
              <button className="btn-send" onClick={handleSend} disabled={sending || !draftContent.trim()}>
                {sending ? (
                  <>
                    <span className="spinner-small"></span> Envoi...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} /> Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT: Communication Center ---
function Communications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const autoResponseEnabled = user?.autoResponseEnabled === true;

  // Simulation de chargement initial pour toute la page
  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Si onglet Auto sélectionné mais désactivé, basculer vers Assisted
  useEffect(() => {
    if (activeTab === 'auto' && autoResponseEnabled === false) {
      setActiveTab('assisted');
    }
  }, [activeTab, autoResponseEnabled]);

  const renderContent = () => {
    switch (activeTab) {
      case "list":
        return <CommunicationListTab navigate={navigate} />;
      case "urgent":
        return <UrgentEmailsTab />;
      case "auto":
        return autoResponseEnabled ? <AutoResponsesTab /> : <AssistedResponseTab />;
      case "assisted":
        return <AssistedResponseTab />;
      case "escalation":
        return <EscalationDashboardTab />;
      default:
        return <CommunicationListTab navigate={navigate} />;
    }
  };

  if (loading) {
    return (
      <div className="communications-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing Communications Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="communications-page">
      <div className="communications-header">
        <h1 className="page-title">Communications Hub</h1>

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <FontAwesomeIcon icon={faInbox} /> Summaries & Search
          </button>
          <button
            className={`tab-button ${activeTab === "urgent" ? "active" : ""}`}
            onClick={() => setActiveTab("urgent")}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} /> À Répondre
          </button>
          <button
            className={`tab-button ${activeTab === "assisted" ? "active" : ""}`}
            onClick={() => setActiveTab("assisted")}
          >
            <FontAwesomeIcon icon={faRobot} /> Réponses Assistées
          </button>
          {autoResponseEnabled && (
            <button
              className={`tab-button ${activeTab === "auto" ? "active" : ""}`}
              onClick={() => setActiveTab("auto")}
            >
              <FontAwesomeIcon icon={faRobot} /> Réponses Auto
            </button>
          )}
          {user?.role !== 'UpperAdmin' && (
            <button
              className={`tab-button ${
                activeTab === "escalation" ? "active" : ""
              }`}
              onClick={() => setActiveTab("escalation")}
            >
              <FontAwesomeIcon icon={faChartLine} /> Escalation Dashboard
            </button>
          )}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}

export default Communications;
