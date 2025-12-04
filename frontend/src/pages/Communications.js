import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Communications.css';

function Communications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [communications, setCommunications] = useState([]);
  const [filteredCommunications, setFilteredCommunications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [loading, setLoading] = useState(true);

  // Mock data - À remplacer par un vrai appel API plus tard
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        type: 'Email',
        from: 'john.doe@company.com',
        to: user?.email,
        subject: 'Project Update - Q4 2024',
        body: 'Here is the latest update on our Q4 projects...',
        date: new Date('2024-12-01T10:30:00'),
        read: false,
        aiAnalysis: { sentiment: 'Positive', priority: 'High' }
      },
      {
        id: 2,
        type: 'WhatsApp',
        from: '+1234567890',
        to: user?.email,
        subject: 'Meeting Reminder',
        body: 'Don\'t forget our meeting tomorrow at 2 PM',
        date: new Date('2024-12-02T14:15:00'),
        read: true,
        aiAnalysis: { sentiment: 'Neutral', priority: 'Medium' }
      },
      {
        id: 3,
        type: 'Email',
        from: 'sales@vendor.com',
        to: user?.email,
        subject: 'New Product Launch',
        body: 'We are excited to announce our new product line...',
        date: new Date('2024-11-30T09:00:00'),
        read: true,
        aiAnalysis: { sentiment: 'Positive', priority: 'Low' }
      }
    ];

    setTimeout(() => {
      setCommunications(mockData);
      setFilteredCommunications(mockData);
      setLoading(false);
    }, 500);
  }, [user]);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...communications];

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(comm => comm.type === filterType);
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(comm =>
        comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => b.date - a.date);
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => a.date - b.date);
    } else if (sortBy === 'priority') {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      filtered.sort((a, b) =>
        priorityOrder[a.aiAnalysis.priority] - priorityOrder[b.aiAnalysis.priority]
      );
    }

    setFilteredCommunications(filtered);
  }, [communications, searchTerm, filterType, sortBy]);

  const handleCommunicationClick = (id) => {
    navigate(`/communications/${id}`);
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'Positive': return '😊';
      case 'Neutral': return '😐';
      case 'Negative': return '😟';
      default: return '🤔';
    }
  };

  if (loading) {
    return (
      <div className="communications-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="communications-page">
      <div className="communications-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className="page-title">Communications</h1>
        </div>

        {/* Filters and Search */}
        <div className="controls-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by subject, sender, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label>Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="All">All</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="communications-list">
        {filteredCommunications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No communications found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          filteredCommunications.map((comm) => (
            <div
              key={comm.id}
              className={`communication-card ${!comm.read ? 'unread' : ''}`}
              onClick={() => handleCommunicationClick(comm.id)}
            >
              <div className="comm-type-badge" data-type={comm.type.toLowerCase()}>
                {comm.type === 'Email' ? '📧' : '💬'}
              </div>

              <div className="comm-content">
                <div className="comm-header-row">
                  <h3 className="comm-subject">{comm.subject}</h3>
                  {!comm.read && <span className="unread-dot"></span>}
                </div>

                <div className="comm-meta">
                  <span className="comm-from">From: {comm.from}</span>
                  <span className="comm-date">{formatDate(comm.date)}</span>
                </div>

                <p className="comm-preview">{comm.body.substring(0, 100)}...</p>

                <div className="comm-footer">
                  <div className="ai-tags">
                    <span className="ai-tag sentiment">
                      {getSentimentEmoji(comm.aiAnalysis.sentiment)} {comm.aiAnalysis.sentiment}
                    </span>
                    <span
                      className="ai-tag priority"
                      style={{ borderColor: getPriorityColor(comm.aiAnalysis.priority) }}
                    >
                      {comm.aiAnalysis.priority} Priority
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
}

export default Communications;
