/* src/pages/Communications.js */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
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

// --- SUB-COMPONENT: Communications Search & Filters Page ---
const CommunicationListTab = ({ navigate }) => {
  const [communications, setCommunications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // API Configuration
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("authToken");

  // Fetch communications from API
  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        setLoading(true);

        // Construire les paramètres de requête
        const params = new URLSearchParams();
        if (filterType !== "All") params.append("source", filterType);
        if (filterPriority !== "All") params.append("priority", filterPriority);
        if (searchTerm) params.append("search", searchTerm);
        params.append("limit", "100"); // Récupérer 100 communications max

        // CORRECTION URL: Ajout de /auth/ pour correspondre à server.js
        const response = await fetch(
          `${API_URL}/auth/communications?${params.toString()}`,
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
            aiAnalysis: {
              sentiment: comm.ai_analysis?.sentiment || "Pending",
              priority: comm.ai_analysis?.urgency || "Medium",
            },
          }));

          setCommunications(mappedData);
        }
      } catch (error) {
        console.error("Error fetching communications:", error);
        setCommunications([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCommunications();
    }
  }, [API_URL, token, filterType, filterPriority, searchTerm]);

  const handleCommunicationClick = (id) => navigate(`/communications/${id}`);

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
        <div className="search-box">
          <span className="search-icon">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          <input
            type="text"
            placeholder="Search Subject, Sender, or Content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
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

          <button
            className="advanced-filters-toggle"
            style={{
              marginLeft: "auto",
              padding: "0.6rem 1.2rem",
              borderRadius: "6px",
              border: "1px solid #3b82f6",
              background: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? (
              <>
                <FontAwesomeIcon icon={faTimes} /> Hide
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSearch} /> Advanced
              </>
            )}
          </button>
        </div>

        {showAdvancedFilters && (
          <p style={{ color: "#9ca3af", marginTop: "1rem" }}>
            * Advanced filtering options here (Date, Employee, Status) *
          </p>
        )}
      </div>

      <div className="communications-list">
        {communications.length === 0 ? (
          <div className="empty-state">No signals detected.</div>
        ) : (
          communications.map((comm, index) => (
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
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT: Communication Center ---
function Communications() {
  const navigate = useNavigate();
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
            className={`tab-button ${
              activeTab === "escalation" ? "active" : ""
            }`}
            onClick={() => setActiveTab("escalation")}
          >
            <FontAwesomeIcon icon={faChartLine} /> Escalation Dashboard (CEO
            View)
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}

export default Communications;
