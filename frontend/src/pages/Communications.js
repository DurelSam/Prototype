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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchUrgentEmails();
  }, [currentPage, itemsPerPage]);

  const fetchUrgentEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/communications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: 'To Validate',
          priority: 'High,Critical',
          page: currentPage,
          limit: itemsPerPage,
        },
      });

      if (response.data.success) {
        // Le backend retourne le tableau dans 'data' directement
        const communications = response.data.data || [];

        // Filtrer pour exclure les emails déjà répondus
        const filtered = communications.filter(
          (comm) =>
            !comm.hasAutoResponse && // Pas de réponse auto
            !comm.manualResponse?.sent // Pas de réponse manuelle
        );

        setUrgentEmails(filtered);

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
                {selectedEmail.ai_analysis?.summary || selectedEmail.content?.substring(0, 300)}
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
  const [filterDateRange, setFilterDateRange] = useState("All");
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
            aiAnalysis: {
              sentiment: comm.ai_analysis?.sentiment || "Pending",
              priority: comm.ai_analysis?.urgency || "Medium",
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
    filterDateRange,
    searchTerm,
    currentPage,
    itemsPerPage,
  ]);

  // Reset à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterPriority, searchTerm, filterDateRange]);

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
                      style={{
                        background: "rgba(17, 24, 39, 0.8)",
                        color: "#e5e7eb",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={getSentimentIcon(comm.aiAnalysis.sentiment)}
                      />{" "}
                      {comm.aiAnalysis.sentiment}
                    </span>
                    <span
                      className="ai-tag priority"
                      style={{
                        borderColor: getPriorityColor(comm.aiAnalysis.priority),
                        color: getPriorityColor(comm.aiAnalysis.priority),
                        fontWeight: "700",
                      }}
                    >
                      {comm.aiAnalysis.priority}
                    </span>
                    {comm.status === "Escalated" && (
                      <span
                        className="ai-tag escalated"
                        style={{
                          background: "#ef4444",
                          color: "#fff",
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
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          fontWeight: "600",
                        }}
                        title="Réponse automatique envoyée"
                      >
                        ✓ Auto-Response
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

// --- MAIN COMPONENT: Communication Center ---
function Communications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(true);

  // Simulation de chargement initial pour toute la page
  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "list":
        return <CommunicationListTab navigate={navigate} />;
      case "urgent":
        return <UrgentEmailsTab />;
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
