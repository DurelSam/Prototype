import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Analytics.css';

function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week'); // 'week', 'month', 'quarter', 'year'
  const [data, setData] = useState(null);

  useEffect(() => {
    // Mock analytics data
    const mockData = {
      overview: {
        totalCommunications: 1247,
        emailCount: 834,
        whatsappCount: 413,
        averageResponseTime: '2.4 hours',
        aiAnalysisCount: 1247,
        actionItemsGenerated: 389
      },
      sentiment: {
        positive: 65,
        neutral: 28,
        negative: 7
      },
      priority: {
        high: 15,
        medium: 42,
        low: 43
      },
      communicationsByDay: [
        { day: 'Mon', emails: 45, whatsapp: 23 },
        { day: 'Tue', emails: 52, whatsapp: 28 },
        { day: 'Wed', emails: 48, whatsapp: 31 },
        { day: 'Thu', emails: 55, whatsapp: 26 },
        { day: 'Fri', emails: 61, whatsapp: 34 },
        { day: 'Sat', emails: 28, whatsapp: 18 },
        { day: 'Sun', emails: 22, whatsapp: 15 }
      ],
      topSenders: [
        { name: 'john.doe@company.com', count: 87, type: 'email' },
        { name: 'jane.smith@company.com', count: 64, type: 'email' },
        { name: '+1234567890', count: 52, type: 'whatsapp' },
        { name: 'mike.johnson@company.com', count: 48, type: 'email' },
        { name: '+0987654321', count: 41, type: 'whatsapp' }
      ],
      actionItemsStatus: {
        completed: 245,
        inProgress: 98,
        pending: 46
      },
      trends: {
        communicationsGrowth: '+12%',
        averageResponseImprovement: '-18%',
        aiAccuracy: '94%'
      }
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
  }, [period]);

  const handleExportReport = () => {
    // TODO: Implement PDF/CSV export
    alert('Exporting report... (Feature coming soon)');
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const maxCommValue = Math.max(
    ...data.communicationsByDay.map(d => d.emails + d.whatsapp)
  );

  return (
    <div className="analytics-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h1 className="page-title">Analytics & Reports</h1>
          <div className="header-actions">
            <select
              className="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
            <button className="export-button" onClick={handleExportReport}>
              📊 Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="analytics-container">
        {/* Overview Cards */}
        <div className="overview-section">
          <div className="stat-card">
            <div className="stat-icon">📨</div>
            <div className="stat-content">
              <h3 className="stat-number">{data.overview.totalCommunications}</h3>
              <p className="stat-label">Total Communications</p>
              <span className="stat-trend positive">{data.trends.communicationsGrowth}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <h3 className="stat-number">{data.overview.emailCount}</h3>
              <p className="stat-label">Emails</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3 className="stat-number">{data.overview.whatsappCount}</h3>
              <p className="stat-label">WhatsApp Messages</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3 className="stat-number">{data.overview.averageResponseTime}</h3>
              <p className="stat-label">Avg Response Time</p>
              <span className="stat-trend positive">{data.trends.averageResponseImprovement}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-content">
              <h3 className="stat-number">{data.overview.aiAnalysisCount}</h3>
              <p className="stat-label">AI Analyses</p>
              <span className="stat-accuracy">{data.trends.aiAccuracy} accurate</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-number">{data.overview.actionItemsGenerated}</h3>
              <p className="stat-label">Action Items</p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Communications by Day Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Communications by Day</h3>
            <div className="bar-chart">
              {data.communicationsByDay.map((day, index) => (
                <div key={index} className="bar-group">
                  <div className="bars">
                    <div
                      className="bar email-bar"
                      style={{
                        height: `${(day.emails / maxCommValue) * 100}%`
                      }}
                      title={`Emails: ${day.emails}`}
                    ></div>
                    <div
                      className="bar whatsapp-bar"
                      style={{
                        height: `${(day.whatsapp / maxCommValue) * 100}%`
                      }}
                      title={`WhatsApp: ${day.whatsapp}`}
                    ></div>
                  </div>
                  <span className="bar-label">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color email"></span>
                <span>Emails</span>
              </div>
              <div className="legend-item">
                <span className="legend-color whatsapp"></span>
                <span>WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">Sentiment Distribution</h3>
            <div className="pie-chart-container">
              <div className="pie-chart">
                <div
                  className="pie-segment positive"
                  style={{
                    '--percentage': data.sentiment.positive,
                    '--rotation': 0
                  }}
                ></div>
              </div>
              <div className="pie-stats">
                <div className="pie-stat">
                  <div className="pie-stat-color positive"></div>
                  <div className="pie-stat-info">
                    <span className="pie-stat-label">Positive</span>
                    <span className="pie-stat-value">{data.sentiment.positive}%</span>
                  </div>
                </div>
                <div className="pie-stat">
                  <div className="pie-stat-color neutral"></div>
                  <div className="pie-stat-info">
                    <span className="pie-stat-label">Neutral</span>
                    <span className="pie-stat-value">{data.sentiment.neutral}%</span>
                  </div>
                </div>
                <div className="pie-stat">
                  <div className="pie-stat-color negative"></div>
                  <div className="pie-stat-info">
                    <span className="pie-stat-label">Negative</span>
                    <span className="pie-stat-value">{data.sentiment.negative}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">Priority Distribution</h3>
            <div className="horizontal-bars">
              <div className="horizontal-bar-item">
                <div className="bar-info">
                  <span className="bar-name">High Priority</span>
                  <span className="bar-value">{data.priority.high}%</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill high"
                    style={{ width: `${data.priority.high}%` }}
                  ></div>
                </div>
              </div>

              <div className="horizontal-bar-item">
                <div className="bar-info">
                  <span className="bar-name">Medium Priority</span>
                  <span className="bar-value">{data.priority.medium}%</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill medium"
                    style={{ width: `${data.priority.medium}%` }}
                  ></div>
                </div>
              </div>

              <div className="horizontal-bar-item">
                <div className="bar-info">
                  <span className="bar-name">Low Priority</span>
                  <span className="bar-value">{data.priority.low}%</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill low"
                    style={{ width: `${data.priority.low}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Items Status */}
          <div className="chart-card">
            <h3 className="chart-title">Action Items Status</h3>
            <div className="horizontal-bars">
              <div className="horizontal-bar-item">
                <div className="bar-info">
                  <span className="bar-name">Completed</span>
                  <span className="bar-value">{data.actionItemsStatus.completed}</span>
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
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="horizontal-bar-item">
                <div className="bar-info">
                  <span className="bar-name">In Progress</span>
                  <span className="bar-value">{data.actionItemsStatus.inProgress}</span>
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
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="horizontal-bar-item">
                <div className="bar-info">
                  <span className="bar-name">Pending</span>
                  <span className="bar-value">{data.actionItemsStatus.pending}</span>
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
                      }%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Senders Table */}
        <div className="table-card">
          <h3 className="card-title">Top Senders</h3>
          <div className="senders-table">
            {data.topSenders.map((sender, index) => (
              <div key={index} className="sender-row">
                <div className="sender-rank">#{index + 1}</div>
                <div className="sender-info">
                  <span className="sender-name">{sender.name}</span>
                  <span className={`sender-type ${sender.type}`}>
                    {sender.type === 'email' ? '📧' : '💬'} {sender.type}
                  </span>
                </div>
                <div className="sender-count">{sender.count} messages</div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Section */}
        <div className="insights-section">
          <h3 className="section-title">Key Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">📈</div>
              <div className="insight-content">
                <h4>Communication Volume</h4>
                <p>
                  Your team has exchanged <strong>{data.overview.totalCommunications}</strong> messages
                  this period, showing a <strong>{data.trends.communicationsGrowth}</strong> increase
                  compared to the previous period.
                </p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">😊</div>
              <div className="insight-content">
                <h4>Positive Sentiment</h4>
                <p>
                  <strong>{data.sentiment.positive}%</strong> of your communications have a positive
                  sentiment, indicating good team morale and customer satisfaction.
                </p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">⚡</div>
              <div className="insight-content">
                <h4>Response Time</h4>
                <p>
                  Average response time improved by <strong>{data.trends.averageResponseImprovement}</strong>,
                  now at <strong>{data.overview.averageResponseTime}</strong>. Keep up the great work!
                </p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🎯</div>
              <div className="insight-content">
                <h4>AI Accuracy</h4>
                <p>
                  Our AI analysis is performing at <strong>{data.trends.aiAccuracy}</strong> accuracy,
                  helping you stay on top of important communications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
