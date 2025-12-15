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

// --- SUB-COMPONENT: Communications Search & Filters Page ---
const CommunicationListTab = ({ navigate }) => {
  const [allCommunications, setAllCommunications] = useState([]);
  const [filteredCommunications, setFilteredCommunications] = useState([]);
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
        if (searchTerm) params.append("search", searchTerm);

        // Paramètres de pagination
        params.append("page", currentPage.toString());
        params.append("limit", itemsPerPage.toString());

        // Communications API avec filtrage RBAC côté backend
        // ✅ FIX: Le bon endpoint est /auth/communications (voir server.js ligne 143)
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
    searchTerm,
    currentPage,
    itemsPerPage,
  ]);

  // Apply client-side filtering for date range
  useEffect(() => {
    let filtered = [...allCommunications];

    // Filter by date range
    if (filterDateRange !== "All") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((comm) => {
        const commDate = new Date(comm.date);

        switch (filterDateRange) {
          case "Today":
            return commDate >= today;
          case "Yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return commDate >= yesterday && commDate < today;
          case "Last7Days":
            const last7Days = new Date(today);
            last7Days.setDate(last7Days.getDate() - 7);
            return commDate >= last7Days;
          case "Last30Days":
            const last30Days = new Date(today);
            last30Days.setDate(last30Days.getDate() - 30);
            return commDate >= last30Days;
          case "ThisMonth":
            const thisMonthStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              1
            );
            return commDate >= thisMonthStart;
          case "LastMonth":
            const lastMonthStart = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              1
            );
            const lastMonthEnd = new Date(
              now.getFullYear(),
              now.getMonth(),
              0,
              23,
              59,
              59
            );
            return commDate >= lastMonthStart && commDate <= lastMonthEnd;
          default:
            return true;
        }
      });
    }

    setFilteredCommunications(filtered);

    // Update total items for pagination based on filtered results
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [allCommunications, filterDateRange, itemsPerPage]);

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

  // Get paginated communications for current page
  const paginatedCommunications = filteredCommunications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
