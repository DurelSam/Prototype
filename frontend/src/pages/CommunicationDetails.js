import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/CommunicationDetails.css';

function CommunicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [communication, setCommunication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - À remplacer par un vrai appel API
    const mockCommunication = {
      id: parseInt(id),
      type: 'Email',
      from: 'john.doe@company.com',
      to: 'user@company.com',
      cc: ['manager@company.com', 'team@company.com'],
      subject: 'Project Update - Q4 2024',
      body: `Hi Team,

I wanted to share the latest updates on our Q4 projects. We've made significant progress across all initiatives:

1. **Mobile App Development**: 85% complete, on track for December launch
2. **API Integration**: Successfully completed phase 1, moving to phase 2
3. **User Testing**: Received positive feedback from beta testers

Next Steps:
- Final QA testing scheduled for next week
- Documentation updates due Friday
- Team review meeting on Monday at 10 AM

Please let me know if you have any questions or concerns.

Best regards,
John Doe`,
      date: new Date('2024-12-01T10:30:00'),
      read: true,
      attachments: [
        { name: 'Q4_Report.pdf', size: '2.4 MB' },
        { name: 'Project_Timeline.xlsx', size: '1.1 MB' }
      ],
      aiAnalysis: {
        sentiment: 'Positive',
        priority: 'High',
        summary: 'Project status update with positive progress across multiple initiatives',
        keyPoints: [
          'Mobile app 85% complete',
          'API integration phase 1 completed',
          'Positive beta testing feedback'
        ],
        actionItems: [
          'QA testing next week',
          'Documentation updates due Friday',
          'Team meeting Monday 10 AM'
        ],
        entities: ['Q4', 'Mobile App', 'API', 'Beta Testing']
      }
    };

    setTimeout(() => {
      setCommunication(mockCommunication);
      setLoading(false);
    }, 300);
  }, [id]);

  if (loading) {
    return (
      <div className="communication-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!communication) {
    return (
      <div className="communication-details-page">
        <div className="error-container">
          <h2>Communication not found</h2>
          <button onClick={() => navigate('/communications')}>Back to Communications</button>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="communication-details-page">
      <div className="details-header">
        <button className="back-button" onClick={() => navigate('/communications')}>
          ← Back to Communications
        </button>
      </div>

      <div className="details-container">
        {/* Main Content */}
        <div className="main-content">
          <div className="comm-type-indicator" data-type={communication.type.toLowerCase()}>
            {communication.type === 'Email' ? '📧 Email' : '💬 WhatsApp'}
          </div>

          <h1 className="comm-subject">{communication.subject}</h1>

          <div className="comm-metadata">
            <div className="metadata-row">
              <span className="label">From:</span>
              <span className="value">{communication.from}</span>
            </div>
            <div className="metadata-row">
              <span className="label">To:</span>
              <span className="value">{communication.to}</span>
            </div>
            {communication.cc && communication.cc.length > 0 && (
              <div className="metadata-row">
                <span className="label">CC:</span>
                <span className="value">{communication.cc.join(', ')}</span>
              </div>
            )}
            <div className="metadata-row">
              <span className="label">Date:</span>
              <span className="value">{formatDate(communication.date)}</span>
            </div>
          </div>

          <div className="comm-body">
            {communication.body.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {communication.attachments && communication.attachments.length > 0 && (
            <div className="attachments-section">
              <h3>Attachments ({communication.attachments.length})</h3>
              <div className="attachments-list">
                {communication.attachments.map((attachment, index) => (
                  <div key={index} className="attachment-item">
                    <span className="attachment-icon">📎</span>
                    <div className="attachment-info">
                      <span className="attachment-name">{attachment.name}</span>
                      <span className="attachment-size">{attachment.size}</span>
                    </div>
                    <button className="download-button">Download</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Sidebar */}
        <div className="ai-analysis-sidebar">
          <h2 className="sidebar-title">🤖 AI Analysis</h2>

          <div className="analysis-section">
            <h3>Sentiment</h3>
            <div className="sentiment-badge" data-sentiment={communication.aiAnalysis.sentiment.toLowerCase()}>
              {communication.aiAnalysis.sentiment}
            </div>
          </div>

          <div className="analysis-section">
            <h3>Priority</h3>
            <div className="priority-badge" data-priority={communication.aiAnalysis.priority.toLowerCase()}>
              {communication.aiAnalysis.priority}
            </div>
          </div>

          <div className="analysis-section">
            <h3>Summary</h3>
            <p className="summary-text">{communication.aiAnalysis.summary}</p>
          </div>

          <div className="analysis-section">
            <h3>Key Points</h3>
            <ul className="key-points-list">
              {communication.aiAnalysis.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="analysis-section">
            <h3>Action Items</h3>
            <ul className="action-items-list">
              {communication.aiAnalysis.actionItems.map((item, index) => (
                <li key={index}>
                  <input type="checkbox" id={`action-${index}`} />
                  <label htmlFor={`action-${index}`}>{item}</label>
                </li>
              ))}
            </ul>
          </div>

          <div className="analysis-section">
            <h3>Entities</h3>
            <div className="entities-tags">
              {communication.aiAnalysis.entities.map((entity, index) => (
                <span key={index} className="entity-tag">{entity}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunicationDetails;
