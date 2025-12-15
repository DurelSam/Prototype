import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import backgroundImage from '../login-background-image.jpg';
import '../styles/Login.css';

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/auth/verify-email/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès ! Vous allez être redirigé vers la page de connexion...');

        // Rediriger vers login après 3 secondes
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Le lien de vérification est invalide ou a expiré');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur de connexion au serveur');
      console.error('Erreur vérification email:', error);
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) {
      setMessage('Veuillez entrer votre adresse email');
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setResendSuccess(true);
        setMessage('Un nouveau lien de vérification a été envoyé à votre adresse email');
      } else {
        setMessage(data.message || 'Erreur lors de l\'envoi du lien');
      }
    } catch (error) {
      setMessage('Erreur de connexion au serveur');
      console.error('Erreur renvoi email:', error);
    }

    setResendLoading(false);
  };

  return (
    <div className="login-page">
      <img src={backgroundImage} alt="Background" className="login-image" />
      <div className="login-wrapper">
        <div className="login-form" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="login-header">
            <h1>SaaS Communications</h1>
            <h2>Vérification de l'email</h2>
          </div>

          {status === 'verifying' && (
            <div style={{ padding: '40px 20px' }}>
              <div className="spinner" style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ fontSize: '16px', color: '#666' }}>
                Vérification de votre email en cours...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div style={{
                fontSize: '60px',
                color: '#28a745',
                marginBottom: '20px'
              }}>
                ✓
              </div>
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '20px'
              }}>
                {message}
              </div>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Redirection automatique vers la page de connexion...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div style={{
                fontSize: '60px',
                color: '#dc3545',
                marginBottom: '20px'
              }}>
                ✗
              </div>
              <div className="error-message" style={{ marginBottom: '20px' }}>
                {message}
              </div>

              {resendSuccess ? (
                <div style={{
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  padding: '15px',
                  borderRadius: '5px',
                  marginBottom: '20px'
                }}>
                  Email de vérification renvoyé avec succès ! Vérifiez votre boîte mail.
                </div>
              ) : (
                <div>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                    Entrez votre adresse email pour recevoir un nouveau lien de vérification :
                  </p>
                  <div className="input-group" style={{ marginBottom: '15px' }}>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="login-button"
                    style={{ marginBottom: '15px' }}
                  >
                    {resendLoading ? 'Envoi en cours...' : 'Renvoyer le lien de vérification'}
                  </button>
                </div>
              )}

              <div className="login-footer">
                <p>
                  <Link to="/login">Retour à la connexion</Link>
                  {' | '}
                  <Link to="/register">Créer un compte</Link>
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="login-footer" style={{ marginTop: '30px' }}>
              <p>
                <Link to="/login">Se connecter maintenant</Link>
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default VerifyEmail;
