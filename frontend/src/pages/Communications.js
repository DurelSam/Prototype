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
  faEye,
  faCheckCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../components/Pagination";
import "../styles/Communications.css";

// --- SUB-COMPONENT: Escalation Dashboard (CEO View) ---
const EscalationDashboardTab = ({ navigate }) => {
  const [stats, setStats] = useState({
    level1: 0,
    level2: 0,
    overdue: 0,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetchEscalationData();
  }, []);

  const fetchEscalationData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/communications/escalations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStats(response.data.data.stats);
        setHistory(response.data.data.history);
      }
    } catch (err) {
      console.error("Error loading escalation data:", err);
      setError("Failed to load escalation data.");
    } finally {
      setLoading(false);
    }
  };

  const totalItems = history.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResolve = async (id) => {
    if (!window.confirm("Are you sure you want to mark this escalation as Resolved (Closed)?")) return;
    
    try {
      await axios.patch(
        `${API_URL}/communications/${id}/status`,
        { status: "Closed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh data
      fetchEscalationData();
    } catch (err) {
      alert("Error resolving escalation: " + (err.response?.data?.message || err.message));
    }
  };

  const handleView = (id) => {
    // Navigate to detail view (assuming it exists or reuse a modal)
    // For now, let's assume we can navigate to a detail page or switch tab
    // Ideally, we should pass `navigate` prop to this component
    if (navigate) {
      navigate(`/communications?id=${id}`);
    } else {
       // Fallback or just log
       console.log("Navigate to", id);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="tab-content">
      <div className="escalation-dashboard">
        <div className="escalation-dashboard-header">
          <div className="escalation-kpi-chips">
            <div className="escalation-kpi-item">
              <div className="kpi-chip kpi-chip-level1">
                <span className="kpi-label">Level 1</span>
                <span className="kpi-value">{stats.level1}</span>
              </div>
              <div className="escalation-icon-pill level1-icon-pill">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
            </div>
            <div className="escalation-kpi-item">
              <div className="kpi-chip kpi-chip-level2">
                <span className="kpi-label">Level 2</span>
                <span className="kpi-value">{stats.level2}</span>
              </div>
              <div className="escalation-icon-pill level2-icon-pill">
                <FontAwesomeIcon icon={faArrowUp} />
              </div>
            </div>
            <div className="escalation-kpi-item">
              <div className="kpi-chip kpi-chip-overdue">
                <span className="kpi-label">Overdue</span>
                <span className="kpi-value">{stats.overdue}</span>
              </div>
              <div className="escalation-icon-pill overdue-icon-pill">
                <FontAwesomeIcon icon={faClock} />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="escalation-info-badge"
            title="Includes escalated items (status Escalated or isEscalated=true) and overdue SLAs that are not closed."
          >
            <FontAwesomeIcon icon={faInfoCircle} />
          </button>
        </div>
        <div className="escalation-table-section">
          <h3>Escalation History & Tracking</h3>
          {history.length === 0 ? (
            <p className="no-data">No active escalations.</p>
          ) : (
            <table className="escalation-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="escalation-subject">{item.subject}</div>
                      <div className="escalation-meta">
                        {item.urgency} {item.isOverdue ? "• Overdue" : ""}
                      </div>
                    </td>
                    <td>
                      {item.fromUser} ({item.fromRole})
                    </td>
                    <td>{item.toRole}</td>
                    <td>{formatTime(item.escalatedAt)}</td>
                    <td>
                      <span>{item.reason}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {history.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Urgent Emails Tab (High/Critical) ---
const UrgentEmailsTab = () => {
  const { user } = useAuth();
  const [urgentEmails, setUrgentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [filterPriority, setFilterPriority] = useState('All');
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
  }, [currentPage, itemsPerPage, debouncedSearchTerm, filterPriority, filterDateRange]);

  const fetchUrgentEmails = async () => {
    try {
      setLoading(true);
      const priorityParam = filterPriority === 'All' ? 'High,Critical' : filterPriority;
      const response = await axios.get(`${API_URL}/communications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: 'To Validate',
          priority: priorityParam,
          search: debouncedSearchTerm,
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
      console.error('Error loading urgent emails:', error);
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
  }, [debouncedSearchTerm, filterPriority, filterDateRange]);
  const handleReply = async () => {
    if (!replyContent.trim()) {
      alert('Please enter a reply message');
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
        alert('✅ Reply sent successfully!');
        setSelectedEmail(null);
        setReplyContent('');
        fetchUrgentEmails(); // Recharger la liste
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Effet pour pré-remplir le contenu de la réponse avec le brouillon
  useEffect(() => {
    if (selectedEmail) {
      if (selectedEmail.ai_analysis?.suggestedResponse) {
        setReplyContent(selectedEmail.ai_analysis.suggestedResponse);
      } else {
        // Pré-remplir avec la signature
        const signature = user?.emailSignature || "Cordialement,\nL'équipe Support";
        setReplyContent("\n\n" + signature);
      }
    } else {
      setReplyContent('');
    }
  }, [selectedEmail, user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading urgent emails...</p>
      </div>
    );
  }

  return (
    <div className="urgent-emails-tab">
      <div className="escalation-dashboard-header">
        <div className="escalation-kpi-chips">
          <div className="kpi-chip">
            <span className="kpi-label">Total</span>
            <span className="kpi-value">{totalItems}</span>
          </div>
          <div className="kpi-chip">
            <span className="kpi-label">On page</span>
            <span className="kpi-value">{urgentEmails.length}</span>
          </div>
          <div className="kpi-chip">
            <span className="kpi-label">Page</span>
            <span className="kpi-value">
              {currentPage}/{totalPages || 1}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="escalation-info-badge"
          title="High/Critical emails requiring manual reply. Search, priority and date filters apply to these counters."
        >
          <FontAwesomeIcon icon={faInfoCircle} />
        </button>
      </div>

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
            <label>Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="All">Any Priority</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
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
      {urgentEmails.length === 0 ? (
        <div className="no-urgent-emails">
          <p>No urgent emails pending. All High/Critical emails have been processed.</p>
        </div>
      ) : (
        <>
          <div className="communications-list">
            {urgentEmails.map((email, index) => (
              <div
                key={email._id}
                className="communication-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="comm-type-badge"
                  data-type={(email.source || 'outlook').toLowerCase()}
                >
                  <FontAwesomeIcon icon={email.source === 'whatsapp' ? faCommentDots : faEnvelope} />
                </div>
                <div className="comm-content">
                  <div className="comm-header-row">
                    <h3 className="comm-subject">{email.subject}</h3>
                  </div>
                  <div className="comm-meta">
                    <span className="comm-from">{email.sender?.email || "Unknown"}</span>
                    <span>•</span>
                    <span className="comm-date">
                      {new Date(email.receivedAt).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="comm-preview">
                    {(email.ai_analysis?.summary || email.snippet || email.content || '').substring(0, 140)}
                    {((email.ai_analysis?.summary || email.snippet || email.content || '').length > 140) && '...'}
                  </p>
                  <div className="comm-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="ai-tags">
                      <span
                        className="ai-tag priority"
                        data-priority={email.ai_analysis?.urgency || 'High'}
                        title="AI Priority"
                      >
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {email.ai_analysis?.urgency || 'High'}
                      </span>
                      {email.hasAutoResponse && (
                        <span className="ai-tag auto-response">
                          ✓ Auto-Response sent
                        </span>
                      )}
                      {email.hasBeenReplied && !email.hasAutoResponse && (
                        <span
                          className="ai-tag replied"
                          title="Email replied"
                        >
                          <FontAwesomeIcon icon={faReply} /> Replied
                        </span>
                      )}
                    </div>
                    <button className="btn-reply" onClick={() => setSelectedEmail(email)}>
                      <FontAwesomeIcon icon={faReply} /> Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </>
      )}

      {/* Pagination Component - Same as Summary & Search */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />

      {/* Reply Modal */}
      {selectedEmail && (
        <div className="reply-modal" onClick={() => setSelectedEmail(null)}>
          <div className="reply-modal-content" onClick={(e) => e.stopPropagation()}>
            {console.log('📧 Selected email:', selectedEmail)}
            {console.log('🤖 AI Analysis:', selectedEmail.ai_analysis)}
            <div className="reply-modal-header">
              <h3>
                <FontAwesomeIcon icon={faReply} /> Reply to email
              </h3>
              <button className="close-modal-btn" onClick={() => setSelectedEmail(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="reply-email-info">
              <p>
                <strong>To:</strong> <span>{selectedEmail.sender.email}</span>
              </p>
              <p>
                <strong>Subject:</strong> <span>Re: {selectedEmail.subject}</span>
              </p>
              <p>
                <strong>Priority:</strong>{' '}
                <span className={`urgent-email-priority ${selectedEmail.ai_analysis?.urgency?.toLowerCase()}`}>
                  <FontAwesomeIcon icon={faExclamationTriangle} /> {selectedEmail.ai_analysis?.urgency}
                </span>
              </p>
            </div>

            <div className="reply-original-email">
              <h4>Original message</h4>
              <div className="original-content">
                {selectedEmail.content?.substring(0, 500) || 'Content not available'}
              </div>
            </div>

            <div className="reply-ai-summary">
              <h4>
                <FontAwesomeIcon icon={faRobot} /> AI Summary
              </h4>
              <div className="ai-summary-content">
                {selectedEmail.ai_analysis?.summary || 'AI summary not available for this email.'}
              </div>
            </div>

            <div className="reply-compose">
              <h4>Your response</h4>
              <textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Compose your response here..."
              />
            </div>

            <div className="reply-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setSelectedEmail(null)}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                className="btn-send"
                onClick={handleReply}
                disabled={sending || !replyContent.trim()}
              >
                {sending ? (
                  <>
                    <span className="spinner-small"></span> Sending...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} /> Send
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    debouncedSearchTerm,
    currentPage,
    itemsPerPage,
  ]);

  // Reset à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterPriority, filterSentiment, filterStatus, filterState, debouncedSearchTerm, filterDateRange]);

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
      <div className="escalation-dashboard-header">
        <div className="escalation-kpi-chips">
          <div className="kpi-chip">
            <span className="kpi-label">Total</span>
            <span className="kpi-value">{totalItems}</span>
          </div>
          <div className="kpi-chip">
            <span className="kpi-label">Pages</span>
            <span className="kpi-value">{totalPages}</span>
          </div>
          <div className="kpi-chip">
            <span className="kpi-label">Per page</span>
            <span className="kpi-value">{itemsPerPage}</span>
          </div>
        </div>
        <button
          type="button"
          className="escalation-info-badge"
          title="Full communications list with filters (source, priority, status, sentiment, date, search). Counts reflect filters and pagination."
        >
          <FontAwesomeIcon icon={faInfoCircle} />
        </button>
      </div>
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
            {showAdvancedFilters ? "Fewer filters" : "More filters"}
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
                        title="Email escalated (SLA breached)"
                      >
                        <FontAwesomeIcon icon={faArrowUp} /> ESCALATED
                      </span>
                    )}
                    {comm.hasAutoResponse && (
                      <span
                        className="ai-tag auto-response"
                        title="Auto-response sent"
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
                        title="Email replied manually"
                      >
                        <FontAwesomeIcon icon={faReply} /> Replied
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
                        title="Awaiting your input to generate an AI response"
                      >
                        <FontAwesomeIcon icon={faRobot} /> Awaiting
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
                        title="AI determined no response is needed"
                      >
                        <FontAwesomeIcon icon={faQuestionCircle} /> No response needed
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
          {expanded ? 'Show less' : 'Show more'}
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Wizard States
  const [wizardStep, setWizardStep] = useState('questions'); // 'questions' | 'preview'
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  useEffect(() => {
    fetchAwaitingEmails();
  }, [debouncedSearchTerm, filterPriority, filterDateRange, currentPage, itemsPerPage]);

  const fetchAwaitingEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
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
      console.error('Error loading awaiting emails:', error);
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
      // On met loading à true mais on set aussi l'email sélectionné pour savoir où afficher le spinner
      setSelectedEmail(email); 
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/communications/${email._id}/generate-questions`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Mettre à jour l'état local pour inclure les questions générées
        setAwaitingEmails((prevEmails) =>
          prevEmails.map((e) =>
            e._id === email._id
              ? { ...e, aiGeneratedQuestions: response.data.data.questions }
              : e
          )
        );

        // Mettre à jour l'email sélectionné avec les questions (important pour le modal)
        const updatedEmail = { ...email, aiGeneratedQuestions: response.data.data.questions };
        setSelectedEmail(updatedEmail);
        
        setQuestionnaireData(response.data.data);
        setShowQuestionnaireModal(true);
        setUserAnswers({});
        setWizardStep('questions');
        setGeneratedDraft('');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setToast({ show: true, message: `Error: ${error.response?.data?.message || error.message}`, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
      setSelectedEmail(null); // Reset selection on error
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

  const handleGenerateDraft = async () => {
    // Vérifier que toutes les questions requises ont une réponse
    const requiredQuestions = questionnaireData?.questions?.filter((q) => q.required) || [];
    const missingAnswers = requiredQuestions.filter((q) => !userAnswers[q.question]);

    if (missingAnswers.length > 0) {
      setToast({ show: true, message: 'Veuillez répondre à toutes les questions requises.', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
      return;
    }

    try {
      setIsGeneratingDraft(true);
      
      // Petit délai artificiel pour UX (éviter le flash si trop rapide)
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));
      
      const [response] = await Promise.all([
        axios.post(
          `${API_URL}/communications/${selectedEmail._id}/preview-reply`,
          { userAnswers },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        minLoadingTime
      ]);

      if (response.data.success) {
        setGeneratedDraft(response.data.data.draft);
        setWizardStep('preview');
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      setToast({ show: true, message: `Error: ${error.response?.data?.message || error.message}`, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSubmitQuestionnaire = async () => {
    // Confirmation avant envoi
    const confirmSend = window.confirm('Are you sure you want to send this response?');
    if (!confirmSend) return;

    try {
      setSubmitting(true);
      // On envoie le brouillon final ET les réponses pour l'historique
      const payload = {
        userAnswers,
        finalDraft: generatedDraft 
      };

      const response = await axios.post(
        `${API_URL}/communications/${selectedEmail._id}/submit-questionnaire`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setToast({ show: true, message: 'Response sent successfully!', type: 'success' });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        setShowQuestionnaireModal(false);
        setSelectedEmail(null);
        setQuestionnaireData(null);
        setUserAnswers({});
        setGeneratedDraft('');
        setWizardStep('questions');
        fetchAwaitingEmails(); // Recharger la liste
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      setToast({ show: true, message: `Error: ${error.response?.data?.message || error.message}`, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && awaitingEmails.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading awaiting emails...</p>
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
      debouncedSearchTerm === '' ||
      email.subject?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      email.sender?.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      email.ai_analysis?.summary?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

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
      <div className="escalation-dashboard-header">
        <div className="escalation-kpi-chips">
          <div className="kpi-chip">
            <span className="kpi-label">Awaiting</span>
            <span className="kpi-value">{totalFiltered}</span>
          </div>
          <div className="kpi-chip">
            <span className="kpi-label">On page</span>
            <span className="kpi-value">{paginatedEmails.length}</span>
          </div>
          <div className="kpi-chip">
            <span className="kpi-label">Page</span>
            <span className="kpi-value">
              {currentPage}/{totalPagesClient || 1}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="escalation-info-badge"
          title="Low/Medium emails awaiting contextual input before sending an assisted response. Filters apply."
        >
          <FontAwesomeIcon icon={faInfoCircle} />
        </button>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: 'success' })}>×</button>
        </div>
      )}

      {/* Search bar and filters */}
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
            <label>Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="All">Any Priority</option>
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

      {paginatedEmails.length === 0 ? (
        <div className="no-awaiting-emails">
          <FontAwesomeIcon icon={faRobot} size="3x" style={{ color: '#6b7280', marginBottom: '1rem' }} />
          {error ? (
            <>
              <p>Loading error: {error.message}</p>
              <button className="btn-retry" onClick={fetchAwaitingEmails}>Retry</button>
            </>
          ) : (
            <>
              <p>{debouncedSearchTerm || filterPriority !== 'All' || filterDateRange !== 'All' ? 'No results with these filters.' : 'No emails awaiting assisted response.'}</p>
              <p className="subtitle">Low/Medium emails requiring a response will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="communications-list">
            {paginatedEmails.map((email, index) => (
              <div
                key={email._id}
                className="communication-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="comm-type-badge"
                  data-type={(email.source || 'outlook').toLowerCase()}
                >
                  <FontAwesomeIcon icon={email.source === 'whatsapp' ? faCommentDots : faEnvelope} />
                </div>
                <div className="comm-content">
                  <div className="comm-header-row">
                    <h3 className="comm-subject">{email.subject}</h3>
                  </div>
                  <div className="comm-meta">
                    <span className="comm-from">{email.sender?.email || "Unknown"}</span>
                    <span>•</span>
                    <span className="comm-date">
                      {new Date(email.receivedAt).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="comm-preview">
                    <AwaitingSummary summary={email.ai_analysis?.summary || email.content} />
                  </div>
                  <div className="comm-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="ai-tags">
                      <span
                        className="ai-tag priority"
                        data-priority={email.ai_analysis?.urgency || 'Medium'}
                        title="AI Urgency"
                      >
                        <FontAwesomeIcon icon={faClock} /> {email.ai_analysis?.urgency || 'Medium'}
                      </span>
                    </div>
                    <button
                      className="btn-reply"
                      onClick={() => {
                        if (email.aiGeneratedQuestions && email.aiGeneratedQuestions.length > 0) {
                          setSelectedEmail(email);
                          setQuestionnaireData({ questions: email.aiGeneratedQuestions });
                          setShowQuestionnaireModal(true);
                          setUserAnswers({});
                          setWizardStep('questions'); // Reset step
                          setGeneratedDraft(''); // Reset draft
                        } else {
                          handleGenerateQuestions(email);
                        }
                      }}
                      disabled={loading && !showQuestionnaireModal} // Désactiver pendant le chargement global
                    >
                      {/* Afficher un spinner spécifique si on est en train de charger pour CET email */}
                      {loading && selectedEmail?._id === email._id ? (
                        <>
                          <span className="spinner-small" style={{ marginRight: '8px' }}></span>
                          Loading...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faRobot} />
                          {email.aiGeneratedQuestions && email.aiGeneratedQuestions.length > 0
                            ? ' Continue'
                            : ' Assistant'}
                        </>
                      )}
                    </button>
                  </div>
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

      {/* Modal Questionnaire (Wizard) */}
      {showQuestionnaireModal && questionnaireData && (
        <div className="questionnaire-modal" onClick={() => setShowQuestionnaireModal(false)}>
          <div className="questionnaire-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="questionnaire-modal-header">
              <div>
                <h3>
                  <FontAwesomeIcon icon={faRobot} />{' '}
                  {wizardStep === 'questions' ? 'Contextual Questions' : 'Response Preview'}
                </h3>
                {wizardStep === 'questions' && (
                  <>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${((userAnswers ? Object.keys(userAnswers).length : 0) / questionnaireData.questions.length) * 100}%` }}
                      />
                    </div>
                    <span className="progress-text">{Object.keys(userAnswers).length} / {questionnaireData.questions.length} answered</span>
                  </>
                )}
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
                <strong>From:</strong> <span>{selectedEmail?.sender?.email}</span>
              </p>
            </div>

            {/* AI Summary Section - Added for Context */}
            <div className="reply-ai-summary" style={{ marginBottom: '24px' }}>
              <h4>
                <FontAwesomeIcon icon={faRobot} /> AI Summary
              </h4>
              <div className="ai-summary-content">
                {selectedEmail.ai_analysis?.summary || 'AI summary not available for this email.'}
              </div>
            </div>

            <div className="questionnaire-body">
              {wizardStep === 'questions' ? (
                // ÉTAPE 1: QUESTIONS
                questionnaireData.questions.map((question, index) => (
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
                          placeholder="Your answer..."
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
                        <option value="">-- Select --</option>
                        {question.options.map((option, optIndex) => (
                          <option key={optIndex} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))
              ) : (
                // ÉTAPE 2: PREVIEW
                <div className="reply-compose">
                  <label className="question-label">AI generated draft (editable)</label>
                  <textarea
                    value={generatedDraft}
                    onChange={(e) => setGeneratedDraft(e.target.value)}
                    rows={12}
                    className="text-input"
                  />
                </div>
              )}
            </div>

            <div className="questionnaire-footer">
              {wizardStep === 'questions' ? (
                <>
                  <button className="btn-cancel" onClick={() => setShowQuestionnaireModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn-submit-questionnaire"
                    onClick={handleGenerateDraft}
                    disabled={isGeneratingDraft}
                  >
                    {isGeneratingDraft ? (
                      <>
                        <span className="spinner-small" style={{ marginRight: '8px' }}></span>
                        Generating...
                      </>
                    ) : (
                      'Generate proposal'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-cancel" onClick={() => setWizardStep('questions')}>
                    ← Edit answers
                  </button>
                  <button
                    className="btn-submit-questionnaire"
                    onClick={handleSubmitQuestionnaire}
                    disabled={submitting}
                    style={{ background: '#10b981' }} // Vert pour l'envoi
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-small" style={{ marginRight: '8px' }}></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '8px' }} />
                        Send email
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: Auto Responses Tab (Historique des réponses auto) ---
const AutoResponsesTab = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('authToken');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [countPending, setCountPending] = useState(0);
  const [countSent, setCountSent] = useState(0);
  const [countAll, setCountAll] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All'); // Pending, Sent, All (Default: All)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchAutoCandidates();
  }, [debouncedSearchTerm, filterPriority, filterDateRange, filterStatus, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterPriority, filterDateRange, filterStatus]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const baseParams = new URLSearchParams();
        if (debouncedSearchTerm) baseParams.append('search', debouncedSearchTerm);
        if (filterPriority !== 'All') baseParams.append('priority', filterPriority);
        if (filterDateRange !== 'All') baseParams.append('dateRange', filterDateRange);
        baseParams.append('page', '1');
        baseParams.append('limit', '1');
        const p = new URLSearchParams(baseParams);
        p.append('status', 'Pending');
        const s = new URLSearchParams(baseParams);
        s.append('status', 'Sent');
        const a = new URLSearchParams(baseParams);
        a.append('status', 'All');
        const [resP, resS, resA] = await Promise.all([
          fetch(`${API_URL}/communications/auto-candidates?${p.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/communications/auto-candidates?${s.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/communications/auto-candidates?${a.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [jsonP, jsonS, jsonA] = await Promise.all([resP.json(), resS.json(), resA.json()]);
        setCountPending(jsonP?.pagination?.total || (jsonP?.data?.length || 0));
        setCountSent(jsonS?.pagination?.total || (jsonS?.data?.length || 0));
        setCountAll(jsonA?.pagination?.total || (jsonA?.data?.length || 0));
      } catch (e) {
        setCountPending(0);
        setCountSent(0);
        setCountAll(items.length);
      }
    };
    fetchCounts();
  }, [API_URL, token, debouncedSearchTerm, filterPriority, filterDateRange, items]);

  const fetchAutoCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterPriority !== 'All') params.append('priority', filterPriority);
      if (filterDateRange !== 'All') params.append('dateRange', filterDateRange);
      // Ajout du paramètre status pour filtrer côté backend
      if (filterStatus !== 'All') params.append('status', filterStatus);
      
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
      console.error('Error loading auto-responses:', e);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading auto-responses history...</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="escalation-dashboard-header">
        <div className="escalation-kpi-chips">
          <div className="kpi-chip">
            <span className="kpi-label">Pending</span>
            <span className="kpi-value">{countPending}</span>
          </div>
          <div className="kpi-chip">
            <span className="kpi-label">Sent</span>
            <span className="kpi-value">{countSent}</span>
          </div>
          <div className="kpi-chip">
            <span className="kpi-label">Total</span>
            <span className="kpi-value">{countAll}</span>
          </div>
        </div>
        <button
          type="button"
          className="escalation-info-badge"
          title="Eligible: sender is not no‑reply, priority is Low/Medium, AI indicates a reply is expected. Pending: ready for auto‑response; Sent: already auto‑responded. Filters apply."
        >
          <FontAwesomeIcon icon={faInfoCircle} />
        </button>
      </div>
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
            <label>Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="All">Any priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Time Period</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="All">All time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last7Days">Last 7 days</option>
              <option value="Last30Days">Last 30 days</option>
              <option value="ThisMonth">This month</option>
              <option value="LastMonth">Last month</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="All">All</option>
              <option value="Pending">Pending (Not Sent)</option>
              <option value="Sent">Sent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="communications-list">
        {items.length === 0 ? (
          <div className="empty-state">
            {error ? `Error: ${error}` : "No auto-responses found."}
          </div>
        ) : (
          items.map((comm) => (
            <div key={comm._id} className="communication-card">
              <div className="comm-type-badge" data-type={(comm.source || 'outlook').toLowerCase()}>
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <div className="comm-content">
                <div className="comm-header-row">
                  <h3 className="comm-subject">{comm.subject || "(No subject)"}</h3>
                </div>
                <div className="comm-meta">
                  <span className="comm-from">{comm.sender?.email || "Unknown"}</span>
                  <span>•</span>
                  <span className="comm-date">
                    {comm.receivedAt
                      ? new Date(comm.receivedAt).toLocaleDateString('en-US', {
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
                      title="AI Urgency"
                    >
                      {comm.ai_analysis?.urgency || 'Medium'}
                    </span>
                    {comm.hasAutoResponse ? (
                      <span className="ai-tag auto-response" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FontAwesomeIcon icon={faCheckCircle} /> Auto-Response Sent
                      </span>
                    ) : (
                      <span className="ai-tag awaiting-input" style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }}>
                         Pending
                      </span>
                    )}
                  </div>
                  {/* Read-only view, no actions */}
                </div>
              </div>
            </div>
          ))
        )}
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

  const renderContent = () => {
    switch (activeTab) {
      case "list":
        return <CommunicationListTab navigate={navigate} />;
      case "urgent":
        return <UrgentEmailsTab />;
      case "auto":
        return <AutoResponsesTab />;
      case "assisted":
        return <AssistedResponseTab />;
      case "escalation":
        return <EscalationDashboardTab navigate={navigate} />;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Communications Hub</h1>
        </div>

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
            <FontAwesomeIcon icon={faExclamationTriangle} /> To Reply
          </button>
          <button
            className={`tab-button ${activeTab === "assisted" ? "active" : ""}`}
            onClick={() => setActiveTab("assisted")}
          >
            <FontAwesomeIcon icon={faRobot} /> Assisted Responses
          </button>
          <button
            className={`tab-button ${activeTab === "auto" ? "active" : ""}`}
            onClick={() => setActiveTab("auto")}
          >
            <FontAwesomeIcon icon={faRobot} /> Auto Responses
          </button>
          <button
            className={`tab-button ${
              activeTab === "escalation" ? "active" : ""
            }`}
            onClick={() => setActiveTab("escalation")}
          >
            <FontAwesomeIcon icon={faChartLine} /> Escalation Dashboard
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}

export default Communications;
