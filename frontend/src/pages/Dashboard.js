import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import Axios
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
  PieChart, // Nouveau
  Pie, // Nouveau
  Cell, // Nouveau
  Legend, // Nouveau
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
  const { user, loading, isUpperAdmin, isAdmin, isEmployee, isAdminOrAbove } = useAuth();
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

  // --- Stats Dynamiques ---
  const [stats, setStats] = useState({
    emailsProcessed: 0,
    whatsappMessages: 0,
    aiSummaries: 0,
    workload: { pendingAuto: 0, pendingManual: 0, pendingAssisted: 0, pendingNoResponse: 0 },
    charts: [], // Nouveau champ pour les graphiques historiques
    loading: true
  });
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    loading: true,
  });
  const [adminsPerf, setAdminsPerf] = useState({
    overall: { totalSummaries: 0, avgResponseTimeHours: 0, onTimeFollowUpRate: 0, productivity: [] },
    members: [],
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Correction de la clé (authToken vs token)
        console.log("DEBUG DASHBOARD - Token envoyé:", token ? token.substring(0, 20) + "..." : "NULL");
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        console.log("Fetching dashboard stats from:", `${API_URL}/communications/stats/dashboard`);
        
        const response = await axios.get(`${API_URL}/communications/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Dashboard stats response:", response.data);
        if (response.data?.data?.charts) {
          console.log("Charts[0..4]:", response.data.data.charts.slice(0, 5));
        }
        // alert(`DEBUG: Emails Processed du Backend: ${response.data.data.emailsProcessed}`); // Décommentez pour tester si besoin

        if (response.data.success) {
          setStats({ ...response.data.data, loading: false });
        }
      } catch (error) {
        console.error("Erreur chargement stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res1 = await axios.get(`${API_URL}/communications/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res1.data?.success) {
          setStats({ ...res1.data.data, loading: false });
        }
        if (isAdmin || isUpperAdmin) {
          const res2 = await axios.get(`${API_URL}/users/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res2.data?.success) {
            setUserStats({ ...res2.data.data, loading: false });
          }
        }
      } catch (e) {
        // no-op
      }
    }, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [isAdmin, isUpperAdmin]);

  useEffect(() => {
    const fetchAdminsPerf = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${API_URL}/analytics/admins/performance?days=30`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setAdminsPerf({ ...res.data.data, loading: false });
        } else {
          setAdminsPerf((p) => ({ ...p, loading: false }));
        }
      } catch (e) {
        setAdminsPerf((p) => ({ ...p, loading: false }));
      }
    };
    if (activeTab === 'performance' && (isAdminOrAbove)) {
      fetchAdminsPerf();
    }
  }, [activeTab, isAdminOrAbove]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${API_URL}/users/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setUserStats({ ...res.data.data, loading: false });
        } else {
          setUserStats((prev) => ({ ...prev, loading: false }));
        }
      } catch (e) {
        setUserStats((prev) => ({ ...prev, loading: false }));
      }
    };
    // Charger seulement pour Admin ou UpperAdmin
    if (isAdmin || isUpperAdmin) {
      fetchUserStats();
    }
  }, [isAdmin, isUpperAdmin]);

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

  // Données dynamiques pour les graphiques (30 jours)
  const emailVolumeData = stats.charts?.map(d => ({ date: d.date, count: d.emails })) || [];
  if (stats.charts && stats.charts.length) {
    console.log("EmailVolume mapped sample:", emailVolumeData.slice(0, 5));
  }
  const whatsappVolumeData = stats.charts?.map(d => ({ date: d.date, count: d.whatsapp })) || [];
  const aiSummariesData = stats.charts || []; // Déjà formaté avec date, auto, manual

  const productivityData = [
    { month: "Jul", efficiency: 72 },
    { month: "Aug", efficiency: 75 },
    { month: "Sep", efficiency: 78 },
    { month: "Oct", efficiency: 82 },
    { month: "Nov", efficiency: 85 },
    { month: "Dec", efficiency: 88 },
    { month: "Jan", efficiency: 92 },
  ];

  // Données dynamiques pour la répartition de la charge de travail
  const workloadDistributionData = [
    { name: 'Ready Responses (Auto)', value: stats.workload?.pendingAuto || 0, color: '#3b82f6' },
    { name: 'Awaiting Context', value: stats.workload?.pendingAssisted || 0, color: '#8b5cf6' },
    { name: 'Urgent / Manual', value: stats.workload?.pendingManual || 0, color: '#ef4444' },
    { name: 'No Response Required', value: stats.workload?.pendingNoResponse || 0, color: '#9ca3af' },
  ];

  const homeKPIs = (() => {
    const epChange = stats?.change?.emailsProcessed ?? 0;
    const waChange = stats?.change?.whatsappMessages ?? 0;
    const aiChange = stats?.change?.aiSummaries ?? 0;
    const fmt = (n) => `${n > 0 ? "+" : ""}${n}%`;
    const base = [
      {
        id: 1,
        title: "Emails Processed",
        value: stats.loading ? "..." : stats.emailsProcessed.toString(),
        changeText: stats.loading ? "..." : fmt(epChange),
        isPositive: epChange >= 0,
        icon: faEnvelope,
        color: "#3b82f6",
      },
      {
        id: 2,
        title: "WhatsApp Messages",
        value: stats.loading ? "..." : stats.whatsappMessages.toString(),
        changeText: stats.loading ? "..." : fmt(waChange),
        isPositive: waChange >= 0,
        icon: faCommentDots,
        color: "#14b8a6",
      },
      {
        id: 3,
        title: "AI Summaries",
        value: stats.loading ? "..." : stats.aiSummaries.toString(),
        changeText: stats.loading ? "..." : fmt(aiChange),
        isPositive: aiChange >= 0,
        icon: faRobot,
        color: "#3b82f6",
      },
    ];
    if (isUpperAdmin) {
      base.push({
        id: 4,
        title: "Tenant Users",
        value: userStats.loading ? "..." : (userStats.totalUsers || 0).toString(),
        changeText: "+0",
        isPositive: true,
        icon: faUserCheck,
        color: "#14b8a6",
      });
    } else if (isAdmin) {
      base.push({
        id: 4,
        title: "Users (me + employees)",
        value: userStats.loading ? "..." : ((userStats.totalEmployees || 0) + 1).toString(),
        changeText: "+0",
        isPositive: true,
        icon: faUserCheck,
        color: "#14b8a6",
      });
    }
    return base;
  })();

  const quickActions = [
    {
      id: 1,
      title: "Connect Email",
      desc: "Sync your Email account",
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
      desc: "Browse messages with AI analysis",
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
      title: "Manage Admins",
      desc: "Create and manage Administrators",
      icon: faUsers,
      action: () => navigate("/admins"),
      color: "#3b82f6",
      show: isUpperAdmin,
    },
    {
      id: 2,
      title: "Manage Employees",
      desc: "Create and manage Employees",
      icon: faUsers,
      action: () => navigate("/employees"),
      color: "#3b82f6",
      show: isAdmin,
    },
    {
      id: 3,
      title: "Analytics",
      desc: "View statistics and reports",
      icon: faChartBar,
      action: () => navigate("/analytics"),
      color: "#14b8a6",
      show: isAdminOrAbove,
    },
    {
      id: 4,
      title: "Subscription",
      desc: "Manage your plan and billing",
      icon: faCreditCard,
      action: () => navigate("/subscription"),
      color: "#14b8a6",
      show: isUpperAdmin,
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
        {/* Welcome Section - Delay 1 (header removed, moved to Layout) */}
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
              activeTab === "activity" ? "active" : ""
            }`}
            onClick={() => setActiveTab("activity")}
          >
            <FontAwesomeIcon icon={faArrowTrendUp} /> Activity
          </button>
          {/* Only show Team Performance for Admins and UpperAdmins */}
          {isAdminOrAbove && (
            <button
              className={`tab-button ${
                activeTab === "performance" ? "active" : ""
              }`}
              onClick={() => setActiveTab("performance")}
            >
              <FontAwesomeIcon icon={faChartBar} /> {isUpperAdmin ? "Admin Performance" : "Employee Performance"}
            </button>
          )}
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
                      <span className={`kpi-change ${kpi.isPositive ? "positive" : "negative"}`}>{kpi.changeText || kpi.change}</span>
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

            {/* Management Section - Delay 6 - Only show if there are visible actions */}
            {managementActions.filter((action) => action.show !== false).length > 0 && (
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
                          Accéder
                        </button>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Activity Dashboard (Renamed from Communications) */}
        {activeTab === "activity" && (
          <div className="communications-dashboard">
            {/* REMOVED: Redundant Stats Section */}

            {/* Charts Section - Delay 5 */}
            <section className="charts-section animate-entry delay-5">
              {/* Workload Distribution */}
              <div className="chart-card">
                <h3>Emails to Process by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workloadDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {workloadDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151", color: "#f3f4f6" }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

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
                  <h3 className="stat-number-large">{adminsPerf.loading ? '...' : adminsPerf.overall.totalSummaries}</h3>
                  <span className="stat-change positive"> </span>
                </div>
              </div>
              <div className="performance-stat-card">
                <div className="stat-content">
                  <p className="stat-label">Average Response Time</p>
                  <h3 className="stat-number-large">{adminsPerf.loading ? '...' : `${adminsPerf.overall.avgResponseTimeHours}h`}</h3>
                  <span className="stat-change negative"> </span>
                </div>
              </div>
              <div className="performance-stat-card">
                <div className="stat-content">
                  <p className="stat-label">On-Time Follow-Ups</p>
                  <h3 className="stat-number-large">{adminsPerf.loading ? '...' : `${adminsPerf.overall.onTimeFollowUpRate}%`}</h3>
                  <span className="stat-change positive"> </span>
                </div>
              </div>
            </section>

            <section className="charts-section animate-entry delay-5">
              <div className="chart-card">
                <h3>
                  <FontAwesomeIcon icon={faArrowTrendUp} /> Team Productivity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={adminsPerf.loading ? [] : adminsPerf.overall.productivity}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
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

              <div className="chart-card">
                <h3>Team Progress - Total Summaries</h3>
                <div className="team-progress-bars">
                  {(adminsPerf.loading ? [] : adminsPerf.members).map((member, index) => (
                    <div key={index} className="progress-item">
                      <div className="progress-label">
                        <span className="member-name">{member.name}</span>
                        <span className="member-count">{member.totals?.aiSummariesCount || 0}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, (member.totals?.aiSummariesCount || 0))}%`,
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
                    {(adminsPerf.loading ? [] : adminsPerf.members).map((member, index) => (
                      <tr key={index}>
                        <td>{member.name}</td>
                        <td>{member.avgResponseTimeHours}h</td>
                        <td>
                          <span
                            className={`follow-up-rate ${
                              (member.onTimeFollowUpRate || 0) >= 85
                                ? "high"
                                : (member.onTimeFollowUpRate || 0) >= 70
                                ? "medium"
                                : "low"
                            }`}
                          >
                            {member.onTimeFollowUpRate}%
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

        {/* Subscription Info - Delay 6 - Only for UpperAdmin */}
        {isUpperAdmin && (
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
                Your account is currently in trial period.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
