import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faFilePdf,
  faFileCsv,
  faCalendarAlt,
  faSyncAlt,
  faChevronLeft,
  faPaperPlane,
  faBell,
  faCog,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/Dashboard.css";
import "../animations/dashboardAnimations.css";
import "../styles/Analytics.css";

function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week"); // week|month|quarter|year
  const [channel, setChannel] = useState("all"); // all|email|whatsapp
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("reports"); // reports | scheduled
  const [scheduledRules, setScheduledRules] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Mock analytics data (keeps same structure as provided)
    const mockData = {
      overview: {
        totalCommunications: 1247,
        emailCount: 834,
        whatsappCount: 413,
        averageResponseTime: "2.4 hours",
        aiAnalysisCount: 1247,
        actionItemsGenerated: 389,
      },
      sentiment: { positive: 65, neutral: 28, negative: 7 },
      priority: { high: 15, medium: 42, low: 43 },
      communicationsByDay: [
        { day: "Mon", emails: 45, whatsapp: 23 },
        { day: "Tue", emails: 52, whatsapp: 28 },
        { day: "Wed", emails: 48, whatsapp: 31 },
        { day: "Thu", emails: 55, whatsapp: 26 },
        { day: "Fri", emails: 61, whatsapp: 34 },
        { day: "Sat", emails: 28, whatsapp: 18 },
        { day: "Sun", emails: 22, whatsapp: 15 },
      ],
      topSenders: [
        { name: "john.doe@company.com", count: 87, type: "email" },
        { name: "jane.smith@company.com", count: 64, type: "email" },
        { name: "+1234567890", count: 52, type: "whatsapp" },
        { name: "mike.johnson@company.com", count: 48, type: "email" },
        { name: "+0987654321", count: 41, type: "whatsapp" },
      ],
      actionItemsStatus: { completed: 245, inProgress: 98, pending: 46 },
      trends: {
        communicationsGrowth: "+12%",
        averageResponseImprovement: "-18%",
        aiAccuracy: "94%",
      },
    };

    // Mock scheduled rules
    const mockRules = [
      {
        id: 1,
        name: "Daily CEO Summary",
        cadence: "daily",
        enabled: true,
        targets: ["ceo@company.com"],
      },
      {
        id: 2,
        name: "Weekly Team Overview",
        cadence: "weekly",
        enabled: false,
        targets: ["managers@company.com"],
      },
    ];

    setTimeout(() => {
      setData(mockData);
      setScheduledRules(mockRules);
      setLoading(false);
    }, 300);
  }, [period]);

  const handleBack = () => navigate("/dashboard");

  const handleExport = (format = "pdf") => {
    // placeholder export: prepare payload based on current filters
    const payload = {
      period,
      channel,
      format,
      generatedAt: new Date().toISOString(),
    };
    // TODO: call backend export endpoint, stream file, etc.
    alert(
      `Preparing ${format.toUpperCase()} export — payload:\n` +
        JSON.stringify(payload, null, 2)
    );
  };

  const toggleRule = (id) => {
    setScheduledRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    // TODO: persist change to backend
  };

  const createRule = () => {
    setCreating(true);
    const newRule = {
      id: Date.now(),
      name: "New Auto-Report",
      cadence: "daily",
      enabled: true,
      targets: ["ops@company.com"],
    };
    setTimeout(() => {
      setScheduledRules((prev) => [newRule, ...prev]);
      setCreating(false);
    }, 350);
  };

  if (loading || !data) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  // compute max for chart-like bars
  const maxCommValue = Math.max(
    ...data.communicationsByDay.map((d) => d.emails + d.whatsapp)
  );

  return (
    <div className="analytics-page">
      <div className="page-header animate-entry delay-1">
        <button className="back-button" onClick={handleBack}>
          <FontAwesomeIcon icon={faChevronLeft} /> Back
        </button>
        <div className="header-content">
          <h1 className="page-title">Analytics & Reporting</h1>
          <div className="header-actions">
            <div className="filter-row">
              <label className="small-label">
                Date range
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="select-input"
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">Last Year</option>
                </select>
              </label>

              <label className="small-label">
                Channel
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="select-input"
                >
                  <option value="all">All</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>

              <div className="export-buttons">
                <button
                  className="export-button small"
                  onClick={() => handleExport("pdf")}
                >
                  <FontAwesomeIcon icon={faFilePdf} /> Export PDF
                </button>
                <button
                  className="export-button small light"
                  onClick={() => handleExport("csv")}
                >
                  <FontAwesomeIcon icon={faFileCsv} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs animate-entry delay-2">
        <button
          className={`tab-button ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <FontAwesomeIcon icon={faChartBar} /> Reports
        </button>
        <button
          className={`tab-button ${activeTab === "scheduled" ? "active" : ""}`}
          onClick={() => setActiveTab("scheduled")}
        >
          <FontAwesomeIcon icon={faCalendarAlt} /> Scheduled Reports
        </button>
      </div>

      <div className="analytics-container">
        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="reports-view animate-entry delay-3">
            <section className="overview-section">
              <div className="stat-card">
                <div className="stat-icon email">
                  <FontAwesomeIcon icon={faPaperPlane} />
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">
                    {data.overview.totalCommunications}
                  </h3>
                  <p className="stat-label">Total Communications</p>
                  <span className="stat-trend positive">
                    {data.trends.communicationsGrowth}
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faBell} />
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{data.overview.emailCount}</h3>
                  <p className="stat-label">Emails</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon whatsapp">
                  <FontAwesomeIcon icon={faSyncAlt} />
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{data.overview.whatsappCount}</h3>
                  <p className="stat-label">WhatsApp</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon ai">
                  <FontAwesomeIcon icon={faCog} />
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">
                    {data.overview.aiAnalysisCount}
                  </h3>
                  <p className="stat-label">AI Analyses</p>
                  <span className="stat-accuracy">
                    {data.trends.aiAccuracy} accurate
                  </span>
                </div>
              </div>
            </section>

            <section className="charts-grid">
              <div className="chart-card">
                <h3 className="chart-title">Communications by Day</h3>
                <div className="bar-chart">
                  {data.communicationsByDay.map((day, idx) => (
                    <div key={idx} className="bar-group">
                      <div className="bars">
                        <div
                          className="bar email-bar"
                          style={{
                            height: `${
                              ((channel === "whatsapp" ? 0 : day.emails) /
                                maxCommValue) *
                              100
                            }%`,
                          }}
                          title={`Emails: ${day.emails}`}
                        />
                        <div
                          className="bar whatsapp-bar"
                          style={{
                            height: `${
                              ((channel === "email" ? 0 : day.whatsapp) /
                                maxCommValue) *
                              100
                            }%`,
                          }}
                          title={`WhatsApp: ${day.whatsapp}`}
                        />
                      </div>
                      <span className="bar-label">{day.day}</span>
                    </div>
                  ))}
                </div>

                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color email" /> Emails
                  </div>
                  <div className="legend-item">
                    <span className="legend-color whatsapp" /> WhatsApp
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <h3 className="chart-title">Top Senders</h3>
                <div className="senders-table small">
                  {data.topSenders.map((s, i) => (
                    <div className="sender-row" key={i}>
                      <div className="sender-rank">#{i + 1}</div>
                      <div className="sender-info">
                        <span className="sender-name">{s.name}</span>
                        <span className={`sender-type ${s.type}`}>
                          {s.type}
                        </span>
                      </div>
                      <div className="sender-count">{s.count} msgs</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3 className="chart-title">Action Items Status</h3>
                <div className="horizontal-bars">
                  <div className="horizontal-bar-item">
                    <div className="bar-info">
                      <span className="bar-name">Completed</span>
                      <span className="bar-value">
                        {data.actionItemsStatus.completed}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill completed"
                        style={{
                          width: `${
                            (data.actionItemsStatus.completed /
                              (data.actionItemsStatus.completed +
                                data.actionItemsStatus.inProgress +
                                data.actionItemsStatus.pending)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="horizontal-bar-item">
                    <div className="bar-info">
                      <span className="bar-name">In Progress</span>
                      <span className="bar-value">
                        {data.actionItemsStatus.inProgress}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill in-progress"
                        style={{
                          width: `${
                            (data.actionItemsStatus.inProgress /
                              (data.actionItemsStatus.completed +
                                data.actionItemsStatus.inProgress +
                                data.actionItemsStatus.pending)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="horizontal-bar-item">
                    <div className="bar-info">
                      <span className="bar-name">Pending</span>
                      <span className="bar-value">
                        {data.actionItemsStatus.pending}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill pending"
                        style={{
                          width: `${
                            (data.actionItemsStatus.pending /
                              (data.actionItemsStatus.completed +
                                data.actionItemsStatus.inProgress +
                                data.actionItemsStatus.pending)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="insights-section">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faChartBar} /> Key Insights
              </h3>
              <div className="insights-grid">
                <div className="insight-card">
                  <div className="insight-icon">📈</div>
                  <div className="insight-content">
                    <h4>Communication Volume</h4>
                    <p>
                      This period:{" "}
                      <strong>{data.overview.totalCommunications}</strong>.
                      Growth:{" "}
                      <strong>{data.trends.communicationsGrowth}</strong>.
                    </p>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-icon">😊</div>
                  <div className="insight-content">
                    <h4>Positive Sentiment</h4>
                    <p>
                      <strong>{data.sentiment.positive}%</strong> positive
                      communications.
                    </p>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-icon">⚡</div>
                  <div className="insight-content">
                    <h4>Response Time</h4>
                    <p>
                      Avg: <strong>{data.overview.averageResponseTime}</strong>{" "}
                      ({data.trends.averageResponseImprovement}).
                    </p>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-icon">🎯</div>
                  <div className="insight-content">
                    <h4>AI Accuracy</h4>
                    <p>
                      <strong>{data.trends.aiAccuracy}</strong> accuracy on
                      analyses.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === "scheduled" && (
          <div className="scheduled-view animate-entry delay-3">
            <div className="scheduled-header">
              <h3>Scheduled Reports</h3>
              <div className="scheduled-actions">
                <button
                  className="action-button small ghost"
                  onClick={createRule}
                  disabled={creating}
                >
                  <FontAwesomeIcon icon={faCirclePlus} />{" "}
                  {creating ? "Creating..." : "NEW → Generate"}
                </button>
                <button
                  className="export-button small"
                  onClick={() => alert("Run all scheduled now (stub)")}
                >
                  <FontAwesomeIcon icon={faPaperPlane} /> Run Now
                </button>
              </div>
            </div>

            <div className="scheduled-list">
              {scheduledRules.length === 0 && (
                <p className="muted">No scheduled reports yet.</p>
              )}
              {scheduledRules.map((rule) => (
                <div key={rule.id} className="scheduled-row">
                  <div className="scheduled-info">
                    <div className="scheduled-title">{rule.name}</div>
                    <div className="scheduled-meta">
                      {rule.cadence} • {rule.targets.join(", ")}
                    </div>
                  </div>
                  <div className="scheduled-controls">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                      />
                      <span className="slider" />
                    </label>
                    <button
                      className="ghost small"
                      onClick={() => alert("Edit rule (stub)")}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="scheduled-info-cards">
              <div className="card-mini">
                <h4>Daily / Weekly CEO summaries</h4>
                <p>
                  Auto emails that summarize top KPIs and action items to the
                  executive inbox.
                </p>
              </div>
              <div className="card-mini">
                <h4>Auto-report rules</h4>
                <p>
                  Create rules to trigger reports by channel, keyword, or SLA
                  breaches.
                </p>
              </div>
              <div className="card-mini">
                <h4>Delivery</h4>
                <p>
                  Reports can be delivered via email (PDF/CSV) or pushed to
                  3rd-party endpoints (webhooks).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
