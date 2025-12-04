import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Integrations.css';

function Integrations() {
  const navigate = useNavigate();
  const [activeService, setActiveService] = useState(null);

  // Integration status (mock data)
  const [integrations, setIntegrations] = useState({
    outlook: {
      connected: false,
      email: '',
      lastSync: null,
      messagesCount: 0
    },
    whatsapp: {
      connected: false,
      phoneNumber: '',
      lastSync: null,
      messagesCount: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Outlook Form State
  const [outlookForm, setOutlookForm] = useState({
    email: '',
    password: '',
    clientId: '',
    clientSecret: ''
  });

  // WhatsApp Form State
  const [whatsappForm, setWhatsappForm] = useState({
    phoneNumber: '',
    apiKey: '',
    webhookUrl: ''
  });

  const handleOutlookChange = (e) => {
    setOutlookForm({
      ...outlookForm,
      [e.target.name]: e.target.value
    });
  };

  const handleWhatsAppChange = (e) => {
    setWhatsappForm({
      ...whatsappForm,
      [e.target.name]: e.target.value
    });
  };

  const handleOutlookConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to connect Outlook
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrations({
        ...integrations,
        outlook: {
          connected: true,
          email: outlookForm.email,
          lastSync: new Date(),
          messagesCount: 0
        }
      });

      setMessage({ type: 'success', text: 'Outlook connected successfully!' });
      setActiveService(null);
      setOutlookForm({ email: '', password: '', clientId: '', clientSecret: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect Outlook. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to connect WhatsApp
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrations({
        ...integrations,
        whatsapp: {
          connected: true,
          phoneNumber: whatsappForm.phoneNumber,
          lastSync: new Date(),
          messagesCount: 0
        }
      });

      setMessage({ type: 'success', text: 'WhatsApp connected successfully!' });
      setActiveService(null);
      setWhatsappForm({ phoneNumber: '', apiKey: '', webhookUrl: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect WhatsApp. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (service) => {
    if (!window.confirm(`Are you sure you want to disconnect ${service}?`)) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to disconnect
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIntegrations({
        ...integrations,
        [service]: {
          connected: false,
          email: '',
          phoneNumber: '',
          lastSync: null,
          messagesCount: 0
        }
      });

      setMessage({ type: 'success', text: `${service.charAt(0).toUpperCase() + service.slice(1)} disconnected successfully!` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (service) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to sync
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIntegrations({
        ...integrations,
        [service]: {
          ...integrations[service],
          lastSync: new Date(),
          messagesCount: integrations[service].messagesCount + Math.floor(Math.random() * 10)
        }
      });

      setMessage({ type: 'success', text: 'Sync completed successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Sync failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatLastSync = (date) => {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="integrations-page">
      <div className="integrations-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Integrations</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="integrations-grid">
        {/* Outlook Integration Card */}
        <div className={`integration-card ${integrations.outlook.connected ? 'connected' : ''}`}>
          <div className="card-header">
            <div className="service-info">
              <div className="service-icon outlook">📧</div>
              <div>
                <h2 className="service-name">Outlook</h2>
                <p className="service-description">Sync your Outlook emails</p>
              </div>
            </div>
            <div className={`status-badge ${integrations.outlook.connected ? 'connected' : 'disconnected'}`}>
              {integrations.outlook.connected ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          {integrations.outlook.connected ? (
            <div className="card-body">
              <div className="connection-details">
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{integrations.outlook.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Sync:</span>
                  <span className="detail-value">{formatLastSync(integrations.outlook.lastSync)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Messages:</span>
                  <span className="detail-value">{integrations.outlook.messagesCount}</span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="sync-button"
                  onClick={() => handleSync('outlook')}
                  disabled={loading}
                >
                  🔄 Sync Now
                </button>
                <button
                  className="disconnect-button"
                  onClick={() => handleDisconnect('outlook')}
                  disabled={loading}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="card-body">
              {activeService === 'outlook' ? (
                <form onSubmit={handleOutlookConnect} className="integration-form">
                  <div className="form-group">
                    <label htmlFor="outlook-email">Email Address</label>
                    <input
                      type="email"
                      id="outlook-email"
                      name="email"
                      value={outlookForm.email}
                      onChange={handleOutlookChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="outlook-password">Password</label>
                    <input
                      type="password"
                      id="outlook-password"
                      name="password"
                      value={outlookForm.password}
                      onChange={handleOutlookChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="outlook-clientId">Client ID (Optional)</label>
                    <input
                      type="text"
                      id="outlook-clientId"
                      name="clientId"
                      value={outlookForm.clientId}
                      onChange={handleOutlookChange}
                      placeholder="For OAuth authentication"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="outlook-clientSecret">Client Secret (Optional)</label>
                    <input
                      type="password"
                      id="outlook-clientSecret"
                      name="clientSecret"
                      value={outlookForm.clientSecret}
                      onChange={handleOutlookChange}
                      placeholder="For OAuth authentication"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="connect-button" disabled={loading}>
                      {loading ? 'Connecting...' : 'Connect'}
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setActiveService(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="setup-button"
                  onClick={() => setActiveService('outlook')}
                >
                  Set Up Outlook
                </button>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp Integration Card */}
        <div className={`integration-card ${integrations.whatsapp.connected ? 'connected' : ''}`}>
          <div className="card-header">
            <div className="service-info">
              <div className="service-icon whatsapp">💬</div>
              <div>
                <h2 className="service-name">WhatsApp Business</h2>
                <p className="service-description">Integrate WhatsApp messages</p>
              </div>
            </div>
            <div className={`status-badge ${integrations.whatsapp.connected ? 'connected' : 'disconnected'}`}>
              {integrations.whatsapp.connected ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          {integrations.whatsapp.connected ? (
            <div className="card-body">
              <div className="connection-details">
                <div className="detail-item">
                  <span className="detail-label">Phone Number:</span>
                  <span className="detail-value">{integrations.whatsapp.phoneNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Sync:</span>
                  <span className="detail-value">{formatLastSync(integrations.whatsapp.lastSync)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Messages:</span>
                  <span className="detail-value">{integrations.whatsapp.messagesCount}</span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="sync-button"
                  onClick={() => handleSync('whatsapp')}
                  disabled={loading}
                >
                  🔄 Sync Now
                </button>
                <button
                  className="disconnect-button"
                  onClick={() => handleDisconnect('whatsapp')}
                  disabled={loading}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="card-body">
              {activeService === 'whatsapp' ? (
                <form onSubmit={handleWhatsAppConnect} className="integration-form">
                  <div className="form-group">
                    <label htmlFor="whatsapp-phone">Phone Number</label>
                    <input
                      type="tel"
                      id="whatsapp-phone"
                      name="phoneNumber"
                      value={whatsappForm.phoneNumber}
                      onChange={handleWhatsAppChange}
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="whatsapp-apiKey">API Key</label>
                    <input
                      type="text"
                      id="whatsapp-apiKey"
                      name="apiKey"
                      value={whatsappForm.apiKey}
                      onChange={handleWhatsAppChange}
                      placeholder="Your WhatsApp Business API key"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="whatsapp-webhook">Webhook URL (Optional)</label>
                    <input
                      type="url"
                      id="whatsapp-webhook"
                      name="webhookUrl"
                      value={whatsappForm.webhookUrl}
                      onChange={handleWhatsAppChange}
                      placeholder="https://your-webhook-url.com"
                    />
                  </div>

                  <div className="info-box">
                    <p><strong>Note:</strong> You need a WhatsApp Business API account to use this integration.
                    Visit the <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp Business API documentation</a> for more information.</p>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="connect-button" disabled={loading}>
                      {loading ? 'Connecting...' : 'Connect'}
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setActiveService(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="setup-button"
                  onClick={() => setActiveService('whatsapp')}
                >
                  Set Up WhatsApp
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="info-section">
        <h3>About Integrations</h3>
        <p>Connect your communication platforms to centralize all your messages in one place.
        Our AI will analyze your communications and provide insights to help you stay organized and productive.</p>

        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">✅</span>
            <span>Automatic synchronization</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <span>AI-powered analysis</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span>Secure and encrypted</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Real-time insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Integrations;
