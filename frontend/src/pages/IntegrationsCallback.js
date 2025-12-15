import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/IntegrationsCallback.css';

function IntegrationsCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const email = searchParams.get('email');

    if (error) {
      // Erreur lors du callback OAuth
      setStatus('error');
      setMessage(decodeURIComponent(error));

      // Rediriger vers /integrations après 3 secondes
      setTimeout(() => {
        navigate('/integrations');
      }, 3000);
    } else if (success === 'outlook_connected') {
      // Succès - Outlook connecté
      setStatus('success');
      setMessage(`Outlook successfully connected${email ? ` for ${decodeURIComponent(email)}` : ''}! Redirecting to dashboard...`);

      // ✅ Rafraîchir le contexte Auth pour mettre à jour hasConfiguredEmail
      if (checkAuth && typeof checkAuth === 'function') {
        checkAuth().then(() => {
          // Rediriger vers /dashboard après le refresh
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        });
      } else {
        // Fallback si checkAuth n'est pas disponible
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } else {
      // Cas inattendu
      setStatus('error');
      setMessage('Invalid callback response');

      setTimeout(() => {
        navigate('/integrations');
      }, 2000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="callback-page">
      <div className="callback-overlay"></div>

      <div className="callback-container">
        <div className={`callback-card ${status}`}>
          {/* Loading Spinner ou Icon */}
          <div className="callback-icon">
            {status === 'processing' && (
              <div className="spinner"></div>
            )}
            {status === 'success' && (
              <div className="success-icon">✓</div>
            )}
            {status === 'error' && (
              <div className="error-icon">✗</div>
            )}
          </div>

          {/* Message */}
          <h2 className="callback-title">
            {status === 'processing' && 'Connecting to Outlook...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Connection Failed'}
          </h2>

          <p className="callback-message">{message}</p>

          {/* Bouton de redirection manuelle si besoin */}
          {status !== 'processing' && (
            <button
              className="callback-button"
              onClick={() => navigate('/integrations')}
            >
              Return to Integrations
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IntegrationsCallback;
