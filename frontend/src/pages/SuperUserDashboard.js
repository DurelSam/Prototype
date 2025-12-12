import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faMobileAlt,
  faRobot,
  faCog,
  faUsers,
  faChartBar,
  faCreditCard,
  faCommentDots,
  faArrowTrendUp,
  faUserCheck,
  faTachometerAlt,
  faMessage,
  faBell,
} from "@fortawesome/free-solid-svg-icons";

// Import des styles
import "../styles/Dashboard.css";
// Import des nouvelles animations
import "../animations/dashboardAnimations.css";

function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // --- Données (Identiques à votre fichier) ---
  const teamPerformanceData = [
    {
      name: "Sarah Johnson",
      summaries: 78,
      responseTime: 2.1,
      followUpRate: 82,
    },
    { name: "John Smith", summaries: 67, responseTime: 2.4, followUpRate: 88 },
    { name: "Emma Wilson", summaries: 92, responseTime: 1.8, followUpRate: 95 },
    {
      name: "Michael Brown",
      summaries: 54,
      responseTime: 3.2,
      followUpRate: 76,
    },
    {
      name: "Lisa Anderson",
      summaries: 81,
      responseTime: 2.0,
      followUpRate: 90,
    },
  ];

  const emailVolumeData = [
    { date: "Jan 1", count: 45 },
    { date: "Jan 2", count: 52 },
    { date: "Jan 3", count: 48 },
    { date: "Jan 4", count: 61 },
    { date: "Jan 5", count: 55 },
    { date: "Jan 6", count: 67 },
    { date: "Jan 7", count: 58 },
  ];

  const whatsappVolumeData = [
    { date: "Jan 1", count: 23 },
    { date: "Jan 2", count: 31 },
    { date: "Jan 3", count: 28 },
    { date: "Jan 4", count: 35 },
    { date: "Jan 5", count: 29 },
    { date: "Jan 6", count: 42 },
    { date: "Jan 7", count: 38 },
  ];

  const aiSummariesData = [
    { date: "Jan 1", auto: 38, manual: 7 },
    { date: "Jan 2", auto: 45, manual: 8 },
    { date: "Jan 3", auto: 41, manual: 7 },
    { date: "Jan 4", auto: 52, manual: 9 },
    { date: "Jan 5", auto: 48, manual: 7 },
    { date: "Jan 6", auto: 58, manual: 9 },
    { date: "Jan 7", auto: 51, manual: 7 },
  ];

  const productivityData = [
    { month: "Jul", efficiency: 72 },
    { month: "Aug", efficiency: 75 },
    { month: "Sep", efficiency: 78 },
    { month: "Oct", efficiency: 82 },
    { month: "Nov", efficiency: 85 },
    { month: "Dec", efficiency: 88 },
    { month: "Jan", efficiency: 92 },
  ];

  const homeKPIs = [
    {
      id: 1,
      title: "Emails Processed",
      value: "386",
      change: "+18%",
      icon: faEnvelope,
      color: "#3b82f6",
    },
    {
      id: 2,
      title: "WhatsApp Messages",
      value: "226",
      change: "+12%",
      icon: faCommentDots,
      color: "#14b8a6",
    },
    {
      id: 3,
      title: "AI Summaries",
      value: "403",
      change: "+23%",
      icon: faRobot,
      color: "#3b82f6",
    },
    {
      id: 4,
      title: "Active Users",
      value: teamPerformanceData.length.toString(),
      change: "+2",
      icon: faUserCheck,
      color: "#14b8a6",
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: "Connect Outlook",
      desc: "Sync your Outlook account",
      icon: faEnvelope,
      action: () => navigate("/integrations"),
      color: "#3b82f6",
    },
    {
      id: 2,
      title: "Connect WhatsApp",
      desc: "Integrate WhatsApp Business",
      icon: faMobileAlt,
      action: () => navigate("/integrations"),
      color: "#14b8a6",
    },
    {
      id: 3,
      title: "View Communications",
      desc: "See all your messages with AI analysis",
      icon: faRobot,
      action: () => navigate("/communications"),
      color: "#3b82f6",
    },
    {
      id: 4,
      title: "Settings",
      desc: "Configure your account",
      icon: faCog,
      action: () => navigate("/settings"),
      color: "#6b7280",
    },
  ];

  const managementActions = [
    {
      id: 1,
      title: "User Management",
      desc: "Manage team members and roles",
      icon: faUsers,
      action: () => navigate("/users"),
      color: "#3b82f6",
      show: user?.role === "Admin",
    },
    {
      id: 2,
      title: "Analytics",
      desc: "View insights and reports",
      icon: faChartBar,
      action: () => navigate("/analytics"),
      color: "#14b8a6",
    },
    {
      id: 3,
      title: "Subscription",
      desc: "Manage your plan and billing",
      icon: faCreditCard,
      action: () => navigate("/subscription"),
      color: "#14b8a6",
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-overlay"></div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-overlay"></div>

      <div className="dashboard-container">
        {/* Header - Apparition immédiate (Delay 1) */}
        <header className="dashboard-header animate-entry delay-1">
          <div className="header-left">
            <h1 className="app-title">SaaS Communications</h1>
            <span className="company-name">{user?.tenant?.companyName}</span>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.firstName?.[0]?.toUpperCase() ||
                  user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Welcome Section - Delay 2 */}
        <section className="welcome-section animate-entry delay-2">
          <div className="welcome-card">
            <h2 className="welcome-title">
              {greeting}, {user?.firstName || "User"}!
            </h2>
            <p className="welcome-text">
              Welcome to your communications management dashboard.
            </p>
          </div>
        </section>

        {/* Dashboard Tabs - Delay 3 */}
        <div className="dashboard-tabs animate-entry delay-3">
          <button
            className={`tab-button ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
          >
            <FontAwesomeIcon icon={faTachometerAlt} /> Home
          </button>
          <button
            className={`tab-button ${
              activeTab === "communications" ? "active" : ""
            }`}
            onClick={() => setActiveTab("communications")}
          >
            <FontAwesomeIcon icon={faMessage} /> Communications
          </button>
          <button
            className={`tab-button ${
              activeTab === "performance" ? "active" : ""
            }`}
            onClick={() => setActiveTab("performance")}
          >
            <FontAwesomeIcon icon={faChartBar} /> Team Performance
          </button>
        </div>

        {/* Home Dashboard */}
        {activeTab === "home" && (
          <div className="home-dashboard">
            {/* KPIs Grid - Delay 4 */}
            <section className="kpis-section animate-entry delay-4">
              <div className="kpis-grid">
                {homeKPIs.map((kpi) => (
                  <div key={kpi.id} className="kpi-card">
                    <div
                      className="kpi-icon"
                      style={{ backgroundColor: kpi.color }}
                    >
                      <FontAwesomeIcon icon={kpi.icon} />
                    </div>
                    <div className="kpi-content">
                      <h3 className="kpi-value">{kpi.value}</h3>
                      <p className="kpi-title">{kpi.title}</p>
                      <span className="kpi-change positive">{kpi.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions - Delay 5 */}
            <section className="actions-section animate-entry delay-5">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faBell} /> Quick Actions
              </h3>
              <div className="action-cards">
                {quickActions.map((action) => (
                  <div key={action.id} className="action-card">
                    <div
                      className="action-icon"
                      style={{ color: action.color }}
                    >
                      <FontAwesomeIcon icon={action.icon} />
                    </div>
                    <h4>{action.title}</h4>
                    <p>{action.desc}</p>
                    <button className="action-button" onClick={action.action}>
                      Go to {action.title.split(" ")[0]}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Management Section - Delay 6 */}
            <section className="actions-section animate-entry delay-6">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faUsers} /> Management
              </h3>
              <div className="action-cards">
                {managementActions
                  .filter((action) => action.show !== false)
                  .map((action) => (
                    <div key={action.id} className="action-card">
                      <div
                        className="action-icon"
                        style={{ color: action.color }}
                      >
                        <FontAwesomeIcon icon={action.icon} />
                      </div>
                      <h4>{action.title}</h4>
                      <p>{action.desc}</p>
                      <button className="action-button" onClick={action.action}>
                        Manage {action.title.split(" ")[0]}
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}

        {/* Communications Dashboard */}
        {activeTab === "communications" && (
          <div className="communications-dashboard">
            <section className="communications-stats-section animate-entry delay-4">
              <div className="comm-stat-card">
                <div className="stat-icon email">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Total Emails (7 days)</p>
                  <h3 className="stat-number-large">386</h3>
                  <span className="stat-change positive">
                    +18% from last week
                  </span>
                </div>
              </div>
              <div className="comm-stat-card">
                <div className="stat-icon whatsapp">
                  <FontAwesomeIcon icon={faCommentDots} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">WhatsApp Messages (7 days)</p>
                  <h3 className="stat-number-large">226</h3>
                  <span className="stat-change positive">
                    +12% from last week
                  </span>
                </div>
              </div>
              <div className="comm-stat-card">
                <div className="stat-icon ai">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">AI Summaries Generated</p>
                  <h3 className="stat-number-large">403</h3>
                  <span className="stat-change positive">
                    +23% from last week
                  </span>
                </div>
              </div>
              <div className="comm-stat-card">
                <div className="stat-icon productivity">
                  <FontAwesomeIcon icon={faArrowTrendUp} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Team Efficiency</p>
                  <h3 className="stat-number-large">92%</h3>
                  <span className="stat-change positive">
                    +7% from last month
                  </span>
                </div>
              </div>
            </section>

            {/* Charts Section - Delay 5 */}
            <section className="charts-section animate-entry delay-5">
              <div className="chart-card">
                <h3>
                  <FontAwesomeIcon icon={faEnvelope} /> Email Volume Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={emailVolumeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>
                  <FontAwesomeIcon icon={faCommentDots} /> WhatsApp Volume Over
                  Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={whatsappVolumeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>
                  <FontAwesomeIcon icon={faRobot} /> AI Summaries Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aiSummariesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="auto"
                      stackId="a"
                      fill="#14b8a6"
                      radius={[0, 0, 0, 0]}
                      name="Auto-Generated"
                      animationDuration={2000}
                    />
                    <Bar
                      dataKey="manual"
                      stackId="a"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                      name="Manual"
                      animationDuration={2000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>
                  <FontAwesomeIcon icon={faArrowTrendUp} /> Team Productivity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productivityData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}

        {/* Team Performance Dashboard */}
        {activeTab === "performance" && (
          <div className="performance-dashboard">
            <section className="performance-stats-section animate-entry delay-4">
              <div className="performance-stat-card">
                <div className="stat-content">
                  <p className="stat-label">Total Summaries</p>
                  <h3 className="stat-number-large">372</h3>
                  <span className="stat-change positive">
                    +12% from last week
                  </span>
                </div>
              </div>
              <div className="performance-stat-card">
                <div className="stat-content">
                  <p className="stat-label">Average Response Time</p>
                  <h3 className="stat-number-large">2.3h</h3>
                  <span className="stat-change negative">
                    +0.2h from last week
                  </span>
                </div>
              </div>
              <div className="performance-stat-card">
                <div className="stat-content">
                  <p className="stat-label">On-Time Follow-Ups</p>
                  <h3 className="stat-number-large">86%</h3>
                  <span className="stat-change positive">
                    +4% from last week
                  </span>
                </div>
              </div>
            </section>

            <section className="charts-section animate-entry delay-5">
              <div className="chart-card">
                <h3>Team Progress - Total Summaries</h3>
                <div className="team-progress-bars">
                  {teamPerformanceData.map((member, index) => (
                    <div key={index} className="progress-item">
                      <div className="progress-label">
                        <span className="member-name">{member.name}</span>
                        <span className="member-count">{member.summaries}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${(member.summaries / 100) * 100}%`,
                            transitionDelay: `${index * 0.1}s`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>Performance Metrics</h3>
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Team Member</th>
                      <th>Response Time</th>
                      <th>Follow-Up Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformanceData.map((member, index) => (
                      <tr key={index}>
                        <td>{member.name}</td>
                        <td>{member.responseTime}h</td>
                        <td>
                          <span
                            className={`follow-up-rate ${
                              member.followUpRate >= 85
                                ? "high"
                                : member.followUpRate >= 70
                                ? "medium"
                                : "low"
                            }`}
                          >
                            {member.followUpRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Subscription Info - Delay 6 */}
        <section className="subscription-section animate-entry delay-6">
          <div className="subscription-card">
            <div className="subscription-header">
              <h3>Subscription</h3>
              <span
                className={`subscription-badge ${user?.tenant?.subscriptionStatus?.toLowerCase()}`}
              >
                {user?.tenant?.subscriptionStatus || "Trial"}
              </span>
            </div>
            <p className="subscription-text">
              Your account is currently on a trial period.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
