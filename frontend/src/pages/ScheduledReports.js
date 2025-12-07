import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faEnvelope,
  faClock,
  faPlus,
  faEdit,
  faTrash,
  faToggleOn,
  faToggleOff,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';
import '../styles/ScheduledReports.css';

function ScheduledReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    recipients: '',
    reportType: 'summary',
    format: 'pdf',
    time: '09:00',
    dayOfWeek: 'monday',
    dayOfMonth: '1',
    isActive: true
  });

  // Mock data - À remplacer par un vrai appel API
  useEffect(() => {
    const mockReports = [
      {
        id: 1,
        name: 'Daily CEO Summary',
        description: 'Executive summary of all communications and escalations',
        frequency: 'daily',
        recipients: ['ceo@company.com', 'manager@company.com'],
        reportType: 'summary',
        format: 'pdf',
        time: '08:00',
        isActive: true,
        lastSent: new Date('2024-12-07T08:00:00'),
        nextScheduled: new Date('2024-12-08T08:00:00')
      },
      {
        id: 2,
        name: 'Weekly Team Performance',
        description: 'Detailed analytics on team performance metrics',
        frequency: 'weekly',
        recipients: ['manager@company.com'],
        reportType: 'analytics',
        format: 'excel',
        time: '10:00',
        dayOfWeek: 'monday',
        isActive: true,
        lastSent: new Date('2024-12-02T10:00:00'),
        nextScheduled: new Date('2024-12-09T10:00:00')
      },
      {
        id: 3,
        name: 'Monthly Escalation Report',
        description: 'Comprehensive report on all escalations and their resolutions',
        frequency: 'monthly',
        recipients: ['ceo@company.com', 'admin@company.com'],
        reportType: 'escalations',
        format: 'pdf',
        time: '09:00',
        dayOfMonth: '1',
        isActive: false,
        lastSent: new Date('2024-11-01T09:00:00'),
        nextScheduled: new Date('2025-01-01T09:00:00')
      }
    ];

    setTimeout(() => {
      setScheduledReports(mockReports);
      setLoading(false);
    }, 500);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: API call to create scheduled report
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newReport = {
        id: scheduledReports.length + 1,
        ...formData,
        recipients: formData.recipients.split(',').map(email => email.trim()),
        lastSent: null,
        nextScheduled: new Date(Date.now() + 86400000) // Tomorrow
      };

      setScheduledReports([...scheduledReports, newReport]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        frequency: 'daily',
        recipients: '',
        reportType: 'summary',
        format: 'pdf',
        time: '09:00',
        dayOfWeek: 'monday',
        dayOfMonth: '1',
        isActive: true
      });
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (reportId) => {
    setScheduledReports(scheduledReports.map(report =>
      report.id === reportId ? { ...report, isActive: !report.isActive } : report
    ));
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      setScheduledReports(scheduledReports.filter(report => report.id !== reportId));
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFrequencyBadge = (frequency) => {
    const badges = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    };
    return badges[frequency] || frequency;
  };

  if (loading && scheduledReports.length === 0) {
    return (
      <div className="scheduled-reports-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading scheduled reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scheduled-reports-page">
      <div className="reports-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Scheduled Reports</h1>
        <button className="create-button" onClick={() => setShowCreateModal(true)}>
          <FontAwesomeIcon icon={faPlus} /> Create Report
        </button>
      </div>

      <div className="reports-container">
        {scheduledReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <h3>No Scheduled Reports</h3>
            <p>Create your first automated report to get started</p>
            <button className="create-button-large" onClick={() => setShowCreateModal(true)}>
              <FontAwesomeIcon icon={faPlus} /> Create Your First Report
            </button>
          </div>
        ) : (
          <div className="reports-grid">
            {scheduledReports.map((report) => (
              <div key={report.id} className={`report-card ${!report.isActive ? 'inactive' : ''}`}>
                <div className="report-header">
                  <div className="report-title-section">
                    <h3 className="report-name">{report.name}</h3>
                    <span className={`frequency-badge ${report.frequency}`}>
                      <FontAwesomeIcon icon={faClock} /> {getFrequencyBadge(report.frequency)}
                    </span>
                  </div>
                  <div className="report-actions">
                    <button
                      className={`toggle-button ${report.isActive ? 'active' : ''}`}
                      onClick={() => handleToggleActive(report.id)}
                      title={report.isActive ? 'Disable' : 'Enable'}
                    >
                      <FontAwesomeIcon icon={report.isActive ? faToggleOn : faToggleOff} />
                    </button>
                    <button
                      className="action-btn edit-btn"
                      title="Edit report"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteReport(report.id)}
                      title="Delete report"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                <p className="report-description">{report.description}</p>

                <div className="report-details">
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faEnvelope} /> Recipients:
                    </span>
                    <span className="detail-value">{report.recipients.join(', ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Report Type:</span>
                    <span className="detail-value capitalize">{report.reportType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faFileExport} /> Format:
                    </span>
                    <span className="detail-value uppercase">{report.format}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faClock} /> Time:
                    </span>
                    <span className="detail-value">{report.time}</span>
                  </div>
                </div>

                <div className="report-schedule">
                  <div className="schedule-item">
                    <span className="schedule-label">Last Sent:</span>
                    <span className="schedule-value">{formatDateTime(report.lastSent)}</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-label">Next Scheduled:</span>
                    <span className="schedule-value highlight">{formatDateTime(report.nextScheduled)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Scheduled Report</h2>
              <button className="close-button" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="report-form">
              <div className="form-group">
                <label htmlFor="name">Report Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Daily CEO Summary"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this report"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="frequency">Frequency *</label>
                  <select
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="time">Time *</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {formData.frequency === 'weekly' && (
                <div className="form-group">
                  <label htmlFor="dayOfWeek">Day of Week *</label>
                  <select
                    id="dayOfWeek"
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div className="form-group">
                  <label htmlFor="dayOfMonth">Day of Month *</label>
                  <select
                    id="dayOfMonth"
                    name="dayOfMonth"
                    value={formData.dayOfMonth}
                    onChange={handleInputChange}
                    required
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reportType">Report Type *</label>
                  <select
                    id="reportType"
                    name="reportType"
                    value={formData.reportType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="summary">Executive Summary</option>
                    <option value="analytics">Team Analytics</option>
                    <option value="escalations">Escalations Report</option>
                    <option value="communications">Communications Overview</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="format">Format *</label>
                  <select
                    id="format"
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="recipients">Recipients (comma-separated emails) *</label>
                <input
                  type="text"
                  id="recipients"
                  name="recipients"
                  value={formData.recipients}
                  onChange={handleInputChange}
                  placeholder="email1@company.com, email2@company.com"
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>Activate immediately</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduledReports;
